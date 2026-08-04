"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { KatalogItem } from "@/types/cashier";

export function MenuGrid({
  items,
  isPending,
  isError,
  errorMessage,
  onPick,
}: {
  items: KatalogItem[];
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  onPick: (item: KatalogItem) => void;
}) {
  const perKategori = items.reduce<Record<string, KatalogItem[]>>(
    (kumpulan, item) => {
      (kumpulan[item.kategori_nama] ??= []).push(item);

      return kumpulan;
    },
    {},
  );

  const kategori = Object.keys(perKategori);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {kategori.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {isPending
              ? "Memuat…"
              : isError
                ? errorMessage
                : "Belum ada varian aktif yang bisa dijual."}
          </p>
        )}

        {kategori.map((nama) => (
          <div key={nama} className="grid gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {nama}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {perKategori[nama].map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  className="h-auto flex-col items-start gap-1 whitespace-normal py-3 text-left"
                  onClick={() => onPick(item)}
                >
                  <span className="font-medium">{item.produk_nama}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.varian_nama}
                    {item.jumlah_pcs ? ` · ${item.jumlah_pcs} pcs` : ""}
                  </span>
                  <span className="tabular-nums">
                    {formatCurrency(item.harga_jual)}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
