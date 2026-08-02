import type { SheetField } from "@/components/sheet-trigger";
import type { ProfileSchema } from "@/validations/profile-validation";

/** Isi sheet "Account". Urutannya menentukan urutan render di `TriggerSheet`. */
export const PROFILE_FIELDS: SheetField<ProfileSchema>[] = [
  {
    name: "name",
    label: "Nama",
    placeholder: "Nama lengkap",
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "nama@contoh.com",
    autoComplete: "email",
  },
  {
    name: "password",
    label: "Kata Sandi Baru",
    type: "password",
    placeholder: "Kosongkan bila tidak diubah",
    // "new-password", bukan "current-password" — tanpa ini pengelola sandi
    // browser mengisi field dengan sandi lama dan user tidak sadar sedang
    // menyimpan ulang sandi yang sama.
    autoComplete: "new-password",
  },
];
