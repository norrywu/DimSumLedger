"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { ModifierActionResult } from "@/types/modifiers";
import {
  ModifierInput,
  modifierSchema,
} from "@/validations/modifiers-validation";

function errorMessage(code: string | undefined, fallback: string) {
  if (code === "23505") return "Nama extra itu sudah dipakai.";
  if (code === "23503") return "Extra ini masih dipakai transaksi.";
  if (code === "42501") return "Kamu tidak punya akses mengelola extra.";
  if (code === "22003") return "Nilai harga terlalu besar.";
  return fallback;
}

function validationMessage(error: z.ZodError<ModifierInput>) {
  const { fieldErrors } = z.flattenError(error);

  return (
    Object.values(fieldErrors).flat().at(0) ?? "Periksa kembali isian kamu."
  );
}

export async function createExtra(
  input: ModifierInput,
): Promise<ModifierActionResult> {
  const parsed = modifierSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("modifiers").insert(parsed.data);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menyimpan: ${error.message}`),
    };
  }

  return { success: true, message: `Extra "${parsed.data.nama}" ditambahkan.` };
}

export async function updateExtra(
  id: string,
  input: ModifierInput,
): Promise<ModifierActionResult> {
  const parsed = modifierSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("modifiers")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menyimpan: ${error.message}`),
    };
  }

  return { success: true, message: `Extra "${parsed.data.nama}" diperbarui.` };
}

export async function deleteExtra(id: string): Promise<ModifierActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("modifiers").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menghapus: ${error.message}`),
    };
  }

  return { success: true, message: "Extra dihapus." };
}
