import { CashFlowScreen } from "./_components/cashflow-screen";

export default function CashFlowPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Arus Kas</h1>
        <p className="text-sm text-muted-foreground">
          Pemasukan dan pengeluaran, termasuk setoran omzet dari kasir.
        </p>
      </div>
      <CashFlowScreen />
    </div>
  );
}
