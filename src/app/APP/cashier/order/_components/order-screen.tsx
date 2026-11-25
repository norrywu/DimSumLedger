"use client";

import { useState } from "react";

import { RiwayatDetailSheet } from "@/components/transaksi/riwayat-detail-sheet";
import { useKatalogExtra, useKatalogJual } from "@/hooks/use-katalog";
import { useSimpanTransaksi, useTransaksi } from "@/hooks/use-transaksi";
import {
  hitungKeranjang,
  hitungSisaStokVarian,
  hitungStokTerpakaiPerProduk,
} from "@/lib/count";
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
  const [notaId, setNotaId] = useState<string | null>(null);
  const [pilihan, setPilihan] = useState<KatalogItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: katalog, isPending, isError, error } = useKatalogJual();
  const { data: extras } = useKatalogExtra();

  const stokPerProduk = new Map(
    (katalog ?? []).map((item) => [
      item.product_id,
      { lacak_stok: item.lacak_stok, stok_pcs: item.stok_pcs },
    ]),
  );

  const sinkronStokCart = (barisCart: CartItem[]) =>
    barisCart.map((baris) => {
      const terbaru = stokPerProduk.get(baris.product_id);
      return terbaru ? { ...baris, ...terbaru } : baris;
    });

  const cartItemsTerbaru = sinkronStokCart(cart);
  const terpakaiPerProduk = hitungStokTerpakaiPerProduk(cartItemsTerbaru);

  const bukaPilihan = (item: KatalogItem) => {
    setPilihan(item);
    setSheetOpen(true);
  };

  const tambah = (item: KatalogItem, extra: KatalogExtra[]) => {
    const key = cartKey(item.id, extra);

    setCart((sebelumnya) => {
      const terpakai = hitungStokTerpakaiPerProduk(sinkronStokCart(sebelumnya));
      const terbaru = stokPerProduk.get(item.product_id);
      const statusStok = hitungSisaStokVarian({
        lacakStok: terbaru?.lacak_stok ?? item.lacak_stok,
        stokPcs: terbaru?.stok_pcs ?? item.stok_pcs,
        jumlahPcs: item.jumlah_pcs,
        terpakaiPcs: terpakai[item.product_id] ?? 0,
      });

      if (statusStok.habis) return sebelumnya;

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
          product_id: item.product_id,
          produk_nama: item.produk_nama,
          varian_nama: item.varian_nama,
          jumlah_pcs: item.jumlah_pcs,
          harga_satuan: item.harga_jual,
          lacak_stok: terbaru?.lacak_stok ?? item.lacak_stok,
          stok_pcs: terbaru?.stok_pcs ?? item.stok_pcs,
          qty: 1,
          extra,
        },
      ];
    });
  };

  const ubahQty = (key: string, selisih: number) =>
    setCart((sebelumnya) => {
      if (selisih > 0) {
        const target = sebelumnya.find((baris) => baris.key === key);
        if (!target) return sebelumnya;

        const terpakai = hitungStokTerpakaiPerProduk(sinkronStokCart(sebelumnya));
        const terbaru = stokPerProduk.get(target.product_id);
        const statusStok = hitungSisaStokVarian({
          lacakStok: terbaru?.lacak_stok ?? target.lacak_stok,
          stokPcs: terbaru?.stok_pcs ?? target.stok_pcs,
          jumlahPcs:
            target.jumlah_pcs !== null ? target.jumlah_pcs * selisih : null,
          terpakaiPcs: terpakai[target.product_id] ?? 0,
        });

        if (statusStok.habis) return sebelumnya;
      }

      return sebelumnya
        .map((baris) =>
          baris.key === key ? { ...baris, qty: baris.qty + selisih } : baris,
        )
        .filter((baris) => baris.qty > 0);
    });

  const hapus = (key: string) =>
    setCart((sebelumnya) => sebelumnya.filter((baris) => baris.key !== key));

  const kosongkan = () => {
    setCart([]);
    setDibayar(0);
  };

  // Keranjang dikosongkan agar kasir bisa langsung melayani antrean
  // berikutnya; notanya menyusul di panel terpisah, tidak menahan alur.
  const { mutate: simpan, isPending: isSaving } = useSimpanTransaksi({
    onSuccess: (id) => {
      kosongkan();
      setNotaId(id);
    },
  });

  const { data: nota } = useTransaksi(notaId);

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
    items: cartItemsTerbaru.map((baris) => ({
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
          terpakaiPerProduk={terpakaiPerProduk}
          isPending={isPending}
          isError={isError}
          errorMessage={error?.message}
          onPick={bukaPilihan}
        />

        <CartPanel
          items={cartItemsTerbaru}
          terpakaiPerProduk={terpakaiPerProduk}
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
        terpakaiPerProduk={terpakaiPerProduk}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdd={tambah}
      />

      <RiwayatDetailSheet
        transaksi={nota ?? null}
        open={notaId !== null}
        onOpenChange={(open) => {
          if (!open) setNotaId(null);
        }}
        judul="Transaksi tersimpan"
      />
    </>
  );
}
