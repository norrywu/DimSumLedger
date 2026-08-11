import { NOTA_TOKO, PRINTER_MP58N } from "@/constants/nota-constant";
import { hitungKembalian } from "@/lib/count";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { RiwayatTransaksi } from "@/types/cashier.d.ts";

const MAX_COLS = PRINTER_MP58N.maxColumns; // 32 kolom untuk kertas 58mm

interface BluetoothCharacteristic {
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValueWithoutResponse?: (value: Uint8Array) => Promise<void>;
  writeValue?: (value: Uint8Array) => Promise<void>;
}

interface BluetoothService {
  getCharacteristics: () => Promise<BluetoothCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
  getPrimaryServices: () => Promise<BluetoothService[]>;
}

interface BluetoothDeviceGatt {
  connect: () => Promise<BluetoothRemoteGATTServer>;
  connected: boolean;
  disconnect: () => void;
}

interface BluetoothDevice {
  name?: string;
  gatt?: BluetoothDeviceGatt;
}

interface WebBluetoothAPI {
  requestDevice: (options: unknown) => Promise<BluetoothDevice>;
}

interface SerialPortWriter {
  write: (data: Uint8Array) => Promise<void>;
  releaseLock: () => void;
}

interface SerialPortWritable {
  getWriter: () => SerialPortWriter;
}

interface SerialPort {
  open: (options: { baudRate: number }) => Promise<void>;
  writable: SerialPortWritable;
  close: () => Promise<void>;
}

interface WebSerialAPI {
  requestPort: () => Promise<SerialPort>;
}

function padBetween(left: string, right: string, width = MAX_COLS): string {
  const space = width - left.length - right.length;
  if (space < 1) {
    const maxLeft = Math.max(1, width - right.length - 1);
    return left.slice(0, maxLeft) + " " + right;
  }
  return left + " ".repeat(space) + right;
}

/**
 * Merakit buffer biner ESC/POS khusus printer thermal MP-58N (58mm, PC850, Baud 115200).
 */
export function generateEscPosBytes(transaksi: RiwayatTransaksi): Uint8Array {
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

  // 1. Inisialisasi printer & pilih Code Page PC850 (ESC t 2)
  pushBytes(0x1b, 0x40); // ESC @ (Reset)
  pushBytes(0x1b, 0x74, 0x02); // ESC t 2 (PC850 Multilingual)

  // 2. Header Toko (Tengah, Tebal, Ukuran Ganda untuk Nama)
  pushBytes(0x1b, 0x61, 0x01); // ESC a 1 (Align Center)
  pushBytes(0x1b, 0x45, 0x01); // ESC E 1 (Bold ON)
  pushBytes(0x1d, 0x21, 0x11); // GS ! 0x11 (Double Width & Height)
  pushLine(NOTA_TOKO.nama);

  pushBytes(0x1d, 0x21, 0x00); // GS ! 0x00 (Normal Size)
  pushBytes(0x1b, 0x45, 0x00); // ESC E 0 (Bold OFF)
  pushLine(NOTA_TOKO.alamat);
  pushLine(NOTA_TOKO.kontak);
  pushLine("-".repeat(MAX_COLS));

  // 3. Meta Transaksi (Rata Kiri)
  pushBytes(0x1b, 0x61, 0x00); // ESC a 0 (Align Left)
  pushLine(formatDateTime(transaksi.created_at));
  pushLine(`Kasir: ${transaksi.kasir_nama}`);
  pushLine(`ID: #${transaksi.id.slice(0, 8)}`);

  if (transaksi.status === "dibatalkan") {
    pushBytes(0x1b, 0x61, 0x01); // Center
    pushBytes(0x1b, 0x45, 0x01);
    pushLine("*** TRANSAKSI DIBATALKAN ***");
    pushBytes(0x1b, 0x45, 0x00);
    pushBytes(0x1b, 0x61, 0x00); // Left
  }

  pushLine("-".repeat(MAX_COLS));

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
    const rincianQty = `  ${item.qty} x ${formatCurrency(hargaEfektif)}`;
    const stringSubtotal = formatCurrency(subtotal);
    pushLine(padBetween(rincianQty, stringSubtotal));

    // List Extra / Modifier
    for (const extra of item.transaksi_item_modifier) {
      const extraHarga =
        extra.tambahan_harga > 0
          ? ` (+${formatCurrency(extra.tambahan_harga)})`
          : "";
      pushLine(`  + ${extra.nama}${extraHarga}`);
    }
  }

  pushLine("-".repeat(MAX_COLS));

  // 5. Total & Pembayaran
  const { kembalian } = hitungKembalian({
    total: transaksi.total,
    dibayar: transaksi.dibayar,
  });

  pushBytes(0x1b, 0x45, 0x01); // Bold Total
  pushLine(padBetween("TOTAL", formatCurrency(transaksi.total)));
  pushBytes(0x1b, 0x45, 0x00); // Bold OFF

  pushLine(padBetween("Bayar", formatCurrency(transaksi.dibayar)));
  pushLine(padBetween("Kembali", formatCurrency(kembalian)));

  pushLine("-".repeat(MAX_COLS));

  // 6. Footer Penutup
  if (NOTA_TOKO.penutup) {
    pushBytes(0x1b, 0x61, 0x01); // Center
    pushLine(NOTA_TOKO.penutup);
    pushLine();
  }

  // 7. QR Code ESC/POS (GS ( k) untuk ID Transaksi
  if (PRINTER_MP58N.hasQr) {
    const qrData = encoder.encode(transaksi.id);
    const len = qrData.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    pushBytes(0x1b, 0x61, 0x01); // Align Center
    // Model 2
    pushBytes(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // Size 4
    pushBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x42, 0x04);
    // EC Level L
    pushBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30);
    // Store data
    pushBytes(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < qrData.length; i++) {
      buffer.push(qrData[i]);
    }
    // Print QR
    pushBytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    pushLine();
  }

  // 8. Barcode CODE128 ESC/POS (GS k) untuk Kode Pendek Transaksi
  if (PRINTER_MP58N.hasBarcode) {
    const cleanId = transaksi.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const bcData = encoder.encode(cleanId);
    if (bcData.length > 0) {
      pushBytes(0x1b, 0x61, 0x01); // Align Center
      pushBytes(0x1d, 0x68, 40); // Height 40 dots
      pushBytes(0x1d, 0x77, 2); // Width 2
      pushBytes(0x1d, 0x48, 2); // HRI Below
      pushBytes(0x1d, 0x6b, 73, bcData.length + 2, 0x7b, 0x42);
      for (let i = 0; i < bcData.length; i++) {
        buffer.push(bcData[i]);
      }
      pushLine();
    }
  }

  // 9. Feed kertas (Tear bar / Pemotong manual MP-58N)
  pushBytes(0x1b, 0x64, 0x04); // Feed 4 lines

  return new Uint8Array(buffer);
}

/** Cek dukungan Web Bluetooth di browser saat ini */
export function isBluetoothSupported(): boolean {
  return typeof window !== "undefined" && "bluetooth" in navigator;
}

/** Cek dukungan Web Serial (USB) di browser saat ini */
export function isWebSerialSupported(): boolean {
  return typeof window !== "undefined" && "serial" in navigator;
}

/**
 * Mencetak nota secara langsung ke Bluetooth Printer (MP-58N / RPP02N)
 * menggunakan Web Bluetooth API.
 */
export async function printThermalBluetooth(
  transaksi: RiwayatTransaksi,
): Promise<{ success: boolean; message: string }> {
  if (!isBluetoothSupported()) {
    throw new Error(
      "Web Bluetooth tidak didukung browser ini. Gunakan Chrome/Edge di Android/Windows atau gunakan 'Cetak Browser'.",
    );
  }

  const navBT = (navigator as unknown as { bluetooth: WebBluetoothAPI })
    .bluetooth;

  try {
    // 1. Minta user memilih perangkat Bluetooth RPP02N / MP-58N
    const device = await navBT.requestDevice({
      filters: [
        { namePrefix: PRINTER_MP58N.bluetoothName },
        { namePrefix: "MP-58" },
        { namePrefix: "RPP" },
        { namePrefix: "Printer" },
        { namePrefix: "POS" },
      ],
      optionalServices: [
        "00001101-0000-1000-8000-00805f9b34fb", // SPP UUID standar
        "000018f0-0000-1000-8000-00805f9b34fb", // Printer GATT Service
        "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Transparent Serial Service
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
      ],
      acceptAllDevices: false,
    });

    if (!device || !device.gatt) {
      throw new Error("Perangkat Bluetooth tidak merespons.");
    }

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();

    let writableChar: BluetoothCharacteristic | null = null;

    // Cari karakteristik Bluetooth yang mendukung Penulisan Data Biner (Write / WriteWithoutResponse)
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (
            char.properties.write ||
            char.properties.writeWithoutResponse
          ) {
            writableChar = char;
            break;
          }
        }
      } catch {
        // Abaikan jika service tidak mengizinkan akses karakteristik
      }
      if (writableChar) break;
    }

    if (!writableChar) {
      throw new Error(
        "Karakteristik penulisan data printer tidak ditemukan di RPP02N.",
      );
    }

    // 2. Format ESC/POS bytes
    const escData = generateEscPosBytes(transaksi);

    // 3. Kirim data secara bertahap (chunked 100 bytes) agar buffer printer tidak overflow
    const CHUNK_SIZE = 100;
    for (let i = 0; i < escData.length; i += CHUNK_SIZE) {
      const chunk = escData.subarray(i, i + CHUNK_SIZE);
      if (writableChar.writeValueWithoutResponse) {
        await writableChar.writeValueWithoutResponse(chunk);
      } else if (writableChar.writeValue) {
        await writableChar.writeValue(chunk);
      }
      // Beri jeda 20ms antarpaket
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    if (device.gatt.connected) {
      device.gatt.disconnect();
    }

    return {
      success: true,
      message: `Nota berhasil terkirim ke Bluetooth ${device.name || PRINTER_MP58N.bluetoothName}.`,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Gagal mencetak via Bluetooth.";
    if (errorMsg.includes("User cancelled") || errorMsg.includes("cancelled")) {
      throw new Error("Pemilihan printer Bluetooth dibatalkan.");
    }
    throw new Error(errorMsg);
  }
}

/**
 * Mencetak nota secara langsung ke USB Serial Printer (MP-58N) pada Baudrate 115200
 * menggunakan Web Serial API.
 */
export async function printThermalUSB(
  transaksi: RiwayatTransaksi,
): Promise<{ success: boolean; message: string }> {
  if (!isWebSerialSupported()) {
    throw new Error(
      "Web Serial (USB) tidak didukung di browser ini. Gunakan Google Edge/Chrome di PC Windows/Linux atau 'Cetak Browser'.",
    );
  }

  const navSerial = (navigator as unknown as { serial: WebSerialAPI }).serial;

  try {
    // 1. Minta user memilih Port USB Serial MP-58N
    const port = await navSerial.requestPort();
    await port.open({ baudRate: PRINTER_MP58N.baudrate }); // 115200 baud sesuai spesifikasi MP-58N

    const escData = generateEscPosBytes(transaksi);
    const writer = port.writable.getWriter();

    await writer.write(escData);
    writer.releaseLock();
    await port.close();

    return {
      success: true,
      message: `Nota berhasil dicetak ke USB Printer (Baud ${PRINTER_MP58N.baudrate}).`,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Gagal mencetak via USB Serial.";
    if (
      errorMsg.includes("User cancelled") ||
      errorMsg.includes("no port selected")
    ) {
      throw new Error("Pemilihan port USB dibatalkan.");
    }
    throw new Error(errorMsg);
  }
}
