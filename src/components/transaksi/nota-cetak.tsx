import {
  NOTA_TOKO,
  NOTA_UKURAN,
  NOTA_UKURAN_SPEK,
  PRINTER_MP58N,
} from "@/constants/nota-constant";
import { hitungKembalian } from "@/lib/count";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RiwayatTransaksi } from "@/types/cashier";

interface NotaCetakProps {
  transaksi: RiwayatTransaksi | null;
}

/** Component Barcode SVG sederhana untuk struk cetak browser */
function NotaBarcode({ value }: { value: string }) {
  const clean = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  const bars: boolean[] = [];

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    for (let b = 0; b < 6; b++) {
      bars.push(((code >> b) & 1) === 1);
    }
  }

  return (
    <div className="mt-3 flex flex-col items-center">
      <svg className="h-9 w-40" viewBox={`0 0 ${bars.length * 3} 30`}>
        {bars.map((isDark, idx) =>
          isDark ? (
            <rect
              key={idx}
              x={idx * 3}
              y="0"
              width="2"
              height="30"
              fill="black"
            />
          ) : null,
        )}
      </svg>
      <span className="mt-0.5 text-[9px] font-mono text-black tracking-widest uppercase">
        *{clean}*
      </span>
    </div>
  );
}

export function NotaCetak({ transaksi }: NotaCetakProps) {
  if (!transaksi) return null;

  const { kembalian } = hitungKembalian({
    total: transaksi.total,
    dibayar: transaksi.dibayar,
  });

  return (
    <div
      id="nota-cetak"
      className="hidden print:block mx-auto w-full text-black text-xs font-mono leading-tight"
      style={{
        maxWidth: NOTA_UKURAN_SPEK[NOTA_UKURAN].lebar,
        padding: NOTA_UKURAN_SPEK[NOTA_UKURAN].padding,
      }}
    >
      {/* Header Toko */}
      <div className="text-center">
        <h1 className="text-sm font-bold uppercase tracking-wide">
          {NOTA_TOKO.nama}
        </h1>
        <p className="text-[10px] text-gray-800">{NOTA_TOKO.alamat}</p>
        <p className="text-[10px] text-gray-800">{NOTA_TOKO.kontak}</p>
      </div>

      {/* Meta Transaksi */}
      <div className="mt-3 flex flex-col gap-0.5 border-y border-dashed border-black py-1 text-[11px]">
        <div className="flex justify-between">
          <span>{formatDateTime(transaksi.created_at)}</span>
          <span>Kasir: {transaksi.kasir_nama}</span>
        </div>
        <div className="text-[10px] text-gray-700 print:text-black">
          ID: #{transaksi.id.slice(0, 8)}
        </div>
      </div>

      {/* Status Batal */}
      {transaksi.status === "dibatalkan" && (
        <div className="my-2 border border-black p-1 text-center font-bold text-xs uppercase">
          *** TRANSAKSI DIBATALKAN ***
        </div>
      )}

      {/* Tabel Item */}
      <table className="mt-2 w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1 font-semibold">Item</th>
            <th className="py-1 text-right font-semibold">Qty</th>
            <th className="py-1 text-right font-semibold">Harga</th>
            <th className="py-1 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 print:divide-black/20">
          {transaksi.transaksi_item.map((item) => {
            const totalModifier = item.transaksi_item_modifier.reduce(
              (total, extra) => total + extra.tambahan_harga,
              0,
            );
            const hargaEfektif = item.harga_satuan + totalModifier;
            const subtotal = hargaEfektif * item.qty;

            return (
              <tr key={item.id} className="align-top">
                <td className="py-1 pr-1">
                  <div className="font-medium">
                    {item.nama_produk}
                    {item.nama_varian ? ` - ${item.nama_varian}` : ""}
                    {item.jumlah_pcs ? ` (${item.jumlah_pcs} pcs)` : ""}
                  </div>

                  {/* List Modifier / Extra */}
                  {item.transaksi_item_modifier.length > 0 && (
                    <div className="mt-0.5 space-y-0.5 text-[10px] text-gray-700 print:text-black">
                      {item.transaksi_item_modifier.map((extra) => (
                        <div key={extra.id} className="pl-2">
                          + {extra.nama}{" "}
                          {extra.tambahan_harga > 0 &&
                            `(${formatCurrency(extra.tambahan_harga)})`}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-1 text-right tabular-nums">{item.qty}</td>
                <td className="py-1 text-right tabular-nums">
                  {formatCurrency(hargaEfektif)}
                </td>
                <td className="py-1 text-right tabular-nums font-medium">
                  {formatCurrency(subtotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Rincian Pembayaran */}
      <div className="mt-2 grid gap-1 border-t border-black pt-2 text-[11px]">
        <div className="flex justify-between text-xs font-bold">
          <span>TOTAL</span>
          <span className="tabular-nums">
            {formatCurrency(transaksi.total)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Bayar</span>
          <span className="tabular-nums">
            {formatCurrency(transaksi.dibayar)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Kembali</span>
          <span className="tabular-nums">{formatCurrency(kembalian)}</span>
        </div>
      </div>

      {/* Footer / Penutup */}
      {NOTA_TOKO.penutup && (
        <p className="mt-4 text-center text-[10px] leading-tight italic">
          {NOTA_TOKO.penutup}
        </p>
      )}

      {/* Barcode untuk Printer Thermal MP-58N */}
      {PRINTER_MP58N.hasBarcode && <NotaBarcode value={transaksi.id} />}
    </div>
  );
}
