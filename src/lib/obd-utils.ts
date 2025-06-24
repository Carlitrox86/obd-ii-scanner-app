// OBD-II PIDs (Parameter IDs) for common readings
export const OBD_PIDS = {
  ENGINE_RPM: '010C',
  VEHICLE_SPEED: '010D',
  ENGINE_COOLANT_TEMP: '0105',
  THROTTLE_POSITION: '0111',
  ENGINE_LOAD: '0104',
  FUEL_LEVEL: '012F',
  READ_DTC: '03',
  CLEAR_DTC: '04'
} as const;

// Convert hex string to decimal number
export function hexToDecimal(hex: string): number {
  return parseInt(hex, 16);
}

// Parse OBD-II responses
export function parseOBDResponse(pid: string, response: string): number {
  // Remove spaces and unwanted characters
  const cleanResponse = response.replace(/\s|\n|\r/g, '');
  
  // Extract the data bytes (remove headers, checksum etc.)
  const data = cleanResponse.substring(4);
  
  switch (pid) {
    case OBD_PIDS.ENGINE_RPM:
      // Formula: ((A * 256) + B) / 4
      const a = hexToDecimal(data.substring(0, 2));
      const b = hexToDecimal(data.substring(2, 4));
      return ((a * 256) + b) / 4;
      
    case OBD_PIDS.VEHICLE_SPEED:
      // Direct conversion, no formula needed
      return hexToDecimal(data);
      
    case OBD_PIDS.ENGINE_COOLANT_TEMP:
      // Formula: A - 40
      return hexToDecimal(data) - 40;
      
    case OBD_PIDS.THROTTLE_POSITION:
    case OBD_PIDS.ENGINE_LOAD:
      // Formula: (100/255) * A
      return (100/255) * hexToDecimal(data);
      
    case OBD_PIDS.FUEL_LEVEL:
      // Formula: (100/255) * A
      return (100/255) * hexToDecimal(data);
      
    default:
      return 0;
  }
}

// Format DTC (Diagnostic Trouble Codes)
export function formatDTC(code: string): string {
  // DTC format: P0123, where:
  // First character: P (Powertrain), C (Chassis), B (Body), U (Network)
  // Second character: 0 (standard), 1 (manufacturer specific)
  // Last three characters: specific fault code
  
  const type = code.charAt(0);
  const specific = code.substring(1);
  
  return `${type}${specific}`;
}

// Create OBD-II command
export function createOBDCommand(pid: string): string {
  return `${pid}\r`;
}
