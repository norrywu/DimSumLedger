"use client";

import { useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { DataTableCard } from "@/components/common/data-table-card";
import { FilterSelect } from "@/components/common/filter-select";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";
import { useDeleteVariant, useVariants } from "@/hooks/use-variants";
import type { Variant } from "@/types/variants";
import { variantColumns } from "./columns";
import { VariantFormSheet, type VariantFormTarget } from "./variant-form-sheet";

export function VariantsTable() {
  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<VariantFormTarget>({
    mode: "tambah",
  });

  const [deleteTarget, setDeleteTarget] = useState<Variant | null>(null);

  const [productId, setProductId] = useState<string>();

  const { data, isPending, isError, error } = useVariants();
  const { data: products } = useProducts();
  const { mutate: deleteVariant, isPending: isDeleting } = useDeleteVariant({
    onSuccess: () => setDeleteTarget(null),
  });

  const rows = productId
    ? (data ?? []).filter((variant) => variant.product_id === productId)
    : (data ?? []);

  const tanpaPcs = (data ?? []).filter(
    (variant) => variant.jumlah_pcs === null,
  ).length;

  const openTambah = () => {
    setFormTarget({ mode: "tambah" });
    setFormOpen(true);
  };

  const openUbah = (variant: Variant) => {
    setFormTarget({ mode: "ubah", variant });
    setFormOpen(true);
  };

  const columns = variantColumns({
    onRequestEdit: openUbah,
    onRequestDelete: setDeleteTarget,
    isBusy: isDeleting,
  });

  return (
    <>
      <DataTableCard<Variant>
        title="Daftar varian"
        headerAction={
          <div className="flex items-center gap-2">
            <FilterSelect
              value={productId}
              onChange={setProductId}
              options={(products ?? []).map(({ id, nama }) => ({
                value: id,
                label: nama,
              }))}
              allLabel="Semua Produk"
              ariaLabel="Filter produk"
              className="w-44"
            />
            <Button type="button" size="sm" onClick={openTambah}>
              Tambah varian
            </Button>
          </div>
        }
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        caption={
          tanpaPcs > 0
            ? `${tanpaPcs} varian belum diisi jumlah pcs-nya. Varian itu tidak akan ikut terhitung di laporan "total pcs terjual".`
            : undefined
        }
        emptyMessage={
          isPending
            ? "Memuat…"
            : isError
              ? error.message
              : productId
                ? "Produk ini belum punya varian."
                : "Belum ada varian."
        }
      />

      <VariantFormSheet
        target={formTarget}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus varian?"
        description={
          <>
            Varian &quot;{deleteTarget?.nama}&quot; akan dihapus beserta daftar
            kemasannya. Tindakan ini tidak bisa dibatalkan.
          </>
        }
        onConfirm={() => {
          if (deleteTarget) deleteVariant(deleteTarget.id);
        }}
        isPending={isDeleting}
      />
    </>
  );
}
