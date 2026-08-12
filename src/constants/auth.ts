import type { LoginState } from "@/types/auth";
import type { LoginValues } from "@/validations/auth";

/** State awal untuk `useActionState`. Tidak boleh tinggal di `@/servers/auth`
 * karena berkas `"use server"` hanya boleh mengekspor fungsi async. */
export const INITIAL_LOGIN_STATE: LoginState = { message: "" };

/** Nilai awal form login. Field wajib kosong, bukan undefined, supaya input
 * tetap controlled sejak render pertama. */
export const LOGIN_DEFAULT_VALUES: LoginValues = {
  email: "",
  password: "",
};

