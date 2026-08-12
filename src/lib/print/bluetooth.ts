import {
  BluetoothCharacteristic,
  BluetoothDevice,
  BluetoothService,
  WebBluetoothAPI,
} from "@/types/bluetooth";

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

  console.log("🔍 Starting Bluetooth device scan...");

  let device: BluetoothDevice;
  try {
    device = await navBT.requestDevice({
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb", // Printer GATT Service
        "0000ffe0-0000-1000-8000-00805f9b34fb", // FFE0 / HM-10 (Goojprt, PT-210, ZJiang, Mini POS)
        "0000ff00-0000-1000-8000-00805f9b34fb", // FF00 Custom Service (Panda, EPOS, Xprinter)
        "0000fee0-0000-1000-8000-00805f9b34fb", // FEE0 Telink / Jiabi BLE
        "0000fee1-0000-1000-8000-00805f9b34fb", // FEE1 Telink BLE
        "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Transparent Serial Service (Microchip/ISSC)
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // RPP02N / Rongta
        "0000af00-0000-1000-8000-00805f9b34fb", // AF00 Custom Service
        "0000ffe5-0000-1000-8000-00805f9b34fb", // FFE5 Custom Service
      ],
      acceptAllDevices: true,
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === "NotFoundError" || err.message.includes("cancelled"))
    ) {
      console.log("ℹ️ Pemilihan perangkat Bluetooth dibatalkan pengguna.");
    } else {
      console.error("❌ Error in requestDevice:", err);
    }
    throw err;
  }

  console.log("✅ Device found:", device.name || "unknown");
  console.log("📱 Device UUID:", device.id);

  if (!device || !device.gatt) {
    throw new Error("Perangkat Bluetooth tidak merespons.");
  }

  const server = await device.gatt.connect();
  const services = await server.getPrimaryServices();

  console.log("📡 Services found:", services.length);
  services.forEach((service: BluetoothService, idx: number) => {
    console.log(`   Service ${idx + 1}: ${service.uuid}`);
  });

  let writableChar: BluetoothCharacteristic | null = null;

  // Cari karakteristik Bluetooth yang mendukung Penulisan Data Biner (Write / WriteWithoutResponse)
  for (const service of services) {
    try {
      console.log("🔍 Checking service:", service.uuid);
      const characteristics = await service.getCharacteristics();
      console.log(`   Found ${characteristics.length} characteristics`);
      for (const char of characteristics) {
        // char.uuid from Web Bluetooth API; cast for logging
        console.log(
          `   - Char: ${char.uuid}, properties: write=${char.properties.write}, writeWithoutResponse=${char.properties.writeWithoutResponse}`,
        );
        if (char.properties.write || char.properties.writeWithoutResponse) {
          writableChar = char;
          console.log("✅ Writable characteristic found:", char.uuid);
          break;
        }
      }
      if (writableChar) break;
    } catch (err) {
      console.log(err);
    }
  }

  if (!writableChar) {
    console.error("❌ No writable characteristic found across all services");
    throw new Error(
      "Karakteristik penulisan data printer Bluetooth tidak ditemukan.",
    );
  }

  console.log(
    "📤 Returning printer connection, writableChar UUID:",
    writableChar.uuid,
  );

  return {
    device,
    writableChar,
  };
}
