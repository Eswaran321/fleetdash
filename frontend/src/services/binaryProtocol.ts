export interface VehicleTelemetry {
  timestamp: string;
  lat: number;
  lng: number;
  speed: number;
  fuel: number;
  engineTemp: number;
  distanceFromDepot: number;
}

export interface GlobalTelemetry extends VehicleTelemetry {
  vehicleId: string;
  status: string;
}

export function decodeVehicleTelemetry(buf: ArrayBuffer): VehicleTelemetry {
  const dv = new DataView(buf);
  return {
    timestamp: new Date(dv.getFloat64(0, true)).toISOString(),
    lat: dv.getFloat64(8, true),
    lng: dv.getFloat64(16, true),
    speed: dv.getUint16(24, true) / 10,
    fuel: dv.getUint8(26),
    engineTemp: dv.getUint8(27),
    distanceFromDepot: dv.getFloat32(28, true),
  };
}

export function decodeGlobalTelemetry(buf: ArrayBuffer): GlobalTelemetry {
  const dv = new DataView(buf);
  const decoder = new TextDecoder();
  const idBytes = new Uint8Array(buf, 0, 16);
  const vehicleId = decoder.decode(idBytes).replace(/\0+$/, '');

  return {
    vehicleId,
    timestamp: new Date(dv.getFloat64(16, true)).toISOString(),
    lat: dv.getFloat64(24, true),
    lng: dv.getFloat64(32, true),
    speed: dv.getUint16(40, true) / 10,
    fuel: dv.getUint8(42),
    engineTemp: dv.getUint8(43),
    distanceFromDepot: dv.getFloat32(44, true),
    status: ['active', 'maintenance', 'offline'][dv.getUint8(48)] || 'active',
  };
}
