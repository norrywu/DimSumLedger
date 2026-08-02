"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";

import type { DataTableColumn } from "@/components/common/data-table-card";
import { IconActionButton } from "@/components/common/icon-action-button";
import { formatCurrency } from "@/lib/utils";
import type { Variant } from "@/types/variants";

/**
 * Fungsi, bukan konstanta, karena kolom Aksi butuh handler dan status pending
 * yang hanya ada di dalam komponen pemanggil. `DataTableCard` sendiri tidak
 * tahu apa-apa soal aksi — ia cuma memanggil `render` tiap baris.
 *
 * Handler menerima baris utuh, bukan `id`, karena yang mengerjakan aksinya
 * bukan tombol ini melainkan sheet dan dialog konfirmasi — dan keduanya butuh
 * isi barisnya, bukan cuma penunjuknya.
 */
export function variantColumns({
  onRequestEdit,
  onRequestDelete,
  isBusy,
}: {
  onRequestEdit: (variant: Variant) => void;
  onRequestDelete: (variant: Variant) => void;
  isBusy: boolean;
}): DataTableColumn<Variant>[] {
  return [
    {
      header: "Produk",
      cellClassName: "text-muted-foreground",
      render: (row) => row.produk_nama,
    },
    {
      header: "Nama",
      cellClassName: "font-medium",
      render: (row) => row.nama,
    },
    {
      header: "Isi",
      headClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      // NULL berarti "jumlah pcs belum diketahui", bukan nol — jadi em dash,
      // bukan "0 pcs" yang terbaca seolah isinya memang kosong.
      render: (row) => (row.jumlah_pcs ? `${row.jumlah_pcs} pcs` : "—"),
    },
    {
      header: "Harga jual",
      // Angka uang dirata-kanan supaya satuan dan ribuannya sejajar antar baris;
      // tabular-nums bikin lebar tiap digit sama.
      headClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatCurrency(row.harga_jual),
    },
    {
      // Modal TOTAL, bukan modal bahan saja: modal bahan sendirian menyesatkan
      // karena kemasan belum ikut terhitung. Rinciannya tetap terlihat di
      // sheet ubah.
      header: "Modal",
      headClassName: "text-right",
      cellClassName: "text-right tabular-nums text-muted-foreground",
      render: (row) => formatCurrency(row.modal_total),
    },
    {
      // Angka yang paling dicari pemilik. Margin negatif berarti dijual di
      // bawah modal — harus langsung kelihatan, bukan perlu dihitung sendiri.
      header: "Margin",
      headClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => (
        <span className={row.margin < 0 ? "text-destructive" : undefined}>
          {formatCurrency(row.margin)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) =>
        row.aktif ? (
          "Aktif"
        ) : (
          <span className="text-muted-foreground">Nonaktif</span>
        ),
    },
    {
      header: "Aksi",
      headClassName: "w-24 text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {/* Nama varian ikut masuk label supaya pengguna screen reader tahu
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
