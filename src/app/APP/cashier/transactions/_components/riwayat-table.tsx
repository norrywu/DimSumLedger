"use client";

import { useState } from "react";

import { DataTableCard } from "@/components/common/data-table-card";
import { useRiwayatTransaksi } from "@/hooks/use-transaksi";
import { formatCurrency } from "@/lib/utils";
import type { RiwayatTransaksi } from "@/types/cashier";
import { riwayatColumns } from "./columns";
import { DetailSheet } from "./detail-sheet";

export function RiwayatTable() {
  const [detail, setDetail] = useState<RiwayatTransaksi | null>(null);

  const { data, isPending, isError, error } = useRiwayatTransaksi();

  const rows = data ?? [];
  const selesai = rows.filter((row) => row.status !== "dibatalkan");
  const omzet = selesai.reduce((jumlahnya, row) => jumlahnya + row.total, 0);

  return (
    <>
      <DataTableCard<RiwayatTransaksi>
        title="Riwayat transaksi"
        columns={riwayatColumns({ onLihat: setDetail })}
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
    </>
  );
}
