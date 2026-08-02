"use client";

import { TriggerSheet } from "@/components/sheet-trigger";
import {
  VARIANT_FORM_DEFAULTS,
  variantFields,
} from "@/constants/variants-constant";
import { usePackagings } from "@/hooks/use-packagings";
import { useProducts } from "@/hooks/use-products";
import { useCreateVariant, useUpdateVariant } from "@/hooks/use-variants";
import type { Variant } from "@/types/variants";
import {
  variantSchema,
  type VariantFormValues,
  type VariantInput,
} from "@/validations/variants-validation";
import { VariantPackagingsField } from "./variant-packagings-field";

/** Mode "ubah" membawa barisnya karena nilai awal form diambil dari situ. */
export type VariantFormTarget =
  | { mode: "tambah" }
  | { mode: "ubah"; variant: Variant };

/**
 * Varian butuh induk (produk) DAN minimal satu kemasan. Kalau salah satunya
 * belum ada, sheet ini mustahil disimpan — jadi yang disebut duluan adalah
 * apa yang kurang, bukan aturan penamaan yang belum relevan.
 */
function pesanPrasyarat(tanpaProduk: boolean, tanpaKemasan: boolean) {
  if (tanpaProduk && tanpaKemasan) {
    return "Belum ada produk dan kemasan. Buat dulu di halaman Produk dan Kemasan — varian butuh keduanya.";
  }

  if (tanpaProduk) {
    return "Belum ada produk. Buat dulu di halaman Produk — varian wajib punya induk.";
  }

  if (tanpaKemasan) {
    return "Belum ada kemasan. Buat dulu di halaman Kemasan — varian wajib pakai minimal satu.";
  }

  return "Nama varian boleh sama dengan varian produk lain, asal tidak kembar di dalam satu produk.";
}

/**
 * Satu sheet melayani tambah dan ubah: isian dan skemanya identik, yang berbeda
 * cuma nilai awal, judul, dan mutation yang dipanggil.
 *
 * `open` dioper terpisah dari `target` — alasannya ada di `VariantsTable`.
 */
export function VariantFormSheet({
  target,
  open,
  onOpenChange,
}: {
  target: VariantFormTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Hook yang sudah dipakai halaman Produk dan Kemasan; tidak ada query baru.
  const { data: products } = useProducts();
  const { data: packagings } = usePackagings();

  const tutup = () => onOpenChange(false);
  const { mutate: createVariant, isPending: isCreating } = useCreateVariant({
    onSuccess: tutup,
  });
  const { mutate: updateVariant, isPending: isUpdating } = useUpdateVariant({
    onSuccess: tutup,
  });

  const productOptions = (products ?? []).map(({ id, nama }) => ({
    value: id,
    label: nama,
  }));

  const isUbah = target.mode === "ubah";

  const handleSubmit = (data: VariantInput) => {
    if (target.mode === "ubah") {
      updateVariant({ id: target.variant.id, input: data });
      return;
    }

    createVariant(data);
  };

  return (
    // Dua generic: yang dipegang form masih string (VariantFormValues), yang
    // sampai ke `onSubmit` sudah jadi angka (VariantInput).
    <TriggerSheet<VariantFormValues, VariantInput>
      open={open}
      onOpenChange={onOpenChange}
      fields={variantFields(productOptions)}
      sheetTitle={isUbah ? "Ubah varian" : "Tambah varian"}
      // Ada DUA prasyarat, dan varian mustahil disimpan kalau salah satunya
      // belum ada — yang terlihat cuma dropdown kosong tanpa penjelasan.
      // Kalimatnya menyebut mana yang kurang supaya jalan keluarnya muncul
      // tepat di tempat pengguna mentok.
      sheetDescription={pesanPrasyarat(
        productOptions.length === 0,
        (packagings?.length ?? 0) === 0,
      )}
      // `TriggerSheet` mereset form ke nilai ini tiap kali sheet dibuka, jadi
      // membuka baris lain langsung memuat isian baris itu.
      //
      // Angkanya distringkan: `<Input>` bekerja dengan string, dan `null` bikin
      // React menganggap field-nya uncontrolled lalu memuntahkan peringatan.
      defaultValues={
        target.mode === "ubah"
          ? {
              product_id: target.variant.product_id,
              nama: target.variant.nama,
              jumlah_pcs: target.variant.jumlah_pcs?.toString() ?? "",
              harga_jual: target.variant.harga_jual.toString(),
              modal_bahan: target.variant.modal_bahan.toString(),
              aktif: target.variant.aktif,
              kemasan: target.variant.kemasan.map(
                ({ packaging_id, jumlah }) => ({
                  packaging_id,
                  jumlah: jumlah.toString(),
                }),
              ),
            }
          : VARIANT_FORM_DEFAULTS
      }
      schema={variantSchema}
      onSubmit={handleSubmit}
      submitLabel={isUbah ? "Simpan perubahan" : "Simpan varian"}
      isPending={isCreating || isUpdating}
    >
      {/* Baris berulang, tidak bisa dinyatakan sebagai `SheetField` — karena
          itu `TriggerSheet` menyediakan slot ini. */}
      {(form) => <VariantPackagingsField form={form} />}
    </TriggerSheet>
  );
}
