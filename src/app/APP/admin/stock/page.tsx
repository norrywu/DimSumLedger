import { StockScreen } from "./_components/stock-screen";

export default function StockPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Riwayat Stok</h1>
        <p className="text-sm text-muted-foreground">
          Catatan penambahan dan pengurangan stok manual per produk. Penjualan
          kasir mengurangi stok secara otomatis.
        </p>
      </div>
      <StockScreen />
    </div>
  );
}
