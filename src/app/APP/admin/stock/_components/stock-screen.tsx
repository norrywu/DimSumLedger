"use client";

import { useState } from "react";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { DataTableCard } from "@/components/common/data-table-card";
import { FilterSelect } from "@/components/common/filter-select";
import { StatTile } from "@/components/common/stat-tile";
import {
  StockFormSheet,
  type StockFormTarget,
} from "@/components/stock/stock-form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hariIni, tanggalKe } from "@/constants/cashflow-constant";
import { useProducts } from "@/hooks/use-products";
import { useDeleteStockHistory, useStockHistory } from "@/hooks/use-stock";
import type { StockHistory } from "@/types/stock";
import { stockHistoryColumns } from "./columns";

function formatPcsDenganTanda(jumlah: number, arah?: "masuk" | "keluar") {
  if (jumlah === 0) return "0 pcs";
  if (arah === "keluar" || jumlah < 0) {
    return `−${Math.abs(jumlah).toLocaleString("id-ID")} pcs`;
  }
  return `+${jumlah.toLocaleString("id-ID")} pcs`;
}

export function StockScreen() {
  const [dari, setDari] = useState(() => tanggalKe(29));
  const [sampai, setSampai] = useState(() => hariIni());
  const [productId, setProductId] = useState<string | undefined>(undefined);

  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<StockFormTarget>({
    mode: "tambah",
  });
  const [hapusTarget, setHapusTarget] = useState<StockHistory | null>(null);

  const { data: products } = useProducts();
  const { data, isPending, isError, error } = useStockHistory(
    dari,
    sampai,
    productId,
  );
  const { mutate: hapus, isPending: isDeleting } = useDeleteStockHistory({
    onSuccess: () => setHapusTarget(null),
  });

  const rows = data ?? [];
  const masuk = rows
    .filter((row) => row.jenis === "masuk")
    .reduce((jumlah, row) => jumlah + row.jumlah_pcs, 0);
  const keluar = rows
    .filter((row) => row.jenis === "keluar")
    .reduce((jumlah, row) => jumlah + row.jumlah_pcs, 0);
  const selisih = masuk - keluar;

  const productOptions = (products ?? []).map((product) => ({
    value: product.id,
    label: product.nama,
  }));

  const bukaTambah = () => {
    setFormTarget({ mode: "tambah", productId });
    setFormOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor="dari">Dari</Label>
            <Input
              id="dari"
              type="date"
              value={dari}
              onChange={(event) => setDari(event.target.value)}
              className="w-40"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sampai">Sampai</Label>
            <Input
              id="sampai"
              type="date"
              value={sampai}
              onChange={(event) => setSampai(event.target.value)}
              className="w-40"
            />
          </div>
          <div className="grid gap-1.5">
            <span className="text-sm font-medium leading-none">Produk</span>
            <FilterSelect
              value={productId}
              onChange={setProductId}
              options={productOptions}
              allLabel="Semua produk"
              ariaLabel="Filter produk"
              className="w-48"
            />
          </div>
        </div>

        <Button type="button" onClick={bukaTambah}>
          Catat stok
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Stok masuk" nilai={formatPcsDenganTanda(masuk, "masuk")} />
        <StatTile
          label="Stok keluar"
          nilai={formatPcsDenganTanda(keluar, "keluar")}
        />
        <StatTile label="Selisih" nilai={formatPcsDenganTanda(selisih)} />
      </div>

      <DataTableCard<StockHistory>
        title="Riwayat input stok"
        columns={stockHistoryColumns({
          onRequestEdit: (baris) => {
            setFormTarget({ mode: "ubah", baris });
            setFormOpen(true);
          },
          onRequestDelete: setHapusTarget,
          isBusy: isDeleting,
        })}
        data={rows}
        rowKey={(row) => row.id}
        emptyMessage={
          isPending
            ? "Memuat…"
            : isError
              ? error.message
              : "Belum ada catatan stok di rentang ini."
        }
      />

      <StockFormSheet
        target={formTarget}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <ConfirmDeleteDialog
        open={hapusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setHapusTarget(null);
        }}
        title="Hapus catatan stok?"
        description={
          hapusTarget ? (
            <>
              Catatan {hapusTarget.jenis === "masuk" ? "penambahan" : "pengurangan"}{" "}
              {hapusTarget.jumlah_pcs.toLocaleString("id-ID")} pcs untuk &quot;
              {hapusTarget.nama_produk}&quot; akan dihapus.
              {hapusTarget.produk_terhapus
                ? " Produk sudah dihapus sebelumnya, jadi saldo stok tidak berubah."
                : hapusTarget.jenis === "masuk"
                  ? " Saldo stok produk akan dikurangi kembali."
                  : " Saldo stok produk akan dikembalikan."}
            </>
          ) : null
        }
        onConfirm={() => {
          if (hapusTarget) hapus(hapusTarget.id);
        }}
        isPending={isDeleting}
      />
    </>
  );
}
