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
  if (code === "23503") return "Kategori ini masih dipakai produk lain.";
  if (code === "42501") return "Kamu tidak punya akses mengubah kategori.";
  return fallback;
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
    const { fieldErrors } = z.flattenError(parsed.error);
    const firstError = Object.values(fieldErrors).flat().at(0);

    return {
      success: false,
      message: firstError ?? "Periksa kembali isian kamu.",
    };
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
