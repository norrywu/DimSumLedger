import { OrderScreen } from "./_components/order-screen";

export default function OrderPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Kasir</h1>
        <p className="text-sm text-muted-foreground">
          Pilih menu di kiri, keranjang tersusun di kanan.
        </p>
      </div>
      <OrderScreen />
    </div>
  );
}
