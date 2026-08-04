"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { TransaksiActionResult } from "@/types/cashier";
import {
  TransaksiInput,
  transaksiSchema,
} from "@/validations/cashier-validation";

function errorMessage(
  code: string | undefined,
  fallback: string,
  pesanDatabase?: string,
  pesanAkses = "Kamu tidak punya akses mencatat transaksi.",
) {
  if (code === "P0001" && pesanDatabase) return pesanDatabase;
  if (code === "42501") return pesanAkses;
  if (code === "23514") return "Ada nilai yang tidak masuk akal di keranjang.";
  if (code === "22003") return "Nilai transaksi terlalu besar.";
  return fallback;
}

function validationMessage(error: z.ZodError<TransaksiInput>) {
  const { fieldErrors } = z.flattenError(error);

  return (
    Object.values(fieldErrors).flat().at(0) ?? "Periksa kembali isian kamu."
  );
}

export async function simpanTransaksi(
  input: TransaksiInput,
): Promise<TransaksiActionResult> {
  const parsed = transaksiSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("simpan_transaksi", {
    p_items: parsed.data.items,
    p_dibayar: parsed.data.dibayar,
  });

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        `Gagal menyimpan: ${error.message}`,
        error.message,
      ),
    };
  }

  return { success: true, message: "Transaksi tersimpan.", id: data };
}

export async function batalkanTransaksi(
  id: string,
): Promise<TransaksiActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("batalkan_transaksi", { p_id: id });

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        `Gagal membatalkan: ${error.message}`,
        error.message,
        "Kamu tidak punya akses membatalkan transaksi.",
      ),
    };
  }

  return { success: true, message: "Transaksi dibatalkan.", id };
}
