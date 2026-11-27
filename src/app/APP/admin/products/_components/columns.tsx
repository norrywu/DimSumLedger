"use client";

import { PackagePlusIcon, PencilIcon, Trash2Icon } from "lucide-react";

import type { DataTableColumn } from "@/components/common/data-table-card";
import { IconActionButton } from "@/components/common/icon-action-button";
import { formatCurrency } from "@/lib/utils";
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
  onRequestAdjustStock,
  onRequestEdit,
  onRequestDelete,
  isBusy,
}: {
  onRequestAdjustStock: (product: Product) => void;
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
      header: "Stok",
      headClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => {
        if (!row.lacak_stok) {
          return <span className="text-muted-foreground">Tidak dilacak</span>;
        }
        if (row.stok_pcs === 0) {
          return (
            <span className="font-medium text-destructive">Habis (0 pcs)</span>
          );
        }
        return `${row.stok_pcs.toLocaleString("id-ID")} pcs`;
      },
    },
    {
      header: "Upah/pcs",
      headClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatCurrency(row.upah_per_pcs),
    },
    {
      header: "Aksi",
      headClassName: "w-32 text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {row.lacak_stok && (
            <IconActionButton
              label={`Catat stok ${row.nama}`}
              icon={<PackagePlusIcon />}
              disabled={isBusy}
              onClick={() => onRequestAdjustStock(row)}
            />
          )}
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
