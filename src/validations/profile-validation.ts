import { z } from "zod";

/**
 * Dipakai dua kali: react-hook-form di browser, dan `saveProfile` di server.
 * Validasi browser bisa dilewati, jadi server wajib memvalidasi ulang dengan
 * skema yang sama persis.
 */
export const profileSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.email("Format email tidak valid"),
  // Kosong berarti "jangan diubah", jadi string kosong harus lolos. Batas 8
  // karakter mengikuti `loginSchema`; `supabase/config.toml` sendiri cuma
  // mensyaratkan 6.
  password: z.union([
    z.literal(""),
    z.string().min(8, "Kata sandi minimal 8 karakter"),
  ]),
});

export type ProfileSchema = z.infer<typeof profileSchema>;
