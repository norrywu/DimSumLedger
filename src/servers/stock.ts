"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { StockActionResult } from "@/types/stock";
import {
  stockHistorySchema,
  type StockHistoryInput,
} from "@/validations/stock-validation";

function errorMessage(
  code: string | undefined,
  fallback: string,
  pesanDatabase?: string,
) {
  if (code === "P0001" && pesanDatabase) return pesanDatabase;
  if (code === "23514")
    return "Ada isian yang tidak masuk akal. Periksa jumlah dan catatan.";
  if (code === "42501") return "Kamu tidak punya akses mengelola stok.";

  return fallback;
}

function validationMessage(error: z.ZodError<StockHistoryInput>) {
  const { fieldErrors } = z.flattenError(error);

  return (
    Object.values(fieldErrors).flat().at(0) ?? "Periksa kembali isian kamu."
  );
}

export async function catatStok(
  input: StockHistoryInput,
): Promise<StockActionResult> {
  const parsed = stockHistorySchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("catat_stok", {
    p_product_id: parsed.data.product_id,
    p_jenis: parsed.data.jenis,
    p_jumlah_pcs: parsed.data.jumlah_pcs,
    p_catatan: parsed.data.catatan ?? "",
    p_tanggal: parsed.data.tanggal,
  });

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        `Gagal mencatat stok: ${error.message}`,
        error.message,
      ),
    };
  }

  return {
    success: true,
    message:
      parsed.data.jenis === "masuk"
        ? `Stok ditambah ${parsed.data.jumlah_pcs.toLocaleString("id-ID")} pcs.`
        : `Stok dikurangi ${parsed.data.jumlah_pcs.toLocaleString("id-ID")} pcs.`,
  };
}

export async function ubahRiwayatStok(
  id: string,
  input: StockHistoryInput,
): Promise<StockActionResult> {
  const parsed = stockHistorySchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("ubah_riwayat_stok", {
    p_id: id,
    p_jenis: parsed.data.jenis,
    p_jumlah_pcs: parsed.data.jumlah_pcs,
    p_catatan: parsed.data.catatan ?? "",
    p_tanggal: parsed.data.tanggal,
  });

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        `Gagal memperbarui catatan stok: ${error.message}`,
        error.message,
      ),
    };
  }

  return { success: true, message: "Catatan riwayat stok diperbarui." };
}

export async function hapusRiwayatStok(
  id: string,
): Promise<StockActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("hapus_riwayat_stok", {
    p_id: id,
  });

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        `Gagal menghapus catatan stok: ${error.message}`,
        error.message,
      ),
    };
  }

  return { success: true, message: "Catatan riwayat stok dihapus." };
}
