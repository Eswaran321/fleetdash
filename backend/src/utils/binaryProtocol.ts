export function encodeVehicleTelemetry(data: {
  timestamp: Date;
  lat: number;
  lng: number;
  speed: number;
  fuel: number;
  engineTemp: number;
  distanceFromDepot: number;
}): ArrayBuffer {
  const buf = new ArrayBuffer(32);
  const dv = new DataView(buf);

  dv.setFloat64(0, data.timestamp.getTime(), true);
  dv.setFloat64(8, data.lat, true);
  dv.setFloat64(16, data.lng, true);
  dv.setUint16(24, Math.round(data.speed * 10), true);
  dv.setUint8(26, Math.round(data.fuel));
  dv.setUint8(27, Math.round(data.engineTemp));
  dv.setFloat32(28, data.distanceFromDepot, true);

  return buf;
}

export function encodeGlobalTelemetry(data: {
  vehicleId: string;
  timestamp: Date;
  lat: number;
  lng: number;
  speed: number;
  fuel: number;
  engineTemp: number;
  distanceFromDepot: number;
  status: string;
}): ArrayBuffer {
  const buf = new ArrayBuffer(49);
  const dv = new DataView(buf);

  const encoder = new TextEncoder();
  const idBytes = encoder.encode(data.vehicleId.padEnd(16, '\0').slice(0, 16));
  for (let i = 0; i < 16; i++) {
    dv.setUint8(i, idBytes[i]);
  }

  dv.setFloat64(16, data.timestamp.getTime(), true);
  dv.setFloat64(24, data.lat, true);
  dv.setFloat64(32, data.lng, true);
  dv.setUint16(40, Math.round(data.speed * 10), true);
  dv.setUint8(42, Math.round(data.fuel));
  dv.setUint8(43, Math.round(data.engineTemp));
  dv.setFloat32(44, data.distanceFromDepot, true);

  const statusMap: Record<string, number> = { active: 0, maintenance: 1, offline: 2 };
  dv.setUint8(48, statusMap[data.status] ?? 0);

  return buf;
}
