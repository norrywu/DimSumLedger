"use client";

import { useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { DataTableCard } from "@/components/common/data-table-card";
import { useBatalkanTransaksi, useRiwayatTransaksi } from "@/hooks/use-transaksi";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RiwayatTransaksi } from "@/types/cashier";
import { riwayatColumns } from "./columns";
import { DetailSheet } from "./detail-sheet";

export function RiwayatTable() {
  const [detail, setDetail] = useState<RiwayatTransaksi | null>(null);
  const [batalTarget, setBatalTarget] = useState<RiwayatTransaksi | null>(null);

  const { data, isPending, isError, error } = useRiwayatTransaksi();
  const { mutate: batalkan, isPending: isBatal } = useBatalkanTransaksi({
    onSuccess: () => setBatalTarget(null),
  });

  const rows = data ?? [];
  const selesai = rows.filter((row) => row.status !== "dibatalkan");
  const omzet = selesai.reduce((jumlahnya, row) => jumlahnya + row.total, 0);

  return (
    <>
      <DataTableCard<RiwayatTransaksi>
        title="Riwayat transaksi"
        columns={riwayatColumns({
          onLihat: setDetail,
          onBatalkan: setBatalTarget,
          isBusy: isBatal,
        })}
        data={rows}
        rowKey={(row) => row.id}
        caption={
          rows.length > 0
            ? `${selesai.length} transaksi selesai · ${formatCurrency(omzet)}. Menampilkan 50 terbaru.`
            : undefined
        }
        emptyMessage={
          isPending
            ? "Memuat…"
            : isError
              ? error.message
              : "Belum ada transaksi."
        }
      />

      <DetailSheet
        transaksi={detail}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />

      <ConfirmDeleteDialog
        open={batalTarget !== null}
        onOpenChange={(open) => {
          if (!open) setBatalTarget(null);
        }}
        title="Batalkan transaksi?"
        description={
          <>
            Transaksi {formatDateTime(batalTarget?.created_at)} senilai{" "}
            {formatCurrency(batalTarget?.total ?? 0)} akan ditandai dibatalkan
            dan tidak lagi dihitung sebagai omzet. Notanya tetap tersimpan, tapi
            statusnya tidak bisa dikembalikan.
          </>
        }
        confirmLabel="Batalkan transaksi"
        pendingLabel="Membatalkan..."
        cancelLabel="Tutup"
        onConfirm={() => {
          if (batalTarget) batalkan(batalTarget.id);
        }}
        isPending={isBatal}
      />
    </>
  );
}
