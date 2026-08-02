"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { PackagingActionResult } from "@/types/packagings";
import {
  PackagingInput,
  packagingSchema,
} from "@/validations/packagings-validation";

/**
 * Menerjemahkan kode error Postgres jadi kalimat yang bisa dibaca pengelola.
 *
 * 23505 = unique_violation, dari index `packagings_nama_uniq` yang memakai
 * lower(nama) — jadi "Mika 10" dan "mika 10" dianggap sama. Lingkupnya global,
 * beda dari varian yang unique-nya per produk, jadi pesannya tidak perlu
 * menyebut induk apa pun.
 * 23503 = foreign_key_violation. `variant_packagings.packaging_id` memakai
 * `on delete restrict`, jadi kemasan yang masih dipakai menolak dihapus. Cuma
 * punya satu arti di sini — tidak seperti varian, tidak ada relasi yang bisa
 * putus saat menyimpan, karena tabel ini tidak punya foreign key keluar.
 * 42501 = insufficient_privilege, artinya RLS menolak. Terjadi kalau yang login
 * bukan owner/admin (lihat `internal.is_pengelola()`).
 *
 * 23514 dan 22003 datang dari `check (harga_satuan >= 0)` dan batas
 * `numeric(12,2)`. Keduanya mestinya sudah dicegat `packagingSchema` lebih
 * dulu; dipetakan di sini sebagai jaring pengaman, bukan jalur utama.
 */
function errorMessage(code: string | undefined, fallback: string) {
  if (code === "23505") return "Nama kemasan itu sudah dipakai.";
  if (code === "23503") return "Kemasan ini masih dipakai varian.";
  if (code === "42501") return "Kamu tidak punya akses mengelola kemasan.";
  if (code === "23514") return "Harga satuan tidak masuk akal.";
  if (code === "22003") return "Nilai harga terlalu besar.";
  return fallback;
}

/**
 * Pesan pertama dari kegagalan zod; dipakai `createKemasan` dan `updateKemasan`.
 *
 * Tipenya diikat ke `PackagingInput`, bukan dibikin generik: `fieldErrors`
 * adalah mapped type atas kunci skemanya, dan dengan parameter tipe yang belum
 * terpecahkan `Object.values` menyerah jadi `{}[]` — pesannya lalu gagal
 * dianggap string.
 */
function validationMessage(error: z.ZodError<PackagingInput>) {
  const { fieldErrors } = z.flattenError(error);

  return (
    Object.values(fieldErrors).flat().at(0) ?? "Periksa kembali isian kamu."
  );
}

/**
 * File ini khusus operasi TULIS. Pembacaan ada di `@/clients/packagings`.
 *
 * Kegagalan dikembalikan sebagai nilai, bukan dilempar — lihat
 * `PackagingActionResult` untuk alasannya. Pemanggil di sisi client yang
 * memutuskan mau melempar atau tidak.
 */
export async function createKemasan(
  input: PackagingInput,
): Promise<PackagingActionResult> {
  // zodResolver di dalam `TriggerSheet` sudah memvalidasi di browser, tapi
  // Server Action tetap bisa dijangkau lewat POST langsung — jadi jangan
  // percaya kiriman client. Aman diparse ulang meski harganya sudah number:
  // `currencyField()` menerima string maupun number.
  const parsed = packagingSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("packagings").insert(parsed.data);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menyimpan: ${error.message}`),
    };
  }

  return {
    success: true,
    message: `Kemasan "${parsed.data.nama}" ditambahkan.`,
  };
}

/**
 * Menyimpan ulang nama yang sama persis tidak melanggar `packagings_nama_uniq`
 * — Postgres tidak menganggap baris bentrok dengan dirinya sendiri.
 */
export async function updateKemasan(
  id: string,
  input: PackagingInput,
): Promise<PackagingActionResult> {
  const parsed = packagingSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("packagings")
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
    message: `Kemasan "${parsed.data.nama}" diperbarui.`,
  };
}

/**
 * Tidak ada validasi zod di sini karena tidak ada isian pengguna: `id` datang
 * dari baris yang memang barusan dibaca dari database. Kalau id-nya dikarang
 * lewat POST langsung, RLS dan tipe kolom uuid yang menolaknya.
 */
export async function deleteKemasan(
  id: string,
): Promise<PackagingActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("packagings").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menghapus: ${error.message}`),
    };
  }

  return { success: true, message: "Kemasan dihapus." };
}
