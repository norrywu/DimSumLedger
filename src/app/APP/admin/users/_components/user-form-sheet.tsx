"use client";

import { TriggerSheet } from "@/components/sheet-trigger";
import { USER_FORM_DEFAULTS, userFields } from "@/constants/users-constant";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import type { User } from "@/types/users";
import {
  userCreateSchema,
  userUpdateSchema,
  type UserInput,
} from "@/validations/users-validation";

export type UserFormTarget = { mode: "tambah" } | { mode: "ubah"; user: User };

export function UserFormSheet({
  target,
  open,
  onOpenChange,
}: {
  target: UserFormTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const tutup = () => onOpenChange(false);
  const { mutate: createUser, isPending: isCreating } = useCreateUser({
    onSuccess: tutup,
  });
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser({
    onSuccess: tutup,
  });

  const isUbah = target.mode === "ubah";

  const handleSubmit = (data: UserInput) => {
    if (target.mode === "ubah") {
      updateUser({ id: target.user.id, input: data });
      return;
    }

    createUser(data);
  };

  return (
    <TriggerSheet<UserInput>
      open={open}
      onOpenChange={onOpenChange}
      fields={userFields(isUbah)}
      sheetTitle={isUbah ? "Ubah pengguna" : "Tambah pengguna"}
      sheetDescription={
        isUbah
          ? "Kata sandi dikosongkan berarti tidak diubah. Mengganti email berlaku seketika, tanpa email konfirmasi ke pemilik akun."
          : "Akun langsung aktif tanpa perlu verifikasi email. Serahkan kata sandinya langsung ke orangnya, lalu minta ia menggantinya sendiri lewat menu Account."
      }
      // Kata sandi TIDAK pernah diisi ulang saat mode ubah — nilainya memang
      // tidak bisa dibaca siapa pun, termasuk pengelola.
      defaultValues={
        target.mode === "ubah"
          ? {
              name: target.user.name,
              email: target.user.email,
              password: "",
              role: target.user.role,
            }
          : USER_FORM_DEFAULTS
      }
      // Dua skema, beda di satu aturan: kata sandi wajib saat membuat akun,
      // boleh kosong saat menyunting.
      schema={isUbah ? userUpdateSchema : userCreateSchema}
      onSubmit={handleSubmit}
      submitLabel={isUbah ? "Simpan perubahan" : "Simpan pengguna"}
      isPending={isCreating || isUpdating}
    />
  );
}
