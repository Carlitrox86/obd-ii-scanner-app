interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer;
  name?: string;
  id: string;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  device: BluetoothDevice;
  uuid: string;
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  value: DataView | null;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothCharacteristicEventInit extends EventInit {
  characteristic: BluetoothRemoteGATTCharacteristic;
}

interface BluetoothCharacteristicEvent extends Event {
  characteristic: BluetoothRemoteGATTCharacteristic;
  target: BluetoothRemoteGATTCharacteristic;
}

interface Navigator {
  bluetooth: {
    requestDevice(options: {
      filters: Array<{ services: string[] }>;
    }): Promise<BluetoothDevice>;
  };
}
