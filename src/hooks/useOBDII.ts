import { useState, useEffect } from 'react';

export type OBDData = {
  rpm: number;
  speed: number;
  engineTemp: number;
  dtc: string[];
};

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const useOBDII = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [data, setData] = useState<OBDData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanBluetooth = async () => {
    try {
      setStatus('connecting');
      
      // Request Bluetooth device with OBD-II service
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['0000'] }  // Replace with actual OBD-II service UUID
        ]
      });

      // Connect to the device
      const server = await device.gatt?.connect();
      
      if (!server) {
        throw new Error('No se pudo conectar al dispositivo');
      }

      setStatus('connected');
      
      // Start polling OBD data
      startPolling(server);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al conectar por Bluetooth';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const connectWiFi = async (ipAddress: string, portNumber: number) => {
    try {
      setStatus('connecting');
      
      // Create WebSocket connection
      const ws = new WebSocket(`ws://${ipAddress}:${portNumber}`);
      
      ws.onopen = () => {
        setStatus('connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setData(data);
        } catch (err) {
          console.error('Error parsing WebSocket data:', err);
        }
      };
      
      ws.onerror = () => {
        setError('Error en la conexión WiFi');
        setStatus('error');
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al conectar por WiFi';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const startPolling = async (server: BluetoothRemoteGATTServer) => {
    // Implementation will depend on the specific OBD-II adapter being used
    // This is a simplified example
    try {
      // Get the OBD service
      const service = await server.getPrimaryService('0000'); // Replace with actual service UUID
      
      // Set up characteristic notifications
      const characteristic = await service.getCharacteristic('0000'); // Replace with actual characteristic UUID
      
      await characteristic.startNotifications();
      
      characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
        if (characteristic?.value) {
          // Parse the OBD data
          const decoded = decodeOBDData(characteristic.value);
          setData(decoded);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al leer datos OBD';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const decodeOBDData = (dataView: DataView): OBDData => {
    // Convert DataView to Uint8Array for easier handling
    const data = new Uint8Array(dataView.buffer);
    
    // Parse the data according to OBD-II protocol
    // This is a simplified example - actual implementation will depend on your adapter
    return {
      rpm: data[0] * 256 + data[1],
      speed: data[2],
      engineTemp: data[3] - 40, // Convert to Celsius
      dtc: []
    };
  };

  const disconnect = async () => {
    setStatus('disconnected');
    setData(null);
    setError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    status,
    data,
    error,
    scanBluetooth,
    connectWiFi,
    disconnect
  };
};

export default useOBDII;
