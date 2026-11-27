"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { FormField } from "@/components/common/form";
import { TriggerSheet, type SheetField } from "@/components/sheet-trigger";
import {
  JENIS_MUTASI_OPTIONS,
  stockHistoryDefaults,
} from "@/constants/stock-constant";
import { useProducts } from "@/hooks/use-products";
import {
  useCreateStockHistory,
  useUpdateStockHistory,
} from "@/hooks/use-stock";
import type { Product } from "@/types/products";
import type { StockHistory } from "@/types/stock";
import {
  stockHistorySchema,
  type StockHistoryFormValues,
  type StockHistoryInput,
} from "@/validations/stock-validation";

export type StockFormTarget =
  | { mode: "tambah"; productId?: string; lockProduct?: boolean }
  | { mode: "ubah"; baris: StockHistory };

export function StockFormSheet({
  target,
  open,
  onOpenChange,
}: {
  target: StockFormTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: products } = useProducts();

  const tutup = () => onOpenChange(false);

  const { mutate: createStock, isPending: isCreating } = useCreateStockHistory({
    onSuccess: tutup,
  });
  const { mutate: updateStock, isPending: isUpdating } = useUpdateStockHistory({
    onSuccess: tutup,
  });

  const allProducts = products ?? [];
  const trackedProducts = allProducts.filter((product) => product.lacak_stok);
  const isUbah = target.mode === "ubah";

  const productOptions = trackedProducts.map((product) => ({
    value: product.id,
    label: `${product.nama} (sisa ${product.stok_pcs.toLocaleString("id-ID")} pcs)`,
  }));

  if (
    target.mode === "ubah" &&
    target.baris.product_id &&
    !productOptions.some((opt) => opt.value === target.baris.product_id)
  ) {
    productOptions.unshift({
      value: target.baris.product_id,
      label: target.baris.nama_produk,
    });
  }

  const fields: SheetField<StockHistoryFormValues>[] = [
    {
      name: "product_id",
      label: "Produk",
      type: "select",
      placeholder:
        productOptions.length === 0
          ? "Belum ada produk dilacak"
          : "Pilih produk",
      options: productOptions,
      disabled: isUbah || Boolean(target.lockProduct),
    },
    {
      name: "jenis",
      label: "Jenis mutasi",
      type: "select",
      placeholder: "Pilih jenis mutasi",
      options: JENIS_MUTASI_OPTIONS,
    },
    {
      name: "jumlah_pcs",
      label: "Jumlah (pcs)",
      type: "number",
      placeholder: "mis. 50",
    },
    {
      name: "tanggal",
      label: "Tanggal",
      type: "date",
    },
  ];

  const handleSubmit = (data: StockHistoryInput) => {
    if (target.mode === "ubah") {
      updateStock({ id: target.baris.id, input: data });
      return;
    }

    createStock(data);
  };

  return (
    <TriggerSheet<StockHistoryFormValues, StockHistoryInput>
      open={open}
      onOpenChange={onOpenChange}
      fields={fields}
      sheetTitle={isUbah ? "Ubah catatan stok" : "Catat stok"}
      sheetDescription={
        !isUbah && trackedProducts.length === 0
          ? "Belum ada produk yang melacak stok. Aktifkan 'Lacak stok' di Daftar Produk terlebih dahulu."
          : isUbah
            ? "Mengubah catatan otomatis menyesuaikan saldo stok produk terkait."
            : "Penjualan kasir mengurangi stok otomatis; form ini khusus stok masuk/keluar manual."
      }
      defaultValues={
        target.mode === "ubah"
          ? {
              product_id: target.baris.product_id ?? "",
              jenis: target.baris.jenis,
              jumlah_pcs: target.baris.jumlah_pcs.toString(),
              catatan: target.baris.catatan ?? "",
              tanggal: target.baris.tanggal,
            }
          : stockHistoryDefaults(target.productId ?? "")
      }
      schema={stockHistorySchema}
      onSubmit={handleSubmit}
      submitLabel={isUbah ? "Simpan perubahan" : "Simpan stok"}
      isPending={isCreating || isUpdating}
    >
      {(form) => <StockFormExtras form={form} products={allProducts} />}
    </TriggerSheet>
  );
}

/**
 * Terpisah supaya `useWatch` punya komponen sendiri dan tidak memicu render
 * ulang seluruh sheet tiap ketikan.
 */
function StockFormExtras({
  form,
  products,
}: {
  form: UseFormReturn<StockHistoryFormValues, unknown, StockHistoryInput>;
  products: Product[];
}) {
  const jenis = useWatch({ control: form.control, name: "jenis" });
  const productId = useWatch({ control: form.control, name: "product_id" });
  const selectedProduct = products.find((product) => product.id === productId);

  return (
    <>
      <FormField<StockHistoryFormValues, StockHistoryInput>
        control={form.control}
        name="catatan"
        label={jenis === "keluar" ? "Catatan (wajib)" : "Catatan"}
        placeholder={
          jenis === "keluar"
            ? "mis. Basi, rusak, atau koreksi"
            : "Opsional, mis. Produksi pagi"
        }
      />
      {selectedProduct && (
        <p className="text-xs text-muted-foreground tabular-nums">
          Sisa stok saat ini:{" "}
          <span className="font-medium text-foreground">
            {selectedProduct.stok_pcs.toLocaleString("id-ID")} pcs
          </span>
        </p>
      )}
    </>
  );
}
