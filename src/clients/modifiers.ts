import { createClient } from "@/lib/supabase/client";
import type { Modifier } from "@/types/modifiers";

export async function getModifiers(): Promise<Modifier[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("modifiers")
    .select("id, nama, tambahan_harga, tambahan_modal")
    .order("nama");

  if (error) {
    throw new Error(`Gagal memuat extra: ${error.message}`);
  }

  return data;
}
