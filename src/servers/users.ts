"use server";

import { z } from "zod";

import { getManager } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppMetadata } from "@/types/auth";
import type { UserActionResult } from "@/types/users";
import {
  UserInput,
  userCreateSchema,
  userUpdateSchema,
} from "@/validations/users-validation";

const NO_ACCESS = "Kamu tidak punya akses mengelola pengguna.";
const ACCOUNT_NOT_FOUND = "Akun itu sudah tidak ada. Muat ulang halaman.";

/**
 * Menerjemahkan kode error jadi kalimat yang bisa dibaca pengelola.
 *
 * Beda dari fitur lain, di sini ada DUA sumber kode: `AuthError.code` dari
 * Admin API (huruf, mis. `email_exists`) dan `PostgrestError.code` dari
 * penulisan ke `public.profiles` (angka SQLSTATE). Keduanya masuk parameter
 * yang sama karena tidak pernah bertabrakan.
 */
function errorMessage(code: string | undefined, fallback: string) {
  // --- Admin API ---
  if (code === "email_exists") return "Email itu sudah dipakai akun lain.";
  if (code === "weak_password") return "Kata sandi minimal 8 karakter.";
  if (code === "user_not_found") return ACCOUNT_NOT_FOUND;
  // --- Postgres ---
  // 23505 dari primary key `profiles.id`: akun auth-nya terbentuk, tapi
  // profilnya sudah ada duluan.
  if (code === "23505") return "Profil untuk akun itu sudah ada.";
  // 23503 = foreign_key_violation, `profiles.id` menunjuk `auth.users` yang
  // keburu hilang.
  if (code === "23503") return ACCOUNT_NOT_FOUND;
  if (code === "23514") return "Role itu tidak dikenali database.";

  return fallback;
}

/**
 * Pesan pertama dari kegagalan zod. Tipenya diikat ke `UserInput`, bukan
 * dibikin generik: dengan parameter tipe yang belum terpecahkan
 * `Object.values` menyerah jadi `{}[]` dan pesannya gagal dianggap string.
 */
function validationMessage(error: z.ZodError<UserInput>) {
  const { fieldErrors } = z.flattenError(error);

  return (
    Object.values(fieldErrors).flat().at(0) ?? "Periksa kembali isian kamu."
  );
}

/**
 * File ini khusus operasi TULIS. Pembacaan ada di `@/clients/users`.
 *
 * Ketiga action di sini memakai `createAdminClient()`, yang MENEMBUS SEMUA RLS
 * — tidak ada policy yang menahannya kalau kodenya salah. Karena itu semuanya
 * dibuka dengan `getManager()`, dan identitas selalu diambil dari sesi,
 * tidak pernah dari argumen: Server Action bisa dijangkau POST langsung, bukan
 * cuma lewat UI.
 *
 * Kegagalan dikembalikan sebagai nilai, bukan dilempar — lihat
 * `UserActionResult` untuk alasannya.
 */
export async function createPengguna(
  input: UserInput,
): Promise<UserActionResult> {
  const manager = await getManager();

  if (!manager) return { success: false, message: NO_ACCESS };

  // zodResolver sudah memvalidasi di browser, tapi jangan percaya kiriman
  // client. Skema "tambah": kata sandi di sini wajib.
  const parsed = userCreateSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const { name, email, password, role } = parsed.data;
  const admin = createAdminClient();

  // Lewat Admin API, bukan `signUp()`: `signUp` menukar sesi di cookie dengan
  // akun yang baru dibuat, jadi pengelola akan mendapati dirinya login sebagai
  // kasir yang barusan ia daftarkan.
  const { data: dibuat, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    // Pengelola yang membuatkan akunnya dan menyerahkan sandinya langsung, jadi
    // tidak ada email konfirmasi yang perlu diklik lebih dulu.
    email_confirm: true,
  });

  if (authError || !dibuat.user) {
    return {
      success: false,
      message: errorMessage(
        authError?.code,
        `Gagal membuat akun: ${authError?.message ?? "akun tidak terbentuk."}`,
      ),
    };
  }

  // `name` dan `role` sengaja TIDAK dikirim sebagai metadata ke `createUser`:
  // trigger `on_profile_updated` menyalinnya dari baris `profiles` ke
  // `auth.users` setelah insert di bawah, jadi apa pun yang ditulis di sini
  // akan tertimpa sesaat kemudian.
  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: dibuat.user.id, name, role });

  if (profileError) {
    // Akun auth tanpa baris profil tidak muncul di daftar mana pun, tapi tetap
    // memesan alamat emailnya — percobaan berikutnya dengan email yang sama
    // akan ditolak `email_exists` tanpa ada yang bisa dilihat pengelola.
    await admin.auth.admin.deleteUser(dibuat.user.id);

    return {
      success: false,
      message: errorMessage(
        profileError.code,
        `Gagal menyimpan profil: ${profileError.message}`,
      ),
    };
  }

  return { success: true, message: `Pengguna "${name}" ditambahkan.` };
}

export async function updatePengguna(
  id: string,
  input: UserInput,
): Promise<UserActionResult> {
  const manager = await getManager();

  if (!manager) return { success: false, message: NO_ACCESS };

  // Skema "ubah": kata sandi kosong berarti jangan diubah.
  const parsed = userUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const { name, email, password, role } = parsed.data;

  // Tanpa ini, satu-satunya admin bisa menurunkan dirinya sendiri jadi kasir
  // dan mengunci semua orang di luar menu pengelola — termasuk dari halaman
  // ini, satu-satunya tempat role bisa dikembalikan.
  if (id === manager.id && role !== manager.role) {
    return {
      success: false,
      message: "Kamu tidak bisa mengubah role akun kamu sendiri.",
    };
  }

  const admin = createAdminClient();

  // Dibaca lebih dulu supaya email hanya ikut dikirim kalau memang berubah,
  // dan supaya baris yang sudah dihapus orang lain ketahuan sebelum ditulis.
  const { data: lama, error: fetchError } =
    await admin.auth.admin.getUserById(id);

  if (fetchError || !lama.user) {
    return { success: false, message: ACCOUNT_NOT_FOUND };
  }

  // Email dan kata sandi milik Supabase Auth, bukan tabel `profiles`.
  const authPayload: { email?: string; password?: string } = {};

  if (email !== lama.user.email) authPayload.email = email;
  if (password) authPayload.password = password;

  // Auth DULU, baru profil. supabase-js tidak bisa membungkus keduanya jadi
  // satu transaksi (alasan yang sama melahirkan `simpan_varian`), jadi selalu
  // ada celah di mana satu sudah tertulis dan satunya belum. Yang paling mungkin
  // gagal adalah email kembar — dan kalau itu dijalankan belakangan, nama serta
  // role sudah terlanjur tersimpan padahal pengelola diberi pesan gagal.
  if (authPayload.email || authPayload.password) {
    const { error: authError } = await admin.auth.admin.updateUserById(
      id,
      authPayload,
    );

    if (authError) {
      return {
        success: false,
        message: errorMessage(
          authError.code,
          `Gagal menyimpan: ${authError.message}`,
        ),
      };
    }
  }

  // Ditulis lewat service role, bukan lewat policy "Admins can update any
  // profile": policy itu mematok `role = 'admin'`, sehingga seorang `owner`
  // justru tertolak olehnya.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ name, role, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (profileError) {
    // Sisi auth sudah terlanjur berubah kalau payloadnya tadi terisi. Sebut
    // apa adanya — pengelola perlu tahu sandi mana yang sekarang berlaku.
    const sudahTerpakai =
      authPayload.email || authPayload.password
        ? " Email/kata sandi sudah terlanjur diganti."
        : "";

    return {
      success: false,
      message: `${errorMessage(
        profileError.code,
        `Gagal menyimpan: ${profileError.message}`,
      )}${sudahTerpakai}`,
    };
  }

  const roleLama = (lama.user.app_metadata as AppMetadata | undefined)?.role;
  const catatan: string[] = [];

  // Beda dari `saveProfile`: Admin API mengganti alamat email SEKETIKA, tanpa
  // alur double-confirm ke email lama dan baru. Jangan diam soal itu — pemilik
  // akun tidak diberi tahu apa-apa oleh Supabase.
  if (authPayload.email) {
    catatan.push("Email diganti seketika, tanpa email konfirmasi.");
  }

  if (authPayload.password) catatan.push("Kata sandi diganti.");

  // `internal.is_pengelola()` membaca klaim di JWT, dan JWT adalah snapshot
  // dengan `jwt_expiry = 3600`. Role baru belum berlaku sampai tokennya dirotasi.
  if (roleLama && roleLama !== role) {
    catatan.push("Role baru berlaku setelah pengguna itu login ulang.");
  }

  return {
    success: true,
    message: [`Pengguna "${name}" diperbarui.`, ...catatan].join(" "),
  };
}

export async function deletePengguna(id: string): Promise<UserActionResult> {
  const manager = await getManager();

  if (!manager) return { success: false, message: NO_ACCESS };

  // Menghapus akun sendiri langsung mencabut sesi yang sedang berjalan, dan
  // kalau ini pengelola terakhir, tidak ada lagi yang bisa membuat penggantinya.
  if (id === manager.id) {
    return {
      success: false,
      message: "Kamu tidak bisa menghapus akun kamu sendiri.",
    };
  }

  const admin = createAdminClient();

  // Cukup akun auth-nya. `profiles.id` punya FK ke `auth.users` dengan
  // ON DELETE CASCADE, jadi baris profilnya ikut hilang — dan itu satu-satunya
  // jalan, karena `profiles` memang tidak punya policy DELETE sama sekali.
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    return {
      success: false,
      message: errorMessage(error.code, `Gagal menghapus: ${error.message}`),
    };
  }

  return { success: true, message: "Pengguna dihapus." };
}
