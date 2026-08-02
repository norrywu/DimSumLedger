"use client";

import { TriggerSheet } from "@/components/sheet-trigger";
import {
  CATEGORY_FIELDS,
  CATEGORY_FORM_DEFAULTS,
} from "@/constants/categories-constant";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";
import type { Category } from "@/types/categories";
import {
  categorySchema,
  type CategoryInput,
} from "@/validations/categories-validation";

/** Mode "ubah" membawa barisnya karena nilai awal form diambil dari situ. */
export type CategoryFormTarget =
  | { mode: "tambah" }
  | { mode: "ubah"; category: Category };

/**
 * Satu sheet melayani tambah dan ubah: isian dan skemanya identik, yang
 * berbeda cuma nilai awal, judul, dan mutation yang dipanggil.
 *
 * `open` dioper terpisah dari `target` — alasannya ada di `CategoriesTable`.
 */
export function CategoryFormSheet({
  target,
  open,
  onOpenChange,
}: {
  target: CategoryFormTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const tutup = () => onOpenChange(false);
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory({
    onSuccess: tutup,
  });
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory({
    onSuccess: tutup,
  });

  const isUbah = target.mode === "ubah";

  const handleSubmit = (data: CategoryInput) => {
    if (target.mode === "ubah") {
      updateCategory({ id: target.category.id, input: data });
      return;
    }

    createCategory(data);
  };

  return (
    <TriggerSheet<CategoryInput>
      open={open}
      onOpenChange={onOpenChange}
      fields={CATEGORY_FIELDS}
      sheetTitle={isUbah ? "Ubah kategori" : "Tambah kategori"}
      sheetDescription="Nama tidak boleh kembar, tanpa memandang besar-kecil huruf."
      // `TriggerSheet` mereset form ke nilai ini tiap kali sheet dibuka, jadi
      // membuka baris lain langsung memuat isian baris itu.
      defaultValues={
        target.mode === "ubah"
          ? { nama: target.category.nama }
          : CATEGORY_FORM_DEFAULTS
      }
      schema={categorySchema}
      onSubmit={handleSubmit}
      submitLabel={isUbah ? "Simpan perubahan" : "Simpan kategori"}
      isPending={isCreating || isUpdating}
    />
  );
}
