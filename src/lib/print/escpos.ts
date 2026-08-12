import { NOTA_TOKO, PRINTER_MP58N } from "@/constants/nota-constant";
import { hitungKembalian } from "@/lib/count";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RiwayatTransaksi } from "@/types/cashier.d.ts";

const defaultMaxColumns = PRINTER_MP58N.maxColumns; // 32 kolom untuk kertas 58mm

function padBetween(
  left: string,
  right: string,
  width = defaultMaxColumns,
): string {
  const space = width - left.length - right.length;
  if (space < 1) {
    const maxLeft = Math.max(1, width - right.length - 1);
    return left.slice(0, maxLeft) + " " + right;
  }
  return left + " ".repeat(space) + right;
}

interface GenerateEscPosBytesConfig {
  toko?: typeof NOTA_TOKO;
  maxColumns?: number;
  formatCurrency?: (n: number) => string;
  formatDateTime?: (d: string | Date) => string;
  hitungKembalian?: (
    args: { total: number; dibayar: number },
  ) => { kembalian: number };
}

export function generateEscPosBytes(
  transaksi: RiwayatTransaksi,
  config?: GenerateEscPosBytesConfig,
): Uint8Array {
  const encoder = new TextEncoder();
  const buffer: number[] = [];

  const pushBytes = (...bytes: number[]) => {
    buffer.push(...bytes);
  };

  const pushText = (str: string) => {
    const encoded = encoder.encode(str);
    for (let i = 0; i < encoded.length; i++) {
      buffer.push(encoded[i]);
    }
  };

  const pushLine = (str = "") => {
    pushText(str + "\n");
  };
  // console.log("buffer", buffer);
  const toko = config?.toko ?? NOTA_TOKO;
  const maxColumns = config?.maxColumns ?? defaultMaxColumns;
  const fmtCurrency = config?.formatCurrency ?? formatCurrency;
  const fmtDateTime = config?.formatDateTime ?? formatDateTime;
  const hitungKembalianFn = config?.hitungKembalian ?? hitungKembalian;

  // 1. Inisialisasi printer & pilih Code Page PC850 (ESC t 2)
  pushBytes(0x1b, 0x40); // ESC @ (Reset)
  pushBytes(0x1b, 0x74, 0x02); // ESC t 2 (PC850 Multilingual)

  // 2. Header Toko (Tengah, Tebal, Ukuran Ganda untuk Nama)
  pushBytes(0x1b, 0x61, 0x01); // ESC a 1 (Align Center)
  pushBytes(0x1b, 0x45, 0x01); // ESC E 1 (Bold ON)
  pushBytes(0x1d, 0x21, 0x11); // GS ! 0x11 (Double Width & Height)
  pushLine(toko.nama);

  pushBytes(0x1d, 0x21, 0x00); // GS ! 0x00 (Normal Size)
  pushBytes(0x1b, 0x45, 0x00); // ESC E 0 (Bold OFF)
  pushLine(toko.alamat);
  pushLine(toko.kontak);
  pushLine("-".repeat(maxColumns));

  // 3. Meta Transaksi (Rata Kiri)
  pushBytes(0x1b, 0x61, 0x00); // ESC a 0 (Align Left)
  pushLine(fmtDateTime(transaksi.created_at));
  pushLine(`Kasir: ${transaksi.kasir_nama}`);
  pushLine(`ID: #${transaksi.id.slice(0, 8)}`);

  if (transaksi.status === "dibatalkan") {
    pushBytes(0x1b, 0x61, 0x01); // Center
    pushBytes(0x1b, 0x45, 0x01);
    pushLine("*** TRANSAKSI DIBATALKAN ***");
    pushBytes(0x1b, 0x45, 0x00);
    pushBytes(0x1b, 0x61, 0x00); // Left
  }

  pushLine("-".repeat(maxColumns));

  // 4. Daftar Item
  for (const item of transaksi.transaksi_item) {
    const totalModifier = item.transaksi_item_modifier.reduce(
      (acc, extra) => acc + extra.tambahan_harga,
      0,
    );
    const hargaEfektif = item.harga_satuan + totalModifier;
    const subtotal = hargaEfektif * item.qty;

    // Baris Nama Produk
    const namaLengkap = `${item.nama_produk}${item.nama_varian ? " - " + item.nama_varian : ""}${item.jumlah_pcs ? ` (${item.jumlah_pcs}pcs)` : ""}`;
    pushLine(namaLengkap);

    // Baris Qty x Harga = Subtotal
    const rincianQty = `  ${item.qty} x ${fmtCurrency(hargaEfektif)}`;
    const stringSubtotal = fmtCurrency(subtotal);
    pushLine(padBetween(rincianQty, stringSubtotal));

    // List Extra / Modifier
    for (const extra of item.transaksi_item_modifier) {
      const extraHarga =
        extra.tambahan_harga > 0
          ? ` (+${fmtCurrency(extra.tambahan_harga)})`
          : "";
      pushLine(`  + ${extra.nama}${extraHarga}`);
    }
  }

  pushLine("-".repeat(maxColumns));

  // 5. Total & Pembayaran
  const { kembalian } = hitungKembalianFn({
    total: transaksi.total,
    dibayar: transaksi.dibayar,
  });

  pushBytes(0x1b, 0x45, 0x01); // Bold Total
  pushLine(padBetween("TOTAL", fmtCurrency(transaksi.total)));
  pushBytes(0x1b, 0x45, 0x00); // Bold OFF

  pushLine(padBetween("Bayar", fmtCurrency(transaksi.dibayar)));
  pushLine(padBetween("Kembali", fmtCurrency(kembalian)));

  pushLine("-".repeat(maxColumns));

  // 6. Footer Penutup
  if (toko.penutup) {
    pushBytes(0x1b, 0x61, 0x01); // Center
    pushLine(toko.penutup);
    pushLine();
  }

  // 9. Feed kertas (Tear bar / Pemotong manual MP-58N)
  pushBytes(0x1b, 0x64, 0x04); // Feed 4 lines

  return new Uint8Array(buffer);
}
