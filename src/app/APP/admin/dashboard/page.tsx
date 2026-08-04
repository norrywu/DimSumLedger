import { DashboardScreen } from "./_components/dashboard-screen";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dasbor</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan penjualan dan arus kas.
        </p>
      </div>
      <DashboardScreen />
    </div>
  );
}
