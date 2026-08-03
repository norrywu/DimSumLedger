"use client";

import { useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { DataTableCard } from "@/components/common/data-table-card";
import { Button } from "@/components/ui/button";
import { useDeleteModifier, useModifiers } from "@/hooks/use-modifiers";
import type { Modifier } from "@/types/modifiers";
import { modifierColumns } from "./columns";
import {
  ModifierFormSheet,
  type ModifierFormTarget,
} from "./modifier-form-sheet";

export function ModifiersTable() {
  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<ModifierFormTarget>({
    mode: "tambah",
  });

  const [deleteTarget, setDeleteTarget] = useState<Modifier | null>(null);

  const { data, isPending, isError, error } = useModifiers();
  const { mutate: deleteModifier, isPending: isDeleting } = useDeleteModifier({
    onSuccess: () => setDeleteTarget(null),
  });

  const openTambah = () => {
    setFormTarget({ mode: "tambah" });
    setFormOpen(true);
  };

  const openUbah = (modifier: Modifier) => {
    setFormTarget({ mode: "ubah", modifier });
    setFormOpen(true);
  };

  const columns = modifierColumns({
    onRequestEdit: openUbah,
    onRequestDelete: setDeleteTarget,
    isBusy: isDeleting,
  });

  return (
    <>
      <DataTableCard<Modifier>
        title="Daftar extra"
        headerAction={
          <Button type="button" size="sm" onClick={openTambah}>
            Tambah extra
          </Button>
        }
        columns={columns}
        data={data ?? []}
        rowKey={(row) => row.id}
        emptyMessage={
          isPending ? "Memuat…" : isError ? error.message : "Belum ada extra."
        }
      />

      <ModifierFormSheet
        target={formTarget}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus extra?"
        description={
          <>
            Extra &quot;{deleteTarget?.nama}&quot; akan dihapus dan tidak bisa
            dipilih lagi saat kasir mencatat pesanan.
          </>
        }
        onConfirm={() => {
          if (deleteTarget) deleteModifier(deleteTarget.id);
        }}
        isPending={isDeleting}
      />
    </>
  );
}
