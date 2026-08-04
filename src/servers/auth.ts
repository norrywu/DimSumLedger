"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type {
  AppMetadata,
  AuthUser,
  LoginState,
  SupabaseUserMetadata,
} from "@/types/auth";
import { loginSchema } from "@/validations/auth";

/**
 * Membaca metadata user dari klaim JWT. Diverifikasi lokal, tanpa panggilan
 * jaringan ke Supabase — sama seperti yang dipakai proxy.
 *
 * Tidak menerima argumen, dan hanya mengembalikan data sesi pemanggilnya
 * sendiri, jadi aman diekspos sebagai Server Action.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) return null;

  const appMetadata = claims.app_metadata as AppMetadata | undefined;
  const userMetadata = claims.user_metadata as SupabaseUserMetadata | undefined;

  return {
    id: claims.sub,
    email: claims.email ?? null,
    name: userMetadata?.name ?? null,
    // Diambil dari app_metadata, BUKAN claims.role — `claims.role` adalah role
    // Postgres yang selalu bernilai "authenticated" untuk semua user.
    role: appMetadata?.role ?? null,
  };
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali isian kamu.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Pesannya sengaja tidak membedakan email salah dan sandi salah, supaya
    // tidak bisa dipakai menebak email mana yang terdaftar.
    return { message: "Email atau kata sandi salah." };
  }

  // Lewat `getAuthUser()`, sumber yang sama dengan seluruh guard lain di
  // aplikasi ini. Sempat diambil langsung dari `data.user.app_metadata` untuk
  // menghemat satu perjalanan, tapi objek itu tidak selalu memuat klaim role —
  // dan akibatnya admin ikut terlempar ke layar kasir. Klaim di JWT terbukti
  // terisi, karena `internal.is_pengelola()` membaca sumber yang sama.
  const user = await getAuthUser();
  const manager = user?.role === "owner" || user?.role === "admin";

  // Root layout membaca sesi lewat `getAuthUser()`, tapi ia TIDAK dirender
  // ulang saat navigasi client-side (Partial Rendering). Tanpa invalidasi ini,
  // seluruh aplikasi tetap memakai sesi kosong dari halaman login sampai
  // pengguna me-refresh sendiri.
  revalidatePath("/", "layout");

  // redirect() melempar, jadi harus di luar blok try/catch.
  redirect(manager ? "/APP/admin/dashboard" : "/APP/cashier/order");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Alasan sama seperti di `login()`: tanpa ini root layout masih memegang sesi
  // lama, dan nama pengguna yang baru saja keluar tetap terlihat di sidebar.
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
