"use client";

import { useState } from "react";

import { DataTableCard } from "@/components/common/data-table-card";
import { FilterSelect } from "@/components/common/filter-select";
import { StatTile } from "@/components/common/stat-tile";
import { PERIODE_OPTIONS } from "@/constants/laporan-constant";
import { useLaporanPenjualan } from "@/hooks/use-laporan";
import { formatCurrency } from "@/lib/utils";
import type { BarisLaporan, PeriodeLaporan } from "@/types/laporan";
import { laporanColumns } from "./columns";

const KOSONG = {
  porsi: 0,
  pcs: 0,
  omzet: 0,
  modal: 0,
  laba: 0,
  bahan: 0,
  kemasan: 0,
  upah: 0,
  extra: 0,
};

function jumlahkan(rows: BarisLaporan[]) {
  return rows.reduce(
    (total, row) => ({
      porsi: total.porsi + row.porsi,
      pcs: total.pcs + row.pcs,
      omzet: total.omzet + row.omzet,
      modal: total.modal + row.modal,
      laba: total.laba + row.laba,
      bahan: total.bahan + row.modal_bahan,
      kemasan: total.kemasan + row.modal_kemasan,
      upah: total.upah + row.modal_upah,
      extra: total.extra + row.modal_extra,
    }),
    KOSONG,
  );
}

/**
 * Rincian berkolom, bukan satu baris dipisah titik tengah: angka-angka ini
 * menjumlah ke nilai utama kartunya, dan itu hanya bisa diperiksa mata kalau
 * satuannya berbaris rata kanan.
 */
function Rincian({ baris }: { baris: [string, number][] }) {
  return (
    <span className="mt-1 grid gap-0.5">
      {baris.map(([label, nilai]) => (
        <span key={label} className="flex justify-between gap-4">
          <span>{label}</span>
          <span className="tabular-nums">{formatCurrency(nilai)}</span>
        </span>
      ))}
    </span>
  );
}

export function LaporanScreen() {
  const [periode, setPeriode] = useState<PeriodeLaporan | undefined>("30_hari");

  const { data, isPending, isError, error } = useLaporanPenjualan(periode);

  const rows = data ?? [];
  const total = jumlahkan(rows);
  const margin =
    total.omzet > 0 ? Math.round((total.laba / total.omzet) * 100) : 0;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <FilterSelect
          value={periode}
          onChange={setPeriode}
          options={PERIODE_OPTIONS}
          allLabel="Semua waktu"
          ariaLabel="Filter periode"
          className="w-48"
        />
        <span className="text-sm text-muted-foreground tabular-nums">
          {total.porsi} porsi · {total.pcs} pcs terjual
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label="Omzet" nilai={formatCurrency(total.omzet)} />
        <StatTile
          label="Modal"
          nilai={formatCurrency(total.modal)}
          keterangan={
            <Rincian
              baris={[
                ["Bahan", total.bahan],
                ["Kemasan", total.kemasan],
                ["Extra", total.extra],
              ]}
            />
          }
        />
        <StatTile
          label="Upah"
          nilai={formatCurrency(total.upah)}
          keterangan={
            total.pcs > 0
              ? `${total.pcs} pcs · sudah termasuk di Modal`
              : undefined
          }
        />
        <StatTile
          label="Laba"
          nilai={formatCurrency(total.laba)}
          keterangan={total.omzet > 0 ? `Margin ${margin}%` : undefined}
        />
      </div>

      <DataTableCard<BarisLaporan>
        title="Penjualan per varian"
        columns={laporanColumns}
        data={rows}
        rowKey={(row) => `${row.nama_produk}|${row.nama_varian}`}
        caption="Transaksi yang dibatalkan tidak ikut dihitung. Diurutkan dari omzet terbesar."
        emptyMessage={
          isPending
            ? "Memuat…"
            : isError
              ? error.message
              : "Belum ada penjualan di periode ini."
        }
      />
    </>
  );
}
