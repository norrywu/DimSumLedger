"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { ProductActionResult } from "@/types/products";
import { ProductInput, productSchema } from "@/validations/products-validation";

/**
 * Menerjemahkan kode error Postgres jadi kalimat yang bisa dibaca kasir.
 *
 * 23505 = unique_violation, dari index `products_nama_uniq` yang memakai
 * lower(nama) — jadi "Siomay" dan "siomay" dianggap sama.
 * 42501 = insufficient_privilege, artinya RLS menolak. Terjadi kalau yang
 * login bukan owner/admin (lihat `internal.is_pengelola()`). Kalimatnya
 * netral ("mengelola") supaya satu pesan melayani simpan dan hapus.
 *
 * 23503 = foreign_key_violation, dan artinya BERBEDA tergantung operasi: saat
 * simpan berarti kategori pilihannya sudah dihapus orang lain, saat hapus
 * berarti produknya masih dirujuk tabel lain. Karena itu kalimatnya dioper
 * pemanggil, bukan ditebak di sini.
 */
function errorMessage(
  code: string | undefined,
  pesanRelasi: string,
  fallback: string,
) {
  if (code === "23514")
    return "Nama produk tidak boleh kosong, berspasi di ujung, atau lebih dari 50 karakter.";

  if (code === "23503") return pesanRelasi;
  if (code === "42501") return "Kamu tidak punya akses mengelola produk.";

  return fallback;
}

/**
 * Pesan pertama dari kegagalan zod; dipakai `createProduk` dan `updateProduk`.
 *
 * Tipenya diikat ke `ProductInput`, bukan dibikin generik: `fieldErrors` adalah
 * mapped type atas kunci skemanya, dan dengan parameter tipe yang belum
 * terpecahkan `Object.values` menyerah jadi `{}[]` — pesannya lalu gagal
 * dianggap string.
 */
function validationMessage(error: z.ZodError<ProductInput>) {
  const { fieldErrors } = z.flattenError(error);

  return (
    Object.values(fieldErrors).flat().at(0) ?? "Periksa kembali isian kamu."
  );
}

/**
 * Kategori pilihannya sudah lenyap saat form dikirim — mis. dihapus orang lain
 * di tab sebelah. Sama untuk simpan maupun ubah.
 */
const PESAN_KATEGORI_HILANG =
  "Kategori yang dipilih sudah tidak ada. Muat ulang halaman.";

/**
 * File ini khusus operasi TULIS. Pembacaan ada di `@/clients/products`.
 *
 * Kegagalan dikembalikan sebagai nilai, bukan dilempar — lihat
 * `ProductActionResult` untuk alasannya. Pemanggil di sisi client yang
 * memutuskan mau melempar atau tidak.
 */
export async function createProduk(
  input: ProductInput,
): Promise<ProductActionResult> {
  // zodResolver di dalam `TriggerSheet` sudah memvalidasi di browser, tapi
  // Server Action tetap bisa dijangkau lewat POST langsung — jadi jangan
  // percaya kiriman client.
  const parsed = productSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(parsed.data);

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        PESAN_KATEGORI_HILANG,
        `Gagal menyimpan: ${error.message}`,
      ),
    };
  }

  return {
    success: true,
    message: `Produk "${parsed.data.nama}" ditambahkan.`,
  };
}

/**
 * Memperbarui nama dan/atau kategori produk. Menyimpan ulang nama yang sama
 * persis tidak melanggar `products_nama_uniq` — Postgres tidak menganggap baris
 * bentrok dengan dirinya sendiri.
 */
export async function updateProduk(
  id: string,
  input: ProductInput,
): Promise<ProductActionResult> {
  const parsed = productSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        PESAN_KATEGORI_HILANG,
        `Gagal menyimpan: ${error.message}`,
      ),
    };
  }

  return {
    success: true,
    message: `Produk "${parsed.data.nama}" diperbarui.`,
  };
}

/**
 * Tidak ada validasi zod di sini karena tidak ada isian pengguna: `id` datang
 * dari baris yang memang barusan dibaca dari database. Kalau id-nya dikarang
 * lewat POST langsung, RLS dan tipe kolom uuid yang menolaknya.
 */
export async function deleteProduk(id: string): Promise<ProductActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        "Produk ini masih dipakai transaksi lain.",
        `Gagal menghapus: ${error.message}`,
      ),
    };
  }

  return { success: true, message: "Produk dihapus beserta variannya." };
}
