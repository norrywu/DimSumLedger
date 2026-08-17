import { BanIcon, EyeIcon } from "lucide-react";

import type { DataTableColumn } from "@/components/common/data-table-card";
import { IconActionButton } from "@/components/common/icon-action-button";
import { hitungKembalian } from "@/lib/count";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RiwayatTransaksi } from "@/types/cashier";

const angka = "text-right tabular-nums";

/**
 * `tampilkanKasir` hanya untuk halaman pengelola: di layar kasir semua nota
 * memang miliknya sendiri, jadi kolomnya cuma mengulang nama yang sama.
 */
export function riwayatColumns({
  onLihat,
  onBatalkan,
  isBusy,
  tampilkanKasir = false,
}: {
  onLihat: (transaksi: RiwayatTransaksi) => void;
  onBatalkan: (transaksi: RiwayatTransaksi) => void;
  isBusy?: boolean;
  tampilkanKasir?: boolean;
}): DataTableColumn<RiwayatTransaksi>[] {
  return [
    {
      header: "ID",
      render: (row) => `#${row.id.slice(0, 8)}`,
    },
    {
      header: "Waktu",
      render: (row) => formatDateTime(row.created_at),
    },
    ...(tampilkanKasir
      ? [
          {
            header: "Kasir",
            render: (row: RiwayatTransaksi) => row.kasir_nama,
          },
        ]
      : []),
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
        <div className="flex justify-end gap-1">
          {/* Waktu ikut masuk label supaya pengguna screen reader tahu baris
              mana yang dituju, bukan "Lihat" berulang belasan kali. */}
          <IconActionButton
            label={`Lihat transaksi ${formatDateTime(row.created_at)}`}
            icon={<EyeIcon />}
            onClick={() => onLihat(row)}
          />
          {row.status !== "dibatalkan" && (
            <IconActionButton
              label={`Batalkan transaksi ${formatDateTime(row.created_at)}`}
              icon={<BanIcon />}
              disabled={isBusy}
              onClick={() => onBatalkan(row)}
              className="text-destructive hover:text-destructive"
            />
          )}
        </div>
      ),
    },
  ];
}
