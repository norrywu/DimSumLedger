import { z } from "zod";

/**
 * Sama persis dengan CHECK constraint `profiles.role` di
 * `supabase/schemas/000_profile.sql`, dan dengan `UserRole` di
 * `@/types/auth`. Ketiganya harus dijaga selaras.
 */
export const ROLE_VALUES = ["owner", "admin", "cashier"] as const;

/**
 * Dipakai dua kali: zodResolver di browser, dan `createPengguna` di server.
 * Validasi browser bisa dilewati lewat POST langsung ke Server Action, jadi
 * server wajib memvalidasi ulang dengan skema yang sama persis.
 *
 * Batas 8 karakter mengikuti `loginSchema` dan `profileSchema`;
 * `supabase/config.toml` sendiri cuma mensyaratkan 6.
 */
export const userCreateSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter."),
  email: z.email("Format email tidak valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  role: z.enum(ROLE_VALUES, "Pilih salah satu role yang tersedia."),
});

/**
 * Bedanya cuma satu: saat mengubah pengguna, kata sandi kosong berarti "jangan
 * diubah" — sama seperti `profileSchema`. Pengelola tidak bisa membaca sandi
 * lama, jadi memaksanya mengisi ulang setiap kali menyunting nama akan
 * mengganti sandi orang lain tanpa disengaja.
 */
export const userUpdateSchema = userCreateSchema.extend({
  password: z.union([
    z.literal(""),
    z.string().min(8, "Kata sandi minimal 8 karakter."),
  ]),
});

/**
 * Satu tipe untuk dua skema: `z.literal("") | string` runtuh jadi `string`,
 * jadi keduanya meng-infer bentuk yang identik. Yang berbeda hanya aturan saat
 * runtime, dan itu ditentukan skema mana yang dioper ke `TriggerSheet`.
 */
export type UserInput = z.infer<typeof userCreateSchema>;
