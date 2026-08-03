"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";

import type { DataTableColumn } from "@/components/common/data-table-card";
import { IconActionButton } from "@/components/common/icon-action-button";
import { formatCurrency } from "@/lib/utils";
import type { Modifier } from "@/types/modifiers";

export function modifierColumns({
  onRequestEdit,
  onRequestDelete,
  isBusy,
}: {
  onRequestEdit: (modifier: Modifier) => void;
  onRequestDelete: (modifier: Modifier) => void;
  isBusy: boolean;
}): DataTableColumn<Modifier>[] {
  return [
    {
      header: "Nama",
      cellClassName: "font-medium",
      render: (row) => row.nama,
    },
    {
      header: "Tambahan harga",
      headClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatCurrency(row.tambahan_harga),
    },
    {
      header: "Tambahan modal",
      headClassName: "text-right",
      cellClassName: "text-right tabular-nums text-muted-foreground",
      render: (row) => formatCurrency(row.tambahan_modal),
    },
    {
      header: "Margin",
      headClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => {
        const margin = row.tambahan_harga - row.tambahan_modal;

        return (
          <span className={margin < 0 ? "text-destructive" : undefined}>
            {formatCurrency(margin)}
          </span>
        );
      },
    },

    {
      header: "Aksi",
      headClassName: "w-24 text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
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
