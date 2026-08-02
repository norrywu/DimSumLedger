"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { VariantActionResult } from "@/types/variants";
import {
  VariantInput,
  variantSchema,
} from "@/validations/variants-validation";

/**
 * Menerjemahkan kode error Postgres jadi kalimat yang bisa dibaca pengelola.
 *
 * 23505 = unique_violation, dari `unique (product_id, nama)`. Perhatikan
 * lingkupnya BEDA dari produk: yang dilarang cuma nama kembar di dalam satu
 * produk, jadi kalimatnya wajib menyebut produknya. "Original" di dua produk
 * berbeda justru sah, dan pesan seperti "Nama itu sudah dipakai" akan terbaca
 * seolah nama varian harus unik se-aplikasi.
 * 42501 = insufficient_privilege, artinya RLS menolak. Terjadi kalau yang login
 * bukan owner/admin (lihat `internal.is_pengelola()`). Kalimatnya netral
 * ("mengelola") supaya satu pesan melayani simpan dan hapus.
 *
 * 23503 = foreign_key_violation, dan artinya BERBEDA tergantung operasi: saat
 * simpan berarti produk pilihannya sudah dihapus orang lain, saat hapus berarti
 * variannya masih dirujuk tabel lain. Karena itu kalimatnya dioper pemanggil,
 * bukan ditebak di sini.
 *
 * 23514 dan 22003 datang dari check constraint dan batas `numeric(12,2)` /
 * `smallint`. Keduanya mestinya sudah dicegat `variantSchema` lebih dulu;
 * dipetakan di sini sebagai jaring pengaman, bukan jalur utama.
 */
function errorMessage(
  code: string | undefined,
  pesanRelasi: string,
  fallback: string,
) {
  if (code === "23505") return "Produk ini sudah punya varian bernama itu.";
  if (code === "23503") return pesanRelasi;
  if (code === "42501") return "Kamu tidak punya akses mengelola varian.";
  if (code === "23514") return "Harga, modal, atau jumlah pcs tidak masuk akal.";
  if (code === "22003") return "Nilai harga atau modal terlalu besar.";
  return fallback;
}

/**
 * Pesan pertama dari kegagalan zod; dipakai `createVarian` dan `updateVarian`.
 *
 * Tipenya diikat ke `VariantInput`, bukan dibikin generik: `fieldErrors` adalah
 * mapped type atas kunci skemanya, dan dengan parameter tipe yang belum
 * terpecahkan `Object.values` menyerah jadi `{}[]` — pesannya lalu gagal
 * dianggap string.
 */
function validationMessage(error: z.ZodError<VariantInput>) {
  const { fieldErrors } = z.flattenError(error);

  return (
    Object.values(fieldErrors).flat().at(0) ?? "Periksa kembali isian kamu."
  );
}

/**
 * Produk pilihannya sudah lenyap saat form dikirim — mis. dihapus orang lain di
 * tab sebelah. Sama untuk simpan maupun ubah.
 */
const PESAN_PRODUK_HILANG =
  "Produk yang dipilih sudah tidak ada. Muat ulang halaman.";

/**
 * File ini khusus operasi TULIS. Pembacaan ada di `@/clients/variants`.
 *
 * Kegagalan dikembalikan sebagai nilai, bukan dilempar — lihat
 * `VariantActionResult` untuk alasannya. Pemanggil di sisi client yang
 * memutuskan mau melempar atau tidak.
 */
export async function createVarian(
  input: VariantInput,
): Promise<VariantActionResult> {
  // zodResolver di dalam `TriggerSheet` sudah memvalidasi di browser, tapi
  // Server Action tetap bisa dijangkau lewat POST langsung — jadi jangan
  // percaya kiriman client. Aman diparse ulang meski angkanya sudah number:
  // `variantSchema` menerima string maupun number.
  const parsed = variantSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("variants").insert(parsed.data);

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        PESAN_PRODUK_HILANG,
        `Gagal menyimpan: ${error.message}`,
      ),
    };
  }

  return {
    success: true,
    message: `Varian "${parsed.data.nama}" ditambahkan.`,
  };
}

/**
 * Memperbarui varian, termasuk memindahkannya ke produk lain. Menyimpan ulang
 * nama yang sama persis tidak melanggar `unique (product_id, nama)` — Postgres
 * tidak menganggap baris bentrok dengan dirinya sendiri.
 */
export async function updateVarian(
  id: string,
  input: VariantInput,
): Promise<VariantActionResult> {
  const parsed = variantSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("variants")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        PESAN_PRODUK_HILANG,
        `Gagal menyimpan: ${error.message}`,
      ),
    };
  }

  return {
    success: true,
    message: `Varian "${parsed.data.nama}" diperbarui.`,
  };
}

/**
 * Tidak ada validasi zod di sini karena tidak ada isian pengguna: `id` datang
 * dari baris yang memang barusan dibaca dari database. Kalau id-nya dikarang
 * lewat POST langsung, RLS dan tipe kolom uuid yang menolaknya.
 */
export async function deleteVarian(id: string): Promise<VariantActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("variants").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        "Varian ini masih dipakai transaksi lain.",
        `Gagal menghapus: ${error.message}`,
      ),
    };
  }

  return { success: true, message: "Varian dihapus." };
}
