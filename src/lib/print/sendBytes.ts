import { BluetoothCharacteristic } from "@/types/bluetooth";

export async function sendBytes(
  escData: Uint8Array,
  writableChar: BluetoothCharacteristic,
) {
  // 20 bytes adalah ukuran payload MTU standar BLE tanpa negosiasi tambahan.
  // Ini menjamin 100% data tidak terpotong di semua jenis printer BLE (lama maupun baru).
  const CHUNK_SIZE = 20;

  for (let i = 0; i < escData.length; i += CHUNK_SIZE) {
    const chunk = escData.subarray(i, i + CHUNK_SIZE);

    if (
      writableChar.properties.writeWithoutResponse &&
      writableChar.writeValueWithoutResponse
    ) {
      await writableChar.writeValueWithoutResponse(chunk);
    } else if (writableChar.properties.write && writableChar.writeValue) {
      await writableChar.writeValue(chunk);
    } else {
      throw new Error(
        "Bluetooth characteristic tidak mendukung operasi write.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
