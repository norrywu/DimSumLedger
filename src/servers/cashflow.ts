"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { CashFlowActionResult } from "@/types/cashflow";
import {
  cashFlowSchema,
  type CashFlowInput,
} from "@/validations/cashflow-validation";

/**
 * 23514 = check_violation, dari `amount > 0` atau constraint kategori.
 * 23505 = unique_violation, hanya bisa datang dari `cash_flow_pos_harian_uniq`.
 * 42501 = insufficient_privilege — RLS menolak, artinya yang login bukan
 * owner/admin.
 * P0001 = raise_exception dari `setor_omzet_harian`, pesannya sudah ramah.
 */
function errorMessage(
  code: string | undefined,
  fallback: string,
  pesanDatabase?: string,
) {
  if (code === "P0001" && pesanDatabase) return pesanDatabase;
  if (code === "23514")
    return "Ada isian yang tidak masuk akal. Periksa jumlah dan kategori.";
  if (code === "23505") return "Omzet tanggal itu sudah pernah disetor.";
  if (code === "42501") return "Kamu tidak punya akses mengelola arus kas.";

  return fallback;
}

function validationMessage(error: z.ZodError<CashFlowInput>) {
  const { fieldErrors } = z.flattenError(error);

  return (
    Object.values(fieldErrors).flat().at(0) ?? "Periksa kembali isian kamu."
  );
}

export async function createCashFlow(
  input: CashFlowInput,
): Promise<CashFlowActionResult> {
  const parsed = cashFlowSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cash_flow").insert(parsed.data);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menyimpan: ${error.message}`),
    };
  }

  return { success: true, message: "Catatan arus kas ditambahkan." };
}

export async function updateCashFlow(
  id: string,
  input: CashFlowInput,
): Promise<CashFlowActionResult> {
  const parsed = cashFlowSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const supabase = await createClient();

  // `source` sengaja tidak ikut diubah: baris 'pos' adalah cerminan penjualan,
  // dan mengubahnya jadi 'manual' akan melepaskannya dari unique index
  // sehingga setoran berikutnya membuat baris kembar.
  const { error } = await supabase
    .from("cash_flow")
    .update(parsed.data)
    .eq("id", id)
    .eq("source", "manual");

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menyimpan: ${error.message}`),
    };
  }

  return { success: true, message: "Catatan arus kas diperbarui." };
}

export async function deleteCashFlow(
  id: string,
): Promise<CashFlowActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("cash_flow").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menghapus: ${error.message}`),
    };
  }

  return { success: true, message: "Catatan arus kas dihapus." };
}

/**
 * Tanggalnya saja yang dikirim — jumlahnya dihitung `setor_omzet_harian` dari
 * tabel `transaksi`, bukan dipercayakan ke layar.
 */
export async function setorOmzet(
  tanggal: string,
): Promise<CashFlowActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("setor_omzet_harian", {
    p_tanggal: tanggal,
  });

  if (error) {
    return {
      success: false,
      message: errorMessage(
        error.code,
        `Gagal menyetor: ${error.message}`,
        error.message,
      ),
    };
  }

  return {
    success: true,
    message: `Omzet ${tanggal} disetor: ${data ?? 0}.`,
  };
}
