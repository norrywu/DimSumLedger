import type { Tables } from "@/types/supabase";

export type Modifier = Pick<
  Tables<"modifiers">,
  "id" | "nama" | "tambahan_harga" | "tambahan_modal"
>;

export type ModifierActionResult =
  | { success: true; message: string }
  | { success: false; message: string };
