"use client";

import { TriggerSheet } from "@/components/sheet-trigger";
import {
  MODIFIER_FIELDS,
  MODIFIER_FORM_DEFAULTS,
} from "@/constants/modifiers-constant";
import { useCreateModifier, useUpdateModifier } from "@/hooks/use-modifiers";
import type { Modifier } from "@/types/modifiers";
import {
  modifierSchema,
  type ModifierFormValues,
  type ModifierInput,
} from "@/validations/modifiers-validation";

export type ModifierFormTarget =
  | { mode: "tambah" }
  | { mode: "ubah"; modifier: Modifier };

export function ModifierFormSheet({
  target,
  open,
  onOpenChange,
}: {
  target: ModifierFormTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const tutup = () => onOpenChange(false);
  const { mutate: createModifier, isPending: isCreating } = useCreateModifier({
    onSuccess: tutup,
  });
  const { mutate: updateModifier, isPending: isUpdating } = useUpdateModifier({
    onSuccess: tutup,
  });

  const isUbah = target.mode === "ubah";

  const handleSubmit = (data: ModifierInput) => {
    if (target.mode === "ubah") {
      updateModifier({ id: target.modifier.id, input: data });
      return;
    }

    createModifier(data);
  };

  return (
    <TriggerSheet<ModifierFormValues, ModifierInput>
      open={open}
      onOpenChange={onOpenChange}
      fields={MODIFIER_FIELDS}
      sheetTitle={isUbah ? "Ubah extra" : "Tambah extra"}
      sheetDescription="Tambahan harga masuk ke total item, tambahan modal masuk ke HPP-nya — dua-duanya dibekukan ke struk saat transaksi disimpan. Nama tidak boleh kembar, tanpa memandang besar-kecil huruf."
      defaultValues={
        target.mode === "ubah"
          ? {
              nama: target.modifier.nama,
              tambahan_harga: target.modifier.tambahan_harga.toString(),
              tambahan_modal: target.modifier.tambahan_modal.toString(),
            }
          : MODIFIER_FORM_DEFAULTS
      }
      schema={modifierSchema}
      onSubmit={handleSubmit}
      submitLabel={isUbah ? "Simpan perubahan" : "Simpan extra"}
      isPending={isCreating || isUpdating}
    />
  );
}
