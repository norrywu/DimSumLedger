"use client";

import { useState } from "react";

import { DataTableCard } from "@/components/common/data-table-card";
import { FilterSelect } from "@/components/common/filter-select";
import { Card, CardContent } from "@/components/ui/card";
import { PERIODE_OPTIONS } from "@/constants/laporan-constant";
import { useLaporanPenjualan } from "@/hooks/use-laporan";
import { formatCurrency } from "@/lib/utils";
import type { BarisLaporan, PeriodeLaporan } from "@/types/laporan";
import { laporanColumns } from "./columns";

const KOSONG = {
  porsi: 0,
  omzet: 0,
  modal: 0,
  laba: 0,
  bahan: 0,
  kemasan: 0,
  extra: 0,
};

function jumlahkan(rows: BarisLaporan[]) {
  return rows.reduce(
    (total, row) => ({
      porsi: total.porsi + row.porsi,
      omzet: total.omzet + row.omzet,
      modal: total.modal + row.modal,
      laba: total.laba + row.laba,
      bahan: total.bahan + row.modal_bahan,
      kemasan: total.kemasan + row.modal_kemasan,
      extra: total.extra + row.modal_extra,
    }),
    KOSONG,
  );
}

function Tile({
  label,
  nilai,
  keterangan,
}: {
  label: string;
  nilai: string;
  keterangan?: string;
}) {
  return (
    <Card>
      <CardContent className="grid gap-1 py-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tabular-nums">{nilai}</span>
        {keterangan && (
          <span className="text-xs text-muted-foreground">{keterangan}</span>
        )}
      </CardContent>
    </Card>
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
          {total.porsi} porsi terjual
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Omzet" nilai={formatCurrency(total.omzet)} />
        <Tile
          label="Modal"
          nilai={formatCurrency(total.modal)}
          keterangan={`Bahan ${formatCurrency(total.bahan)} · Kemasan ${formatCurrency(total.kemasan)} · Extra ${formatCurrency(total.extra)}`}
        />
        <Tile
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
