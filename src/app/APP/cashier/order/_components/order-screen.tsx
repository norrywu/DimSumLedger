"use client";

import { useState } from "react";

import { useKatalogExtra, useKatalogJual } from "@/hooks/use-katalog";
import { useSimpanTransaksi } from "@/hooks/use-transaksi";
import { hitungKeranjang } from "@/lib/count";
import type { CartItem, KatalogExtra, KatalogItem } from "@/types/cashier";
import { AddItemSheet } from "./add-item-sheet";
import { CartPanel } from "./cart-panel";
import { MenuGrid } from "./menu-grid";

function cartKey(variantId: string, extra: KatalogExtra[]) {
  return [variantId, ...extra.map((baris) => baris.id).sort()].join("|");
}

export function OrderScreen() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dibayar, setDibayar] = useState(0);
  const [pilihan, setPilihan] = useState<KatalogItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: katalog, isPending, isError, error } = useKatalogJual();
  const { data: extras } = useKatalogExtra();

  const bukaPilihan = (item: KatalogItem) => {
    setPilihan(item);
    setSheetOpen(true);
  };

  const tambah = (item: KatalogItem, extra: KatalogExtra[]) => {
    const key = cartKey(item.id, extra);

    setCart((sebelumnya) => {
      const sudahAda = sebelumnya.find((baris) => baris.key === key);

      if (sudahAda) {
        return sebelumnya.map((baris) =>
          baris.key === key ? { ...baris, qty: baris.qty + 1 } : baris,
        );
      }

      return [
        ...sebelumnya,
        {
          key,
          variant_id: item.id,
          produk_nama: item.produk_nama,
          varian_nama: item.varian_nama,
          jumlah_pcs: item.jumlah_pcs,
          harga_satuan: item.harga_jual,
          qty: 1,
          extra,
        },
      ];
    });
  };

  const ubahQty = (key: string, selisih: number) =>
    setCart((sebelumnya) =>
      sebelumnya
        .map((baris) =>
          baris.key === key ? { ...baris, qty: baris.qty + selisih } : baris,
        )
        .filter((baris) => baris.qty > 0),
    );

  const hapus = (key: string) =>
    setCart((sebelumnya) => sebelumnya.filter((baris) => baris.key !== key));

  const kosongkan = () => {
    setCart([]);
    setDibayar(0);
  };

  const { mutate: simpan, isPending: isSaving } = useSimpanTransaksi({
    onSuccess: kosongkan,
  });

  const kirim = () =>
    simpan({
      items: cart.map((baris) => ({
        variant_id: baris.variant_id,
        qty: baris.qty,
        extra: baris.extra.map((extra) => extra.id),
      })),
      dibayar,
    });

  const { total } = hitungKeranjang({
    items: cart.map((baris) => ({
      hargaSatuan: baris.harga_satuan,
      qty: baris.qty,
      extra: baris.extra.map((extra) => ({
        tambahanHarga: extra.tambahan_harga,
      })),
    })),
  });

  return (
    <>
      <div className="grid flex-1 items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <MenuGrid
          items={katalog ?? []}
          isPending={isPending}
          isError={isError}
          errorMessage={error?.message}
          onPick={bukaPilihan}
        />

        <CartPanel
          items={cart}
          onUbahQty={ubahQty}
          onHapus={hapus}
          onKosongkan={kosongkan}
          onSimpan={kirim}
          isPending={isSaving}
          total={total}
          dibayar={dibayar}
          onUbahDibayar={setDibayar}
        />
      </div>

      <AddItemSheet
        item={pilihan}
        extras={extras ?? []}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdd={tambah}
      />
    </>
  );
}
