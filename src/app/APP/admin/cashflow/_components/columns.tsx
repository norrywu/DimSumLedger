"use client";

import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { PencilIcon, Trash2Icon } from "lucide-react";

import type { DataTableColumn } from "@/components/common/data-table-card";
import { IconActionButton } from "@/components/common/icon-action-button";
import { formatCurrency } from "@/lib/utils";
import type { CashFlow } from "@/types/cashflow";

const angka = "text-right tabular-nums";

export function cashFlowColumns({
  onRequestEdit,
  onRequestDelete,
  isBusy,
}: {
  onRequestEdit: (baris: CashFlow) => void;
  onRequestDelete: (baris: CashFlow) => void;
  isBusy: boolean;
}): DataTableColumn<CashFlow>[] {
  return [
    {
      header: "Tanggal",
      // `parseISO`, bukan `new Date(string)`: yang kedua membaca "2026-08-04"
      // sebagai tengah malam UTC dan bisa mundur sehari di zona negatif.
      render: (row) =>
        format(parseISO(row.transaction_date), "d MMM yyyy", {
          locale: idLocale,
        }),
    },
    {
      header: "Kategori",
      cellClassName: "font-medium",
      render: (row) => row.category,
    },
    {
      header: "Keterangan",
      cellClassName: "text-muted-foreground",
      render: (row) => row.description ?? "—",
    },
    {
      header: "Sumber",
      cellClassName: "text-muted-foreground",
      render: (row) => (row.source === "pos" ? "POS" : "Manual"),
    },
    {
      header: "Jumlah",
      headClassName: angka,
      cellClassName: angka,
      render: (row) => (
        <span className={row.type === "expense" ? "text-destructive" : ""}>
          {row.type === "expense" ? "−" : "+"} {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: "Aksi",
      headClassName: "w-24 text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {/* Baris POS tidak bisa diubah: angkanya cerminan penjualan, dan
              setoran berikutnya akan menimpanya lagi. Menghapus tetap boleh —
              tombol setor bisa membuatnya ulang. */}
          {row.source === "manual" && (
            <IconActionButton
              label={`Ubah ${row.category}`}
              icon={<PencilIcon />}
              disabled={isBusy}
              onClick={() => onRequestEdit(row)}
            />
          )}
          <IconActionButton
            label={`Hapus ${row.category}`}
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
