import { LaporanScreen } from "./_components/laporan-screen";

export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Laporan Penjualan
        </h1>
        <p className="text-sm text-muted-foreground">
          Omzet, modal, dan laba per varian.
        </p>
      </div>
      <LaporanScreen />
    </div>
  );
}
