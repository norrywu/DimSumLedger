import type { DataTableColumn } from "@/components/common/data-table-card";
import { Button } from "@/components/ui/button";
import { hitungKembalian } from "@/lib/count";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RiwayatTransaksi } from "@/types/cashier";

const angka = "text-right tabular-nums";

export function riwayatColumns({
  onLihat,
}: {
  onLihat: (transaksi: RiwayatTransaksi) => void;
}): DataTableColumn<RiwayatTransaksi>[] {
  return [
    {
      header: "Waktu",
      render: (row) => formatDateTime(row.created_at),
    },
    {
      header: "Isi",
      render: (row) => {
        const porsi = row.transaksi_item.reduce(
          (jumlahnya, item) => jumlahnya + item.qty,
          0,
        );

        return `${porsi} porsi`;
      },
    },
    {
      header: "Total",
      headClassName: angka,
      cellClassName: angka,
      render: (row) => formatCurrency(row.total),
    },
    {
      header: "Dibayar",
      headClassName: angka,
      cellClassName: angka,
      render: (row) => formatCurrency(row.dibayar),
    },
    {
      header: "Kembalian",
      headClassName: angka,
      cellClassName: angka,
      render: (row) =>
        formatCurrency(
          hitungKembalian({ total: row.total, dibayar: row.dibayar }).kembalian,
        ),
    },
    {
      header: "Status",
      render: (row) =>
        row.status === "dibatalkan" ? (
          <span className="text-destructive">Dibatalkan</span>
        ) : (
          <span className="text-muted-foreground">Selesai</span>
        ),
    },
    {
      header: "",
      cellClassName: "text-right",
      render: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onLihat(row)}
        >
          Lihat
        </Button>
      ),
    },
  ];
}
