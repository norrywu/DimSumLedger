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

const CODE39_PATTERNS: Record<string, string> = {
  "0": "101001101101",
  "1": "110100101011",
  "2": "101100101011",
  "3": "110110010101",
  "4": "101001101011",
  "5": "110100110101",
  "6": "101100110101",
  "7": "101001011011",
  "8": "110100101101",
  "9": "101100101101",
  A: "110101001011",
  B: "101101001011",
  C: "110110100101",
  D: "101011001011",
  E: "110101100101",
  F: "101101100101",
  G: "101010011011",
  H: "110101001101",
  I: "101101001101",
  J: "101011001101",
  K: "110101010011",
  L: "101101010011",
  M: "110110101001",
  N: "101011010011",
  O: "110101101001",
  P: "101101101001",
  Q: "101010110011",
  R: "110101011001",
  S: "101101011001",
  T: "101011011001",
  U: "110010101011",
  V: "100110101011",
  W: "110011010101",
  X: "100101101011",
  Y: "110010110101",
  Z: "100110110101",
  "-": "100101011011",
  ".": "110010101101",
  " ": "100110101101",
  "*": "100101101101",
};

/** Component Barcode Code39 SVG standar untuk struk cetak browser */
function NotaBarcode({ value }: { value: string }) {
  const clean = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase();
  if (!clean) return null;

  const fullCode = `*${clean}*`;
  let bitPattern = "";
  for (const char of fullCode) {
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS["*"];
    bitPattern += pattern + "0";
  }

  return (
    <div className="mt-4 flex flex-col items-center justify-center">
      <svg
        className="h-8 w-44"
        viewBox={`0 0 ${bitPattern.length * 2} 30`}
        preserveAspectRatio="none"
      >
        {bitPattern.split("").map((bit, idx) =>
          bit === "1" ? (
            <rect
              key={idx}
              x={idx * 2}
              y="0"
              width="2"
              height="30"
              fill="black"
            />
          ) : null,
        )}
      </svg>
      <span className="mt-1 text-[9px] font-mono text-black tracking-widest">
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
