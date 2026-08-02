import { z } from "zod";

/**
 * Sumber kebenaran validasi kategori, dipakai Server Action.
 * Batasnya sengaja dibuat sama dengan CHECK/tipe kolom di
 * `supabase/schemas/01_categories.sql` supaya error tertangkap sebelum
 * menyentuh database.
 */
export const categorySchema = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama kategori wajib diisi.")
    .max(50, "Nama kategori maksimal 50 karakter."),
});

export type CategoryInput = z.infer<typeof categorySchema>;
