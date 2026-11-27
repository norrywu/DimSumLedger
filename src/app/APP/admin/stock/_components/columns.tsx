"use client";

import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { PencilIcon, Trash2Icon } from "lucide-react";

import type { DataTableColumn } from "@/components/common/data-table-card";
import { IconActionButton } from "@/components/common/icon-action-button";
import type { StockHistory } from "@/types/stock";

const angka = "text-right tabular-nums";

export function stockHistoryColumns({
  onRequestEdit,
  onRequestDelete,
  isBusy,
}: {
  onRequestEdit: (baris: StockHistory) => void;
  onRequestDelete: (baris: StockHistory) => void;
  isBusy: boolean;
}): DataTableColumn<StockHistory>[] {
  return [
    {
      header: "Tanggal",
      render: (row) =>
        format(parseISO(row.tanggal), "d MMM yyyy", {
          locale: idLocale,
        }),
    },
    {
      header: "Produk",
      cellClassName: "font-medium",
      render: (row) =>
        row.produk_terhapus ? (
          <>
            {row.nama_produk}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (Terhapus)
            </span>
          </>
        ) : (
          row.nama_produk
        ),
    },
    {
      header: "Catatan",
      cellClassName: "text-muted-foreground",
      render: (row) => row.catatan ?? "—",
    },
    {
      header: "Pencatat",
      cellClassName: "text-muted-foreground",
      render: (row) => row.pelaku_nama,
    },
    {
      header: "Jumlah",
      headClassName: angka,
      cellClassName: angka,
      render: (row) => (
        <span className={row.jenis === "keluar" ? "text-destructive" : ""}>
          {row.jenis === "keluar" ? "−" : "+"}{" "}
          {row.jumlah_pcs.toLocaleString("id-ID")} pcs
        </span>
      ),
    },
    {
      header: "Aksi",
      headClassName: "w-24 text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {!row.produk_terhapus && (
            <IconActionButton
              label={`Ubah ${row.nama_produk}`}
              icon={<PencilIcon />}
              disabled={isBusy}
              onClick={() => onRequestEdit(row)}
            />
          )}
          <IconActionButton
            label={`Hapus ${row.nama_produk}`}
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
