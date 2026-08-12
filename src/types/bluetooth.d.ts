export interface BluetoothCharacteristic {
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValueWithoutResponse?: (value: Uint8Array) => Promise<void>;
  writeValue?: (value: Uint8Array) => Promise<void>;
}

export interface BluetoothService {
  getCharacteristics: () => Promise<BluetoothCharacteristic[]>;
}

export interface BluetoothRemoteGATTServer {
  getPrimaryServices: () => Promise<BluetoothService[]>;
}

export interface BluetoothDeviceGatt {
  connect: () => Promise<BluetoothRemoteGATTServer>;
  connected: boolean;
  disconnect: () => void;
}

export interface BluetoothDevice {
  name?: string;
  gatt?: BluetoothDeviceGatt;
}

export interface WebBluetoothAPI {
  requestDevice: (options: unknown) => Promise<BluetoothDevice>;
}
