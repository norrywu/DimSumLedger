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
import {
  VariantFormSheet,
  type VariantFormTarget,
} from "./variant-form-sheet";

export function VariantsTable() {
  // `open` sengaja dipisah dari `target`, bukan `target !== null`. Radix
  // menganimasikan sheet saat menutup; kalau target ikut dikosongkan, judul dan
  // label tombolnya berkedip dari "Ubah varian" ke "Tambah varian" selama
  // animasi itu. Dibiarkan begini, target baru ditimpa saat sheet dibuka lagi.
  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<VariantFormTarget>({
    mode: "tambah",
  });

  // Baris yang sedang dikonfirmasi hapus. Yang disimpan barisnya, bukan id-nya,
  // supaya dialog bisa menyebut nama variannya tanpa mencari ulang ke daftar.
  const [deleteTarget, setDeleteTarget] = useState<Variant | null>(null);

  // undefined = tanpa filter; lihat `FilterSelect`.
  const [productId, setProductId] = useState<string>();

  const { data, isPending, isError, error } = useVariants();
  const { data: products } = useProducts();
  const { mutate: deleteVariant, isPending: isDeleting } = useDeleteVariant({
    onSuccess: () => setDeleteTarget(null),
  });

  // Difilter di browser atas hasil query yang sudah ada: tidak menambah request
  // dan tidak menyentuh VARIANTS_KEY. Kalau daftarnya nanti terlalu besar untuk
  // diangkut sekaligus, filternya pindah ke query dan key-nya ikut berubah.
  const rows = productId
    ? (data ?? []).filter((variant) => variant.product_id === productId)
    : (data ?? []);

  // React membatch keduanya jadi satu render, jadi `TriggerSheet` melihat
  // `open` menyala berbarengan dengan defaultValues yang sudah benar.
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
          // `headerAction` cuma satu ReactNode, jadi kedua kontrolnya dibungkus.
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
        // Card tetap terpasang di keempat keadaan supaya layout tidak melompat.
        // "Belum ada varian" dibedakan dari hasil filter yang kosong — kalau
        // disamakan, memfilter produk yang belum punya varian terbaca seolah
        // seluruh datanya hilang.
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

      {/* Di luar DataTableCard: komponen itu bukan client component dan sengaja
          tidak tahu apa-apa soal aksi. */}
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
