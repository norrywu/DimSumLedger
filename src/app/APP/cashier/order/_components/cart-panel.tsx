"use client";

import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { IconActionButton } from "@/components/common/icon-action-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { hitungKembalian, keAngka } from "@/lib/count";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types/cashier";

export function CartPanel({
  items,
  onUbahQty,
  onHapus,
  onKosongkan,
  onSimpan,
  isPending,
  total,
  dibayar,
  onUbahDibayar,
}: {
  items: CartItem[];
  onUbahQty: (key: string, selisih: number) => void;
  onHapus: (key: string) => void;
  onKosongkan: () => void;
  onSimpan: () => void;
  isPending: boolean;
  total: number;
  dibayar: number;
  onUbahDibayar: (nilai: number) => void;
}) {
  const kosong = items.length === 0;
  const { kembalian, kurang, cukup } = hitungKembalian({ total, dibayar });

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Keranjang</CardTitle>
        {!kosong && (
          <Button type="button" variant="ghost" size="sm" onClick={onKosongkan}>
            Kosongkan
          </Button>
        )}
      </CardHeader>

      <CardContent className="grid gap-4">
        {kosong ? (
          <p className="text-sm text-muted-foreground">
            Belum ada item. Pilih menu di sebelah kiri.
          </p>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => {
              const tambahan = item.extra.reduce(
                (jumlahnya, extra) => jumlahnya + extra.tambahan_harga,
                0,
              );

              return (
                <div key={item.key} className="grid gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid gap-0.5">
                      <span className="text-sm font-medium">
                        {item.produk_nama}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.varian_nama}
                        {item.jumlah_pcs ? ` · ${item.jumlah_pcs} pcs` : ""}
                      </span>
                      {item.extra.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {item.extra.map((extra) => extra.nama).join(", ")}
                        </span>
                      )}
                    </div>
                    <span className="text-sm tabular-nums">
                      {formatCurrency((item.harga_satuan + tambahan) * item.qty)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <IconActionButton
                      label={`Kurangi ${item.varian_nama}`}
                      icon={<MinusIcon />}
                      onClick={() => onUbahQty(item.key, -1)}
                    />
                    <span className="w-8 text-center text-sm tabular-nums">
                      {item.qty}
                    </span>
                    <IconActionButton
                      label={`Tambah ${item.varian_nama}`}
                      icon={<PlusIcon />}
                      onClick={() => onUbahQty(item.key, 1)}
                    />
                    <IconActionButton
                      label={`Hapus ${item.varian_nama}`}
                      icon={<Trash2Icon />}
                      onClick={() => onHapus(item.key)}
                      className="ml-auto text-destructive hover:text-destructive"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Separator />

        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dibayar">Uang diterima</Label>
          <Input
            id="dibayar"
            inputMode="numeric"
            placeholder="0"
            className="tabular-nums"
            disabled={kosong}
            value={dibayar === 0 ? "" : String(dibayar)}
            onChange={(event) =>
              onUbahDibayar(keAngka(event.target.value.replace(/\D/g, "")))
            }
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className={cukup ? "text-muted-foreground" : "text-destructive"}>
            {cukup ? "Kembalian" : "Kurang"}
          </span>
          <span
            className={`font-medium tabular-nums ${cukup ? "" : "text-destructive"}`}
          >
            {formatCurrency(cukup ? kembalian : kurang)}
          </span>
        </div>

        <Button
          type="button"
          size="lg"
          disabled={kosong || isPending || !cukup}
          onClick={onSimpan}
        >
          {isPending && <Spinner data-icon="inline-start" />}
          Simpan Transaksi
        </Button>
      </CardContent>
    </Card>
  );
}
