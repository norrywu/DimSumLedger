import { RiwayatTable } from "@/components/transaksi/riwayat-table";

export default function AdminTransactionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Riwayat Transaksi
        </h1>
        <p className="text-sm text-muted-foreground">
          Seluruh transaksi dari semua kasir, terbaru di atas.
        </p>
      </div>
      <RiwayatTable title="Semua transaksi" tampilkanKasir />
    </div>
  );
}
