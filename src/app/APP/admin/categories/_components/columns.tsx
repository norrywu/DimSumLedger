"use client";

import type { DataTableColumn } from "@/components/common/data-table-card";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/categories";

/**
 * Fungsi, bukan konstanta, karena kolom Aksi butuh handler hapus dan status
 * pending yang hanya ada di dalam komponen pemanggil. `DataTableCard` sendiri
 * tidak tahu apa-apa soal aksi — ia cuma memanggil `render` tiap baris.
 */
export function categoryColumns({
  onDelete,
  isDeleting,
}: {
  onDelete: (id: string) => void;
  isDeleting: boolean;
}): DataTableColumn<Category>[] {
  return [
    {
      header: "Nama",
      cellClassName: "font-medium",
      render: (row) => row.nama,
    },
    {
      header: "Aksi",
      headClassName: "w-32 text-right",
      cellClassName: "text-right",
      render: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDeleting}
          onClick={() => onDelete(row.id)}
        >
          Hapus
        </Button>
      ),
    },
  ];
}
