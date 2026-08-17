"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { DataTableCard } from "@/components/common/data-table-card";
import { IconActionButton } from "@/components/common/icon-action-button";
import { StatTile } from "@/components/common/stat-tile";
import { Button } from "@/components/ui/button";
import { hariIni, tanggalKe } from "@/constants/cashflow-constant";
import { useCashFlow } from "@/hooks/use-cashflow";
import { useLaporanPenjualan } from "@/hooks/use-laporan";
import { jumlahkanPerVarian } from "@/lib/report";
import { formatCurrency } from "@/lib/utils";
import type { BarisLaporan } from "@/types/laporan";

const angka = "text-right tabular-nums";

function ringkas(rows: BarisLaporan[]) {
  return rows.reduce(
    (total, row) => ({
      porsi: total.porsi + row.porsi,
      omzet: total.omzet + row.omzet,
      laba: total.laba + row.laba,
      upah: total.upah + row.modal_upah,
    }),
    { porsi: 0, omzet: 0, laba: 0, upah: 0 },
  );
}

export function DashboardScreen() {
  const router = useRouter();
  const { data: hariIniRows } = useLaporanPenjualan("hari_ini");
  const {
    data: bulanRows,
    isPending,
    isError,
  } = useLaporanPenjualan("30_hari");
  const { data: kas } = useCashFlow(tanggalKe(29), hariIni());

  const hari = ringkas(hariIniRows ?? []);
  const bulan = ringkas(bulanRows ?? []);

  const masuk = (kas ?? [])
    .filter((row) => row.type === "income")
    .reduce((jumlahnya, row) => jumlahnya + row.amount, 0);
  const keluar = (kas ?? [])
    .filter((row) => row.type === "expense")
    .reduce((jumlahnya, row) => jumlahnya + row.amount, 0);

  const margin =
    bulan.omzet > 0 ? Math.round((bulan.laba / bulan.omzet) * 100) : 0;

  return (
    <>
      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Hari ini
          </h2>
          <IconActionButton
            label="Buka layar kasir"
            icon={<ShoppingCart />}
            onClick={() => router.push("/APP/cashier/order")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Omzet" nilai={formatCurrency(hari.omzet)} />
          <StatTile label="Laba" nilai={formatCurrency(hari.laba)} />
          <StatTile label="Porsi terjual" nilai={`${hari.porsi}`} />
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          30 hari terakhir
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <StatTile label="Omzet" nilai={formatCurrency(bulan.omzet)} />
          <StatTile
            label="Laba"
            nilai={formatCurrency(bulan.laba)}
            keterangan={bulan.omzet > 0 ? `Margin ${margin}%` : undefined}
          />
          <StatTile label="Upah" nilai={formatCurrency(bulan.upah)} />
          <StatTile
            label="Selisih kas"
            nilai={formatCurrency(masuk - keluar)}
            keterangan={`Masuk ${formatCurrency(masuk)} · Keluar ${formatCurrency(keluar)}`}
          />
        </div>
      </section>

      <DataTableCard<BarisLaporan>
        title="Terlaris 30 hari"
        headerAction={
          <Button asChild variant="outline" size="sm">
            <Link href="/APP/admin/reports">Lihat laporan</Link>
          </Button>
        }
        columns={[
          { header: "Produk", render: (row) => row.nama_produk },
          { header: "Varian", render: (row) => row.nama_varian },
          { header: "Kategori", render: (row) => row.nama_kategori },
          {
            header: "Porsi",
            headClassName: angka,
            cellClassName: angka,
            render: (row) => row.porsi,
          },
          {
            header: "Omzet",
            headClassName: angka,
            cellClassName: angka,
            render: (row) => formatCurrency(row.omzet),
          },
          {
            header: "Laba",
            headClassName: angka,
            cellClassName: angka,
            render: (row) => formatCurrency(row.laba),
          },
        ]}
        // RPC mengembalikan baris per varian per kasir; gabungkan dulu per
        // varian, lalu potong lima teratas tanpa menyortir ulang.
        data={jumlahkanPerVarian(bulanRows ?? []).slice(0, 5)}
        rowKey={(row) => `${row.nama_produk}|${row.nama_varian}`}
        emptyMessage={
          isPending
            ? "Memuat…"
            : isError
              ? "Gagal memuat laporan. Silakan coba lagi."
              : "Belum ada penjualan 30 hari terakhir."
        }
      />
    </>
  );
}
