"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";

import type { DataTableColumn } from "@/components/common/data-table-card";
import { IconActionButton } from "@/components/common/icon-action-button";
import { ROLE_LABELS } from "@/constants/users-constant";
import { formatDateTime } from "@/lib/utils";
import type { User } from "@/types/users";

/**
 * Fungsi, bukan konstanta, karena kolom Aksi butuh handler dan status pending
 * yang hanya ada di dalam komponen pemanggil.
 *
 * `currentUserId` ikut masuk supaya baris milik pengelola yang sedang login
 * bisa ditandai — bukan sekadar hiasan: `deletePengguna` menolak penghapusan
 * diri sendiri, dan tombol yang pasti gagal lebih baik tidak bisa ditekan sama
 * sekali.
 */
export function userColumns({
  currentUserId,
  onRequestEdit,
  onRequestDelete,
  isBusy,
}: {
  currentUserId: string | undefined;
  onRequestEdit: (user: User) => void;
  onRequestDelete: (user: User) => void;
  isBusy: boolean;
}): DataTableColumn<User>[] {
  return [
    {
      header: "Nama",
      cellClassName: "font-medium",
      render: (row) =>
        row.id === currentUserId ? (
          <>
            {row.name}{" "}
            <span className="font-normal text-muted-foreground">(kamu)</span>
          </>
        ) : (
          row.name
        ),
    },
    {
      header: "Email",
      cellClassName: "text-muted-foreground",
      render: (row) => row.email,
    },
    {
      header: "Role",
      render: (row) => ROLE_LABELS[row.role],
    },
    {
      header: "Terakhir masuk",
      cellClassName: "text-muted-foreground",
      // `formatDateTime` sudah mengubah null jadi em dash — akun yang belum
      // pernah dipakai, bukan tanggal yang hilang.
      render: (row) => formatDateTime(row.last_sign_in_at),
    },
    {
      header: "Aksi",
      headClassName: "w-24 text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          {/* Nama ikut masuk label supaya pengguna screen reader tahu baris
              mana yang dituju, bukan "Ubah" berulang belasan kali. */}
          <IconActionButton
            label={`Ubah ${row.name}`}
            icon={<PencilIcon />}
            disabled={isBusy}
            onClick={() => onRequestEdit(row)}
          />
          <IconActionButton
            label={
              row.id === currentUserId
                ? "Tidak bisa menghapus akun sendiri"
                : `Hapus ${row.name}`
            }
            icon={<Trash2Icon />}
            disabled={isBusy || row.id === currentUserId}
            onClick={() => onRequestDelete(row)}
            className="text-destructive hover:text-destructive"
          />
        </div>
      ),
    },
  ];
}
