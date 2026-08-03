"use client";

import { useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { DataTableCard } from "@/components/common/data-table-card";
import { useAuthStore } from "@/components/providers/auth-store-provider";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/constants/users-constant";
import { useDeleteUser, useUsers } from "@/hooks/use-users";
import type { User } from "@/types/users";
import { userColumns } from "./columns";
import { UserFormSheet, type UserFormTarget } from "./user-form-sheet";

export function UsersTable() {
  // `open` sengaja dipisah dari `target`, bukan `target !== null`. Radix
  // menganimasikan sheet saat menutup; kalau target ikut dikosongkan, judul dan
  // label tombolnya berkedip dari "Ubah pengguna" ke "Tambah pengguna" selama
  // animasi itu.
  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<UserFormTarget>({
    mode: "tambah",
  });

  // Baris yang sedang dikonfirmasi hapus. Yang disimpan barisnya, bukan id-nya,
  // supaya dialog bisa menyebut namanya tanpa mencari ulang ke daftar.
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Selector atomik, sama seperti `AppSidebar`. Dipakai untuk menandai baris
  // sendiri dan mematikan tombol hapusnya — `deletePengguna` menolaknya di
  // server, ini cuma supaya tidak perlu ditolak.
  const currentUserId = useAuthStore((state) => state.user?.id);

  const { data, isPending, isError, error } = useUsers();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser({
    onSuccess: () => setDeleteTarget(null),
  });

  // React membatch keduanya jadi satu render, jadi `TriggerSheet` melihat
  // `open` menyala berbarengan dengan defaultValues yang sudah benar.
  const openTambah = () => {
    setFormTarget({ mode: "tambah" });
    setFormOpen(true);
  };

  const openUbah = (user: User) => {
    setFormTarget({ mode: "ubah", user });
    setFormOpen(true);
  };

  const columns = userColumns({
    currentUserId,
    onRequestEdit: openUbah,
    onRequestDelete: setDeleteTarget,
    isBusy: isDeleting,
  });

  return (
    <>
      <DataTableCard<User>
        title="Daftar pengguna"
        headerAction={
          <Button type="button" size="sm" onClick={openTambah}>
            Tambah pengguna
          </Button>
        }
        columns={columns}
        data={data ?? []}
        rowKey={(row) => row.id}
        // Card tetap terpasang di ketiga keadaan supaya layout tidak melompat.
        // Kasir yang memaksa membuka halaman ini mendarat di cabang isError,
        // membawa pesan dari RAISE EXCEPTION di `daftar_pengguna`.
        emptyMessage={
          isPending
            ? "Memuat…"
            : isError
              ? error.message
              : "Belum ada pengguna."
        }
      />

      {/* Di luar DataTableCard: komponen itu bukan client component dan sengaja
          tidak tahu apa-apa soal aksi. */}
      <UserFormSheet
        target={formTarget}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus pengguna?"
        // Tanpa penjaga `deleteTarget &&`, role-nya harus diberi nilai cadangan
        // — dan cadangan itu akan tertampil sebagai role yang salah selama
        // animasi dialog menutup.
        description={
          <>
            Akun {deleteTarget?.email}
            {deleteTarget ? ` (${ROLE_LABELS[deleteTarget.role]})` : ""} akan
            dihapus permanen beserta profilnya, dan orangnya langsung kehilangan
            akses. Riwayat transaksi yang sudah tercatat tidak ikut terhapus.
          </>
        }
        onConfirm={() => {
          if (deleteTarget) deleteUser(deleteTarget.id);
        }}
        isPending={isDeleting}
      />
    </>
  );
}
