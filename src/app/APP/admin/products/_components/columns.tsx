"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";

import type { DataTableColumn } from "@/components/common/data-table-card";
import { IconActionButton } from "@/components/common/icon-action-button";
import type { Product } from "@/types/products";

/**
 * Fungsi, bukan konstanta, karena kolom Aksi butuh handler dan status pending
 * yang hanya ada di dalam komponen pemanggil. `DataTableCard` sendiri tidak
 * tahu apa-apa soal aksi — ia cuma memanggil `render` tiap baris.
 *
 * Handler menerima baris utuh, bukan `id`, karena yang mengerjakan aksinya
 * bukan tombol ini melainkan sheet dan dialog konfirmasi — dan keduanya butuh
 * isi barisnya, bukan cuma penunjuknya.
 */
export function productColumns({
  onRequestEdit,
  onRequestDelete,
  isBusy,
}: {
  onRequestEdit: (product: Product) => void;
  onRequestDelete: (product: Product) => void;
  isBusy: boolean;
}): DataTableColumn<Product>[] {
  return [
    {
      header: "Nama",
      cellClassName: "font-medium",
      render: (row) => row.nama,
    },
    {
      header: "Kategori",
      cellClassName: "text-muted-foreground",
      render: (row) => row.kategori_nama,
    },
    {
      header: "Aksi",
      headClassName: "w-24 text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {/* Nama produk ikut masuk label supaya pengguna screen reader tahu
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
