import { z } from "zod";

/**
 * Dipakai dua kali: react-hook-form di browser, dan Server Action di server.
 * Validasi browser bisa dilewati, jadi server wajib memvalidasi ulang dengan
 * skema yang sama persis.
 */
export const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export type LoginValues = z.infer<typeof loginSchema>;
