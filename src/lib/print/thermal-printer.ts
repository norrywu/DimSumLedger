import { RiwayatTransaksi } from "@/types/cashier";
import { connectToBluetoothPrinter } from "./bluetooth";
import { generateEscPosBytes } from "./escpos";
import { sendBytes } from "./sendBytes";

export async function printThermalBluetooth(transaksi: RiwayatTransaksi) {
  try {
    const { device, writableChar } = await connectToBluetoothPrinter();

    const escData = generateEscPosBytes(transaksi);

    await sendBytes(escData, writableChar);

    if (device.gatt?.connected) {
      device.gatt.disconnect();
    }

    return {
      success: true,
      message: `Nota berhasil terkirim ke Bluetooth ${device.name}.`,
    };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Gagal mencetak via Bluetooth.";
    if (errorMsg.includes("User cancelled") || errorMsg.includes("cancelled")) {
      throw new Error("Pemilihan printer Bluetooth dibatalkan.");
    }
    throw new Error(errorMsg);
  }
}
