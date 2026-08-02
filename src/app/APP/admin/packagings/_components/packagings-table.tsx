"use client";

import { useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { DataTableCard } from "@/components/common/data-table-card";
import { Button } from "@/components/ui/button";
import { useDeletePackaging, usePackagings } from "@/hooks/use-packagings";
import type { Packaging } from "@/types/packagings";
import { packagingColumns } from "./columns";
import {
  PackagingFormSheet,
  type PackagingFormTarget,
} from "./packaging-form-sheet";

export function PackagingsTable() {
  // `open` sengaja dipisah dari `target`, bukan `target !== null`. Radix
  // menganimasikan sheet saat menutup; kalau target ikut dikosongkan, judul dan
  // label tombolnya berkedip dari "Ubah kemasan" ke "Tambah kemasan" selama
  // animasi itu. Dibiarkan begini, target baru ditimpa saat sheet dibuka lagi.
  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<PackagingFormTarget>({
    mode: "tambah",
  });

  // Baris yang sedang dikonfirmasi hapus. Yang disimpan barisnya, bukan id-nya,
  // supaya dialog bisa menyebut namanya tanpa mencari ulang ke daftar.
  const [deleteTarget, setDeleteTarget] = useState<Packaging | null>(null);

  const { data, isPending, isError, error } = usePackagings();
  const { mutate: deletePackaging, isPending: isDeleting } = useDeletePackaging({
    onSuccess: () => setDeleteTarget(null),
  });

  // React membatch keduanya jadi satu render, jadi `TriggerSheet` melihat
  // `open` menyala berbarengan dengan defaultValues yang sudah benar.
  const openTambah = () => {
    setFormTarget({ mode: "tambah" });
    setFormOpen(true);
  };

  const openUbah = (packaging: Packaging) => {
    setFormTarget({ mode: "ubah", packaging });
    setFormOpen(true);
  };

  const columns = packagingColumns({
    onRequestEdit: openUbah,
    onRequestDelete: setDeleteTarget,
    isBusy: isDeleting,
  });

  return (
    <>
      <DataTableCard<Packaging>
        title="Daftar kemasan"
        headerAction={
          <Button type="button" size="sm" onClick={openTambah}>
            Tambah kemasan
          </Button>
        }
        columns={columns}
        data={data ?? []}
        rowKey={(row) => row.id}
        // Card tetap terpasang di ketiga keadaan supaya layout tidak melompat.
        emptyMessage={
          isPending ? "Memuat…" : isError ? error.message : "Belum ada kemasan."
        }
      />

      {/* Di luar DataTableCard: komponen itu bukan client component dan sengaja
          tidak tahu apa-apa soal aksi. */}
      <PackagingFormSheet
        target={formTarget}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* Naskahnya mengikuti Kategori, bukan Varian: `variant_packagings`
          memakai `on delete restrict`, jadi tidak ada yang ikut runtuh — yang
          masih terpakai ditolak database. */}
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus kemasan?"
        description={
          <>
            Kemasan &quot;{deleteTarget?.nama}&quot; akan dihapus. Kalau masih
            dipakai varian, database akan menolaknya.
          </>
        }
        onConfirm={() => {
          if (deleteTarget) deletePackaging(deleteTarget.id);
        }}
        isPending={isDeleting}
      />
    </>
  );
}
