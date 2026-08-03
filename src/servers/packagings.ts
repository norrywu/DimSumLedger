"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { PackagingActionResult } from "@/types/packagings";
import {
  PackagingInput,
  packagingSchema,
} from "@/validations/packagings-validation";

function errorMessage(code: string | undefined, fallback: string) {
  if (code === "23505") return "Nama kemasan itu sudah dipakai.";
  if (code === "23503") return "Kemasan ini masih dipakai varian.";
  if (code === "42501") return "Kamu tidak punya akses mengelola kemasan.";
  if (code === "23514") return "Harga satuan atau nama kemasan tidak valid.";

  if (code === "22003") return "Nilai harga terlalu besar.";
  return fallback;
}

function validationMessage(error: z.ZodError<PackagingInput>) {
  const { fieldErrors } = z.flattenError(error);

  return (
    Object.values(fieldErrors).flat().at(0) ?? "Periksa kembali isian kamu."
  );
}

export async function createKemasan(
  input: PackagingInput,
): Promise<PackagingActionResult> {
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
