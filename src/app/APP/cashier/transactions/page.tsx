import { RiwayatTable } from "./_components/riwayat-table";

export default function CashierTransactionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Riwayat</h1>
        <p className="text-sm text-muted-foreground">
          Transaksi yang kamu catat, terbaru di atas.
        </p>
      </div>
      <RiwayatTable />
    </div>
  );
}
