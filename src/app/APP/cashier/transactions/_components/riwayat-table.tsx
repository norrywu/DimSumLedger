"use client";

import { useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { DataTableCard } from "@/components/common/data-table-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  useBatalkanTransaksi,
  useRiwayatTransaksi,
} from "@/hooks/use-transaksi";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RiwayatTransaksi } from "@/types/cashier";
import { riwayatColumns } from "./columns";
import { DetailSheet } from "./detail-sheet";

export function RiwayatTable() {
  const [detail, setDetail] = useState<RiwayatTransaksi | null>(null);
  const [batalTarget, setBatalTarget] = useState<RiwayatTransaksi | null>(null);

  const {
    data,
    isPending,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRiwayatTransaksi();

  const { mutate: batalkan, isPending: isBatal } = useBatalkanTransaksi({
    onSuccess: () => setBatalTarget(null),
  });

  const rows = data?.pages.flat() ?? [];

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
        // Sengaja tanpa jumlah omzet: yang dimuat baru sebagian, jadi angka
        // apa pun di sini akan terbaca sebagai total padahal bukan.
        caption={
          rows.length > 0
            ? `Menampilkan ${rows.length} transaksi terbaru.`
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

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage && <Spinner data-icon="inline-start" />}
            Muat lebih banyak
          </Button>
        </div>
      )}

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
