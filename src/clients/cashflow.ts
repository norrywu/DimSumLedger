import { createClient } from "@/lib/supabase/client";
import type { CashFlow } from "@/types/cashflow";

export async function getCashFlow(
  dari: string,
  sampai: string,
): Promise<CashFlow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cash_flow")
    .select(
      "id, type, amount, category, description, source, transaction_date, created_at",
    )
    .gte("transaction_date", dari)
    .lte("transaction_date", sampai)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal memuat arus kas: ${error.message}`);
  }

  return data;
}
