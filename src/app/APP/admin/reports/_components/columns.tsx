import type { DataTableColumn } from "@/components/common/data-table-card";
import { formatCurrency } from "@/lib/utils";
import type { BarisLaporan } from "@/types/laporan";

const angka = "text-right tabular-nums";

export const laporanColumns: DataTableColumn<BarisLaporan>[] = [
  { header: "Produk", render: (row) => row.nama_produk },
  { header: "Varian", render: (row) => row.nama_varian },
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
    header: "Modal",
    headClassName: angka,
    cellClassName: angka,
    render: (row) => formatCurrency(row.modal),
  },
  {
    header: "Laba",
    headClassName: angka,
    cellClassName: angka,
    render: (row) => formatCurrency(row.laba),
  },
  {
    header: "Margin",
    headClassName: angka,
    cellClassName: angka,
    // Omzet nol bukan margin nol — tidak ada yang terjual, jadi tidak ada
    // margin untuk dihitung.
    render: (row) =>
      row.omzet > 0 ? `${Math.round((row.laba / row.omzet) * 100)}%` : "—",
  },
];
