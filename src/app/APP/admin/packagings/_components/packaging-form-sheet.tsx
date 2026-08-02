"use client";

import { TriggerSheet } from "@/components/sheet-trigger";
import {
  PACKAGING_FIELDS,
  PACKAGING_FORM_DEFAULTS,
} from "@/constants/packagings-constant";
import {
  useCreatePackaging,
  useUpdatePackaging,
} from "@/hooks/use-packagings";
import type { Packaging } from "@/types/packagings";
import {
  packagingSchema,
  type PackagingFormValues,
  type PackagingInput,
} from "@/validations/packagings-validation";

/** Mode "ubah" membawa barisnya karena nilai awal form diambil dari situ. */
export type PackagingFormTarget =
  | { mode: "tambah" }
  | { mode: "ubah"; packaging: Packaging };

/**
 * Satu sheet melayani tambah dan ubah: isian dan skemanya identik, yang berbeda
 * cuma nilai awal, judul, dan mutation yang dipanggil.
 *
 * `open` dioper terpisah dari `target` — alasannya ada di `PackagingsTable`.
 */
export function PackagingFormSheet({
  target,
  open,
  onOpenChange,
}: {
  target: PackagingFormTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const tutup = () => onOpenChange(false);
  const { mutate: createPackaging, isPending: isCreating } = useCreatePackaging({
    onSuccess: tutup,
  });
  const { mutate: updatePackaging, isPending: isUpdating } = useUpdatePackaging({
    onSuccess: tutup,
  });

  const isUbah = target.mode === "ubah";

  const handleSubmit = (data: PackagingInput) => {
    if (target.mode === "ubah") {
      updatePackaging({ id: target.packaging.id, input: data });
      return;
    }

    createPackaging(data);
  };

  return (
    // Dua generic: yang dipegang form masih string (PackagingFormValues), yang
    // sampai ke `onSubmit` sudah jadi angka (PackagingInput).
    <TriggerSheet<PackagingFormValues, PackagingInput>
      open={open}
      onOpenChange={onOpenChange}
      fields={PACKAGING_FIELDS}
      sheetTitle={isUbah ? "Ubah kemasan" : "Tambah kemasan"}
      sheetDescription="Harga satuan dipakai menghitung modal kemasan tiap varian. Nama tidak boleh kembar, tanpa memandang besar-kecil huruf."
      // `TriggerSheet` mereset form ke nilai ini tiap kali sheet dibuka, jadi
      // membuka baris lain langsung memuat isian baris itu.
      //
      // Harganya distringkan: `<Input>` bekerja dengan string, dan angka mentah
      // dari database bikin React protes soal controlled/uncontrolled.
      defaultValues={
        target.mode === "ubah"
          ? {
              nama: target.packaging.nama,
              harga_satuan: target.packaging.harga_satuan.toString(),
            }
          : PACKAGING_FORM_DEFAULTS
      }
      schema={packagingSchema}
      onSubmit={handleSubmit}
      submitLabel={isUbah ? "Simpan perubahan" : "Simpan kemasan"}
      isPending={isCreating || isUpdating}
    />
  );
}
