"use client";

import { TriggerSheet } from "@/components/sheet-trigger";
import {
  PRODUCT_FORM_DEFAULTS,
  productFields,
} from "@/constants/products-constant";
import { useCategories } from "@/hooks/use-categories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import type { Product } from "@/types/products";
import {
  productSchema,
  type ProductFormValues,
  type ProductInput,
} from "@/validations/products-validation";

/** Mode "ubah" membawa barisnya karena nilai awal form diambil dari situ. */
export type ProductFormTarget =
  | { mode: "tambah" }
  | { mode: "ubah"; product: Product };

/**
 * Satu sheet melayani tambah dan ubah: isian dan skemanya identik, yang
 * berbeda cuma nilai awal, judul, dan mutation yang dipanggil.
 *
 * `open` dioper terpisah dari `target` — alasannya ada di `ProductsTable`.
 */
export function ProductFormSheet({
  target,
  open,
  onOpenChange,
}: {
  target: ProductFormTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Hook yang sudah dipakai halaman Kategori; tidak ada query baru di sini.
  const { data: categories } = useCategories();

  const tutup = () => onOpenChange(false);
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct({
    onSuccess: tutup,
  });
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct({
    onSuccess: tutup,
  });

  const categoryOptions = (categories ?? []).map(({ id, nama }) => ({
    value: id,
    label: nama,
  }));

  const isUbah = target.mode === "ubah";

  const handleSubmit = (data: ProductInput) => {
    if (target.mode === "ubah") {
      updateProduct({ id: target.product.id, input: data });
      return;
    }

    createProduct(data);
  };

  return (
    <TriggerSheet<ProductFormValues, ProductInput>
      open={open}
      onOpenChange={onOpenChange}
      fields={productFields(categoryOptions)}
      sheetTitle={isUbah ? "Ubah produk" : "Tambah produk"}
      // Tanpa satu pun kategori, `category_id` yang NOT NULL bikin produk
      // mustahil disimpan — dan yang terlihat cuma dropdown kosong tanpa
      // penjelasan. Kalimatnya diganti supaya jalan keluarnya muncul tepat
      // di tempat pengguna mentok.
      sheetDescription={
        categoryOptions.length === 0
          ? "Belum ada kategori. Buat dulu di halaman Kategori — produk wajib punya induk."
          : "Nama tidak boleh kembar, tanpa memandang besar-kecil huruf."
      }
      // `TriggerSheet` mereset form ke nilai ini tiap kali sheet dibuka, jadi
      // membuka baris lain langsung memuat isian baris itu.
      defaultValues={
        target.mode === "ubah"
          ? {
              nama: target.product.nama,
              category_id: target.product.category_id,
              upah_per_pcs: target.product.upah_per_pcs.toString(),
            }
          : PRODUCT_FORM_DEFAULTS
      }
      schema={productSchema}
      onSubmit={handleSubmit}
      submitLabel={isUbah ? "Simpan perubahan" : "Simpan produk"}
      isPending={isCreating || isUpdating}
    />
  );
}
