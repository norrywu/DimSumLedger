import type { Tables } from "@/types/supabase";

export type CashFlow = Pick<
  Tables<"cash_flow">,
  | "id"
  | "type"
  | "amount"
  | "category"
  | "description"
  | "source"
  | "transaction_date"
  | "created_at"
>;

export type CashFlowActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
