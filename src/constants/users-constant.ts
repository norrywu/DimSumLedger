import type { SheetField } from "@/components/sheet-trigger";
import type { UserRole } from "@/types/auth";
import type { SelectOption } from "@/types/form";
import { ROLE_VALUES, type UserInput } from "@/validations/users-validation";

/**
 * Query key react-query, dikumpulkan supaya komponen yang membaca dan yang
 * meng-invalidate memakai key yang sama persis.
 */
export const USERS_KEY = ["users"];

/**
 * Nama role dalam bahasa Indonesia untuk tampilan. Bertipe `Record<UserRole,
 * string>` supaya penambahan role baru di `@/types/auth` langsung ditolak
 * TypeScript sampai labelnya ikut ditulis.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Pemilik",
  admin: "Admin",
  cashier: "Kasir",
};

/**
 * Diturunkan dari `ROLE_VALUES`, bukan ditulis ulang: urutannya jadi ikut
 * urutan CHECK constraint di SQL, dan tidak mungkin ada role yang muncul di
 * dropdown tapi ditolak database.
 */
export const ROLE_OPTIONS: SelectOption<UserRole>[] = ROLE_VALUES.map(
  (role) => ({ value: role, label: ROLE_LABELS[role] }),
);

/**
 * Nilai awal sheet saat mode "tambah". Default `cashier` mengikuti default
 * kolomnya di `supabase/schemas/000_profile.sql` — role paling kecil haknya,
 * jadi kelalaian memilih tidak berujung memberi akses penuh.
 */
export const USER_FORM_DEFAULTS: UserInput = {
  name: "",
  email: "",
  password: "",
  role: "cashier",
};

/**
 * Fungsi, bukan konstanta seperti `CATEGORY_FIELDS`: kolom kata sandi berganti
 * arti antara tambah dan ubah — wajib saat membuat akun, "kosongkan bila tidak
 * diubah" saat menyunting.
 *
 * `autoComplete` sengaja dimatikan: ini form untuk akun ORANG LAIN, dan tanpa
 * itu browser menawarkan mengisikan email serta sandi si pengelola sendiri.
 */
export function userFields(isUbah: boolean): SheetField<UserInput>[] {
  return [
    {
      name: "name",
      label: "Nama lengkap",
      placeholder: "mis. Siti Aminah",
      autoComplete: "off",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "mis. siti@warung.com",
      autoComplete: "off",
    },
    {
      name: "password",
      label: isUbah ? "Kata sandi baru" : "Kata sandi",
      type: "password",
      placeholder: isUbah
        ? "Kosongkan bila tidak diubah"
        : "Minimal 8 karakter",
      autoComplete: "new-password",
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      placeholder: "Pilih role",
      options: ROLE_OPTIONS,
    },
  ];
}
