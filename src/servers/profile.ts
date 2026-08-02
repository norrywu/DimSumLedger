"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/servers/auth";
import type { AuthUser } from "@/types/auth";
import { profileSchema } from "@/validations/profile-validation";

export type SaveProfileResult = {
  message: string;
  user: AuthUser | null;
};

/**
 * Menyimpan perubahan profil dari sheet "Account".
 *
 * Dipanggil lewat `useMutation`, jadi kontraknya: LEMPAR `Error` saat gagal
 * (react-query hanya membaca `error.message`), dan kembalikan objek saat
 * sukses. Beda dengan `login` di `@/servers/auth` yang memakai bentuk
 * `useActionState` dan tidak pernah melempar.
 */
export async function saveProfile(
  formData: FormData,
): Promise<SaveProfileResult> {
  // Server Action bisa dijangkau lewat POST langsung, tidak hanya lewat UI.
  // Identitas karena itu diambil dari sesi, bukan dari formData — kalau tidak,
  // siapa pun bisa mengirim `id` orang lain.
  const current = await getAuthUser();

  if (!current) {
    throw new Error("Sesi kamu sudah berakhir. Silakan login ulang.");
  }

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    // Error per-field sudah tampil inline lewat zodResolver di browser; di sini
    // cukup satu pesan karena toast hanya bisa menampilkan `error.message`.
    const { fieldErrors } = z.flattenError(parsed.error);
    const firstError = Object.values(fieldErrors).flat().at(0);

    throw new Error(firstError ?? "Periksa kembali isian kamu.");
  }

  const { name, email, password } = parsed.data;
  const supabase = await createClient();
  const changes: string[] = [];

  // Nama ditulis ke tabel `profiles`, BUKAN lewat `auth.updateUser({ data })`.
  // Trigger `on_profile_updated` yang menyalin nama ke
  // `auth.users.raw_user_meta_data`, jadi menulis langsung ke metadata akan
  // tertimpa pada penyimpanan profil berikutnya.
  if (name !== current.name) {
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", current.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal memperbarui nama: ${error.message}`);
    }

    // RLS mengembalikan nol baris tanpa error kalau barisnya memang tidak ada.
    // Proyek ini belum punya trigger `handle_new_user`, jadi user lama bisa
    // saja belum punya baris `profiles` — jangan diam-diam dianggap sukses.
    if (!updated) {
      throw new Error(
        "Data profil tidak ditemukan. Minta admin membuatkan profil kamu.",
      );
    }

    changes.push("Nama diperbarui");
  }

  // Email dan kata sandi milik Supabase Auth, bukan tabel `profiles`.
  const authPayload: { email?: string; password?: string } = {};

  if (email !== current.email) {
    authPayload.email = email;
  }

  // String kosong berarti "jangan diubah" — lihat `profileSchema`.
  if (password) {
    authPayload.password = password;
  }

  if (authPayload.email || authPayload.password) {
    const { error } = await supabase.auth.updateUser(authPayload);

    if (error) {
      throw new Error(error.message);
    }

    if (authPayload.email) {
      // `double_confirm_changes = true` di supabase/config.toml: alamat baru
      // baru aktif setelah link di email LAMA dan BARU sama-sama diklik.
      // Jangan bilang "email berhasil diubah" — belum.
      changes.push("Link konfirmasi dikirim ke email lama dan baru");
    }

    if (authPayload.password) {
      changes.push("Kata sandi diperbarui");
    }
  }

  if (changes.length === 0) {
    return { message: "Tidak ada perubahan.", user: current };
  }

  // Nama sudah masuk ke auth.users lewat trigger, tapi JWT di cookie masih
  // memuat klaim lama sampai token dirotasi (jwt_expiry = 1 jam). Rotasi
  // dipaksa sekarang supaya `getAuthUser()` di bawah membaca nama baru.
  const { error: refreshError } = await supabase.auth.refreshSession();
  const refreshed = refreshError ? null : await getAuthUser();

  revalidatePath("/", "layout");

  return {
    message: `${changes.join(". ")}.`,
    // Kalau refresh gagal, klaim masih basi — rakit sendiri dari nilai yang
    // baru ditulis supaya sidebar tidak melompat balik ke nama lama. `email`
    // sengaja ikut nilai lama: alamat baru belum terkonfirmasi.
    user: refreshed ?? { ...current, name },
  };
}
