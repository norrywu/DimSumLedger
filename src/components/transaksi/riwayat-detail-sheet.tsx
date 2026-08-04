"use client";

import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { hitungKembalian } from "@/lib/count";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RiwayatTransaksi } from "@/types/cashier";

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{nilai}</span>
    </div>
  );
}

export function DetailSheet({
  transaksi,
  open,
  onOpenChange,
}: {
  transaksi: RiwayatTransaksi | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { kembalian } = hitungKembalian({
    total: transaksi?.total ?? 0,
    dibayar: transaksi?.dibayar ?? 0,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detail transaksi</SheetTitle>
          <SheetDescription>
            {transaksi ? formatDateTime(transaksi.created_at) : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 content-start gap-4 overflow-y-auto px-4 py-6">
          {transaksi?.transaksi_item.map((item) => {
            const tambahan = item.transaksi_item_modifier.reduce(
              (jumlahnya, extra) => jumlahnya + extra.tambahan_harga,
              0,
            );

            return (
              <div key={item.id} className="grid gap-0.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium">
                    {item.nama_produk}
                  </span>
                  <span className="text-sm tabular-nums">
                    {formatCurrency((item.harga_satuan + tambahan) * item.qty)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.nama_varian}
                  {item.jumlah_pcs ? ` · ${item.jumlah_pcs} pcs` : ""}
                  {` · ${item.qty}× ${formatCurrency(item.harga_satuan)}`}
                </span>
                {item.transaksi_item_modifier.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {item.transaksi_item_modifier
                      .map(
                        (extra) =>
                          `${extra.nama} +${formatCurrency(extra.tambahan_harga)}`,
                      )
                      .join(", ")}
                  </span>
                )}
              </div>
            );
          })}

          <Separator />

          <div className="grid gap-1">
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">
                {formatCurrency(transaksi?.total ?? 0)}
              </span>
            </div>
            <Baris
              label="Uang diterima"
              nilai={formatCurrency(transaksi?.dibayar ?? 0)}
            />
            <Baris label="Kembalian" nilai={formatCurrency(kembalian)} />
          </div>

          {transaksi?.status === "dibatalkan" && (
            <p className="text-sm text-destructive">
              Transaksi ini sudah dibatalkan.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
