import { OBD_PIDS, createOBDCommand } from './obd-utils';
import type { OBDData } from '@/hooks/useOBDII';

export type ConnectionType = 'bluetooth' | 'wifi';

export interface ConnectionConfig {
  type: ConnectionType;
  ipAddress?: string;
  port?: number;
}

export class OBDConnection {
  private ws: WebSocket | null = null;
  private btDevice: BluetoothDevice | null = null;
  private onDataCallback: ((data: OBDData) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.handleData = this.handleData.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  public async connect(config: ConnectionConfig): Promise<void> {
    try {
      if (config.type === 'bluetooth') {
        await this.connectBluetooth();
      } else if (config.type === 'wifi' && config.ipAddress && config.port) {
        await this.connectWiFi(config.ipAddress, config.port);
      } else {
        throw new Error('Invalid connection configuration');
      }
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'Connection failed');
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.btDevice) {
      // Disconnect Bluetooth device
      if (this.btDevice.gatt?.connected) {
        this.btDevice.gatt.disconnect();
      }
      this.btDevice = null;
    }
  }

  public onData(callback: (data: OBDData) => void): void {
    this.onDataCallback = callback;
  }

  public onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  private async connectBluetooth(): Promise<void> {
    try {
      // Request Bluetooth device with OBD-II service
      this.btDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['0000'] }  // Replace with actual OBD-II service UUID
        ]
      });

      const server = await this.btDevice.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to Bluetooth device');
      }

      // Get the OBD service and characteristic
      const service = await server.getPrimaryService('0000'); // Replace with actual service UUID
      const characteristic = await service.getCharacteristic('0000'); // Replace with actual characteristic UUID

      // Set up notifications
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (target.value) {
          const data = this.parseOBDData(target.value);
          this.handleData(data);
        }
      });

    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'Bluetooth connection failed');
    }
  }

  private async connectWiFi(ipAddress: string, port: number): Promise<void> {
    try {
      this.ws = new WebSocket(`ws://${ipAddress}:${port}`);

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const rawData = JSON.parse(event.data);
          const data: OBDData = {
            rpm: rawData.rpm || 0,
            speed: rawData.speed || 0,
            engineTemp: rawData.engineTemp || 0,
            dtc: rawData.dtc || []
          };
          this.handleData(data);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      this.ws.onerror = () => {
        this.handleError('WebSocket connection error');
      };

      this.ws.onclose = () => {
        this.handleError('WebSocket connection closed');
      };

    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'WiFi connection failed');
    }
  }

  private parseOBDData(dataView: DataView): OBDData {
    // Convert DataView to Uint8Array for easier handling
    const data = new Uint8Array(dataView.buffer);
    
    return {
      rpm: (data[0] * 256 + data[1]) / 4, // Formula for RPM
      speed: data[2], // Speed in km/h
      engineTemp: data[3] - 40, // Convert to Celsius
      dtc: [] // DTCs would need separate command/handling
    };
  }

  private handleData(data: OBDData): void {
    if (this.onDataCallback) {
      this.onDataCallback(data);
    }
  }

  private handleError(error: string): void {
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  public async sendCommand(pid: keyof typeof OBD_PIDS): Promise<void> {
    const command = createOBDCommand(OBD_PIDS[pid]);
    
    if (this.ws) {
      this.ws.send(command);
    } else if (this.btDevice?.gatt?.connected) {
      // Send command via Bluetooth
      // Implementation depends on your OBD adapter's protocol
    }
  }
}
