"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { CategoryActionResult } from "@/types/categories";
import {
  CategoryInput,
  categorySchema,
} from "@/validations/categories-validation";

/**
 * Menerjemahkan kode error Postgres jadi kalimat yang bisa dibaca kasir.
 *
 * 23505 = unique_violation, dari index `categories_nama_uniq` yang memakai
 * lower(nama) — jadi "Minuman" dan "minuman" dianggap sama.
 * 23503 = foreign_key_violation. `products.category_id` memakai
 * `on delete restrict`, jadi kategori yang masih dipakai menolak dihapus.
 * 42501 = insufficient_privilege, artinya RLS menolak. Terjadi kalau yang
 * login bukan owner/admin (lihat `internal.is_pengelola()`).
 */
function errorMessage(code: string | undefined, fallback: string) {
  if (code === "23505") return "Nama kategori itu sudah dipakai.";
  if (code === "23514")
    return "Nama kategori tidak boleh kosong, berspasi di ujung, atau lebih dari 50 karakter.";
  if (code === "23503") return "Kategori ini masih dipakai produk lain.";
  if (code === "42501") return "Kamu tidak punya akses mengubah kategori.";
  return fallback;
}

/**
 * Pesan pertama dari kegagalan zod; dipakai `createKategori` dan
 * `updateKategori`.
 *
 * Tipenya diikat ke `CategoryInput`, bukan dibikin generik: `fieldErrors`
 * adalah mapped type atas kunci skemanya, dan dengan parameter tipe yang belum
 * terpecahkan `Object.values` menyerah jadi `{}[]` — pesannya lalu gagal
 * dianggap string.
 */
function validationMessage(error: z.ZodError<CategoryInput>) {
  const { fieldErrors } = z.flattenError(error);

  return (
    Object.values(fieldErrors).flat().at(0) ?? "Periksa kembali isian kamu."
  );
}

/**
 * File ini khusus operasi TULIS. Pembacaan ada di `@/clients/categories`,
 * lewat browser client, supaya tidak kena antrean Server Action.
 *
 * Kegagalan dikembalikan sebagai nilai, bukan dilempar — lihat
 * `CategoryActionResult` untuk alasannya. Pemanggil di sisi client yang
 * memutuskan mau melempar atau tidak.
 */
export async function createKategori(
  input: CategoryInput,
): Promise<CategoryActionResult> {
  // zodResolver sudah memvalidasi di browser, tapi Server Action tetap bisa
  // dijangkau lewat POST langsung — jadi jangan percaya kiriman client.
  const parsed = categorySchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(parsed.data);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menyimpan: ${error.message}`),
    };
  }

  return {
    success: true,
    message: `Kategori "${parsed.data.nama}" ditambahkan.`,
  };
}

/**
 * Menyimpan ulang nama yang sama persis tidak melanggar `categories_nama_uniq`
 * — Postgres tidak menganggap baris bentrok dengan dirinya sendiri.
 */
export async function updateKategori(
  id: string,
  input: CategoryInput,
): Promise<CategoryActionResult> {
  const parsed = categorySchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menyimpan: ${error.message}`),
    };
  }

  return {
    success: true,
    message: `Kategori "${parsed.data.nama}" diperbarui.`,
  };
}

export async function deleteKategori(
  id: string,
): Promise<CategoryActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menghapus: ${error.message}`),
    };
  }

  return { success: true, message: "Kategori dihapus." };
}
