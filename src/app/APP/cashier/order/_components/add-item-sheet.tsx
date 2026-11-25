"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { hitungSisaStokVarian } from "@/lib/count";
import { formatCurrency } from "@/lib/utils";
import type { KatalogExtra, KatalogItem } from "@/types/cashier";

export function AddItemSheet({
  item,
  extras,
  terpakaiPerProduk,
  open,
  onOpenChange,
  onAdd,
}: {
  item: KatalogItem | null;
  extras: KatalogExtra[];
  terpakaiPerProduk: Record<string, number>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: KatalogItem, extra: KatalogExtra[]) => void;
}) {
  const [terpilih, setTerpilih] = useState<string[]>([]);

  const ubahTampilan = (tampil: boolean) => {
    if (!tampil) setTerpilih([]);
    onOpenChange(tampil);
  };

  const toggle = (id: string) =>
    setTerpilih((prev) =>
      prev.includes(id) ? prev.filter((lain) => lain !== id) : [...prev, id],
    );

  const extraTerpilih = extras.filter((extra) => terpilih.includes(extra.id));
  const tambahan = extraTerpilih.reduce(
    (jumlahnya, extra) => jumlahnya + extra.tambahan_harga,
    0,
  );
  const statusStok = item
    ? hitungSisaStokVarian({
        lacakStok: item.lacak_stok,
        stokPcs: item.stok_pcs,
        jumlahPcs: item.jumlah_pcs,
        terpakaiPcs: terpakaiPerProduk[item.product_id] ?? 0,
      })
    : null;

  return (
    <Sheet open={open} onOpenChange={ubahTampilan}>
      <SheetContent>
        <div className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>
              {item ? `${item.produk_nama} — ${item.varian_nama}` : "Tambah item"}
            </SheetTitle>
            <SheetDescription>
              Pilih tambahan yang diminta pembeli. Jumlah porsinya diatur di
              keranjang.
            </SheetDescription>
          </SheetHeader>

          <div className="grid flex-1 content-start gap-4 overflow-y-auto px-4 py-6">
            {extras.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada extra yang bisa dipilih.
              </p>
            ) : (
              extras.map((extra) => (
                <div
                  key={extra.id}
                  className="flex items-center justify-between gap-4"
                >
                  <Label
                    htmlFor={`extra-${extra.id}`}
                    className="flex flex-col items-start gap-0.5 font-normal"
                  >
                    <span>{extra.nama}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      +{formatCurrency(extra.tambahan_harga)}
                    </span>
                  </Label>
                  <Switch
                    id={`extra-${extra.id}`}
                    checked={terpilih.includes(extra.id)}
                    onCheckedChange={() => toggle(extra.id)}
                  />
                </div>
              ))
            )}
          </div>

          <SheetFooter>
            {statusStok?.habis && (
              <p className="text-xs text-destructive">
                Stok tidak mencukupi untuk varian ini.
              </p>
            )}
            <Button
              type="button"
              disabled={!item || Boolean(statusStok?.habis)}
              onClick={() => {
                if (item) onAdd(item, extraTerpilih);
                ubahTampilan(false);
              }}
            >
              Masukkan keranjang —{" "}
              {formatCurrency((item?.harga_jual ?? 0) + tambahan)}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
