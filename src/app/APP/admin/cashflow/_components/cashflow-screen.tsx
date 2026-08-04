"use client";

import { useState } from "react";
import { subDays } from "date-fns";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { DataTableCard } from "@/components/common/data-table-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { hariIni } from "@/constants/cashflow-constant";
import {
  useCashFlow,
  useDeleteCashFlow,
  useSetorOmzet,
} from "@/hooks/use-cashflow";
import { formatCurrency } from "@/lib/utils";
import type { CashFlow } from "@/types/cashflow";
import { cashFlowColumns } from "./columns";
import {
  CashFlowFormSheet,
  type CashFlowFormTarget,
} from "./cashflow-form-sheet";

function tanggalKe(offsetHari: number) {
  const hasil = subDays(new Date(), offsetHari);
  const bulan = `${hasil.getMonth() + 1}`.padStart(2, "0");
  const tanggal = `${hasil.getDate()}`.padStart(2, "0");

  return `${hasil.getFullYear()}-${bulan}-${tanggal}`;
}

function Tile({ label, nilai }: { label: string; nilai: string }) {
  return (
    <Card>
      <CardContent className="grid gap-1 py-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tabular-nums">{nilai}</span>
      </CardContent>
    </Card>
  );
}

export function CashFlowScreen() {
  const [dari, setDari] = useState(() => tanggalKe(29));
  const [sampai, setSampai] = useState(() => hariIni());

  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<CashFlowFormTarget>({
    mode: "tambah",
  });
  const [hapusTarget, setHapusTarget] = useState<CashFlow | null>(null);

  const { data, isPending, isError, error } = useCashFlow(dari, sampai);
  const { mutate: hapus, isPending: isDeleting } = useDeleteCashFlow({
    onSuccess: () => setHapusTarget(null),
  });
  const { mutate: setor, isPending: isSetoring } = useSetorOmzet();

  const rows = data ?? [];
  const masuk = rows
    .filter((row) => row.type === "income")
    .reduce((jumlahnya, row) => jumlahnya + row.amount, 0);
  const keluar = rows
    .filter((row) => row.type === "expense")
    .reduce((jumlahnya, row) => jumlahnya + row.amount, 0);

  const bukaTambah = () => {
    setFormTarget({ mode: "tambah" });
    setFormOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-2">
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
        </div>

        <div className="flex items-center gap-2">
          {/* Hanya tanggalnya yang dikirim — jumlahnya dihitung database. */}
          <Button
            type="button"
            variant="outline"
            disabled={isSetoring}
            onClick={() => setor(hariIni())}
          >
            {isSetoring && <Spinner data-icon="inline-start" />}
            Setor omzet hari ini
          </Button>
          <Button type="button" onClick={bukaTambah}>
            Catat arus kas
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Pemasukan" nilai={formatCurrency(masuk)} />
        <Tile label="Pengeluaran" nilai={formatCurrency(keluar)} />
        <Tile label="Selisih" nilai={formatCurrency(masuk - keluar)} />
      </div>

      <DataTableCard<CashFlow>
        title="Arus kas"
        columns={cashFlowColumns({
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
              : "Belum ada catatan di rentang ini."
        }
      />

      <CashFlowFormSheet
        target={formTarget}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <ConfirmDeleteDialog
        open={hapusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setHapusTarget(null);
        }}
        title="Hapus catatan?"
        description={
          <>
            Catatan &quot;{hapusTarget?.category}&quot; senilai{" "}
            {formatCurrency(hapusTarget?.amount ?? 0)} akan dihapus.
            {hapusTarget?.source === "pos" &&
              " Baris ini berasal dari setoran POS — bisa dibuat ulang lewat tombol Setor omzet."}
          </>
        }
        onConfirm={() => {
          if (hapusTarget) hapus(hapusTarget.id);
        }}
        isPending={isDeleting}
      />
    </>
  );
}
