"use client";

import { useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { DataTableCard } from "@/components/common/data-table-card";
import { Button } from "@/components/ui/button";
import { useDeleteProduct, useProducts } from "@/hooks/use-products";
import type { Product } from "@/types/products";
import { productColumns } from "./columns";
import {
  ProductFormSheet,
  type ProductFormTarget,
} from "./product-form-sheet";

export function ProductsTable() {
  // `open` sengaja dipisah dari `target`, bukan `target !== null`. Radix
  // menganimasikan sheet saat menutup; kalau target ikut dikosongkan, judul
  // dan label tombolnya berkedip dari "Ubah produk" ke "Tambah produk" selama
  // animasi itu. Dibiarkan begini, target baru ditimpa saat sheet dibuka lagi.
  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<ProductFormTarget>({
    mode: "tambah",
  });

  // Baris yang sedang dikonfirmasi hapus. Yang disimpan barisnya, bukan id-nya,
  // supaya dialog bisa menyebut nama produknya tanpa mencari ulang ke daftar.
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data, isPending, isError, error } = useProducts();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct({
    onSuccess: () => setDeleteTarget(null),
  });

  // React membatch keduanya jadi satu render, jadi `TriggerSheet` melihat
  // `open` menyala berbarengan dengan defaultValues yang sudah benar.
  const openTambah = () => {
    setFormTarget({ mode: "tambah" });
    setFormOpen(true);
  };

  const openUbah = (product: Product) => {
    setFormTarget({ mode: "ubah", product });
    setFormOpen(true);
  };

  const columns = productColumns({
    onRequestEdit: openUbah,
    onRequestDelete: setDeleteTarget,
    isBusy: isDeleting,
  });

  return (
    <>
      <DataTableCard<Product>
        title="Daftar produk"
        headerAction={
          <Button type="button" size="sm" onClick={openTambah}>
            Tambah produk
          </Button>
        }
        columns={columns}
        data={data ?? []}
        rowKey={(row) => row.id}
        // Card tetap terpasang di ketiga keadaan supaya layout tidak melompat.
        emptyMessage={
          isPending ? "Memuat…" : isError ? error.message : "Belum ada produk."
        }
      />

      {/* Di luar DataTableCard: komponen itu bukan client component dan
          sengaja tidak tahu apa-apa soal aksi. */}
      <ProductFormSheet
        target={formTarget}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus produk?"
        description={
          <>
            Produk &quot;{deleteTarget?.nama}&quot; dan seluruh variannya ikut
            terhapus. Tindakan ini tidak bisa dibatalkan.
          </>
        }
        onConfirm={() => {
          if (deleteTarget) deleteProduct(deleteTarget.id);
        }}
        isPending={isDeleting}
      />
    </>
  );
}
