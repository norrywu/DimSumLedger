import { BluetoothCharacteristic, WebBluetoothAPI } from "@/types/bluetooth";

export function isBluetoothSupported(): boolean {
  return typeof window !== "undefined" && "bluetooth" in navigator;
}

export async function connectToBluetoothPrinter() {
  if (!isBluetoothSupported()) {
    throw new Error(
      "Web Bluetooth tidak didukung browser ini. Gunakan Chrome/Edge di Android/Windows atau gunakan 'Cetak Browser'.",
    );
  }

  const navBT = (navigator as unknown as { bluetooth: WebBluetoothAPI })
    .bluetooth;

  const device = await navBT.requestDevice({
    acceptAllDevices: true,
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
        if (char.properties.write || char.properties.writeWithoutResponse) {
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

  return {
    device,
    writableChar,
  };
}
