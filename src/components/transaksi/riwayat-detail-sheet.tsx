"use client";

import { useState } from "react";
import {
  BluetoothIcon,
  ChevronDownIcon,
  PrinterIcon,
  UsbIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { PRINTER_MP58N } from "@/constants/nota-constant";
import { hitungKembalian } from "@/lib/count";
import {
  printThermalBluetooth,
  printThermalUSB,
} from "@/lib/thermal-printer";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RiwayatTransaksi } from "@/types/cashier";
import { NotaCetak } from "./nota-cetak";

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{nilai}</span>
    </div>
  );
}

export function RiwayatDetailSheet({
  transaksi,
  open,
  onOpenChange,
  judul = "Detail transaksi",
}: {
  transaksi: RiwayatTransaksi | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judul?: string;
}) {
  const [isPrinting, setIsPrinting] = useState(false);

  const { kembalian } = hitungKembalian({
    total: transaksi?.total ?? 0,
    dibayar: transaksi?.dibayar ?? 0,
  });

  const handlePrintBluetooth = async () => {
    if (!transaksi) return;
    setIsPrinting(true);
    toast.info(`Mencari printer Bluetooth (${PRINTER_MP58N.bluetoothName})...`);
    try {
      const res = await printThermalBluetooth(transaksi);
      toast.success(res.message);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mencetak via Bluetooth.";
      toast.error(msg);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintUSB = async () => {
    if (!transaksi) return;
    setIsPrinting(true);
    toast.info(`Menghubungkan printer USB (${PRINTER_MP58N.model})...`);
    try {
      const res = await printThermalUSB(transaksi);
      toast.success(res.message);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mencetak via USB Serial.";
      toast.error(msg);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{judul}</SheetTitle>
            <SheetDescription>
              {transaksi
                ? `${formatDateTime(transaksi.created_at)} · ${transaksi.kasir_nama}`
                : ""}
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

            {/* Info Printer Thermal MP-58N */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Printer Thermal: {PRINTER_MP58N.model}</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary">
                  {PRINTER_MP58N.paperWidth} · {PRINTER_MP58N.cmdType}
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <div>
                  Bluetooth:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {PRINTER_MP58N.bluetoothName}
                  </span>
                </div>
                <div>
                  PIN:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {PRINTER_MP58N.bluetoothPin}
                  </span>
                </div>
                <div>
                  Language:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {PRINTER_MP58N.language}
                  </span>
                </div>
                <div>
                  Baudrate:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {PRINTER_MP58N.baudrate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row gap-2 sm:justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" disabled={isPrinting} className="flex-1">
                  {isPrinting ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <PrinterIcon data-icon="inline-start" />
                  )}
                  Cetak Thermal MP-58N
                  <ChevronDownIcon className="ml-auto size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Pilih Koneksi Printer</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handlePrintBluetooth}
                  disabled={isPrinting}
                >
                  <BluetoothIcon className="mr-2 size-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Bluetooth ({PRINTER_MP58N.bluetoothName})</span>
                    <span className="text-[10px] text-muted-foreground">
                      PIN {PRINTER_MP58N.bluetoothPin} · ESC/POS Direct
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handlePrintUSB}
                  disabled={isPrinting}
                >
                  <UsbIcon className="mr-2 size-4 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">USB Serial (115200)</span>
                    <span className="text-[10px] text-muted-foreground">
                      Kabel USB Direct · Baud {PRINTER_MP58N.baudrate}
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handlePrintBrowser}>
                  <PrinterIcon className="mr-2 size-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">Cetak Browser (58mm)</span>
                    <span className="text-[10px] text-muted-foreground">
                      Dialog Cetak bawaan (window.print)
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Di luar Sheet, bukan di dalamnya */}
      <NotaCetak transaksi={transaksi} />
    </>
  );
}
