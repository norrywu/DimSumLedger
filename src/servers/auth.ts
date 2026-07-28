"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { LoginState } from "@/types/auth";
import { loginSchema } from "@/validations/auth";

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

  // redirect() melempar, jadi harus di luar blok try/catch.
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
