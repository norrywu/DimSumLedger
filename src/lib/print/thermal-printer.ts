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
      message: `Nota berhasil terkirim ke Bluetooth ${device.name || "Printer"}.`,
      deviceName: device.name || "Printer Thermal",
    };
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === "NotFoundError" ||
        err.message.includes("User cancelled") ||
        err.message.includes("cancelled"))
    ) {
      return {
        success: false,
        cancelled: true,
        message: "Pemilihan printer Bluetooth dibatalkan.",
      };
    }
    const errorMsg =
      err instanceof Error ? err.message : "Gagal mencetak via Bluetooth.";
    throw new Error(errorMsg);
  }
}
