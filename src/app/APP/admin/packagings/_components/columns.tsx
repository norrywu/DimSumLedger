"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";

import type { DataTableColumn } from "@/components/common/data-table-card";
import { IconActionButton } from "@/components/common/icon-action-button";
import { formatCurrency } from "@/lib/utils";
import type { Packaging } from "@/types/packagings";

/**
 * Fungsi, bukan konstanta, karena kolom Aksi butuh handler dan status pending
 * yang hanya ada di dalam komponen pemanggil. `DataTableCard` sendiri tidak
 * tahu apa-apa soal aksi — ia cuma memanggil `render` tiap baris.
 *
 * Handler menerima baris utuh, bukan `id`, karena yang mengerjakan aksinya
 * bukan tombol ini melainkan sheet dan dialog konfirmasi — dan keduanya butuh
 * isi barisnya, bukan cuma penunjuknya.
 */
export function packagingColumns({
  onRequestEdit,
  onRequestDelete,
  isBusy,
}: {
  onRequestEdit: (packaging: Packaging) => void;
  onRequestDelete: (packaging: Packaging) => void;
  isBusy: boolean;
}): DataTableColumn<Packaging>[] {
  return [
    {
      header: "Nama",
      cellClassName: "font-medium",
      render: (row) => row.nama,
    },
    {
      header: "Harga satuan",
      // Angka uang dirata-kanan supaya satuan dan ribuannya sejajar antar baris;
      // tabular-nums bikin lebar tiap digit sama.
      headClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatCurrency(row.harga_satuan),
    },
    {
      header: "Aksi",
      headClassName: "w-24 text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {/* Nama kemasan ikut masuk label supaya pengguna screen reader tahu
              baris mana yang dituju, bukan "Ubah" berulang belasan kali. */}
          <IconActionButton
            label={`Ubah ${row.nama}`}
            icon={<PencilIcon />}
            disabled={isBusy}
            onClick={() => onRequestEdit(row)}
          />
          <IconActionButton
            label={`Hapus ${row.nama}`}
            icon={<Trash2Icon />}
            disabled={isBusy}
            onClick={() => onRequestDelete(row)}
            className="text-destructive hover:text-destructive"
          />
        </div>
      ),
    },
  ];
}
