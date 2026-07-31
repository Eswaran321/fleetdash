import { encodeVehicleTelemetry, encodeGlobalTelemetry } from '../src/utils/binaryProtocol';

describe('binaryProtocol', () => {
  describe('encodeVehicleTelemetry', () => {
    it('produces a 32-byte ArrayBuffer', () => {
      const buf = encodeVehicleTelemetry({
        timestamp: new Date('2026-07-31T10:00:00Z'),
        lat: 12.9716,
        lng: 77.5946,
        speed: 45.5,
        fuel: 80,
        engineTemp: 92,
        distanceFromDepot: 1.25,
      });
      expect(buf).toBeInstanceOf(ArrayBuffer);
      expect(buf.byteLength).toBe(32);
    });

    it('encodes timestamp as float64 milliseconds (little-endian)', () => {
      const ts = new Date('2026-07-31T10:00:00Z');
      const buf = encodeVehicleTelemetry({
        timestamp: ts,
        lat: 0,
        lng: 0,
        speed: 0,
        fuel: 0,
        engineTemp: 0,
        distanceFromDepot: 0,
      });
      const dv = new DataView(buf);
      expect(dv.getFloat64(0, true)).toBe(ts.getTime());
    });

    it('rounds speed to 0.1 km/h precision at offset 24', () => {
      const buf = encodeVehicleTelemetry({
        timestamp: new Date(),
        lat: 0,
        lng: 0,
        speed: 45.5,
        fuel: 0,
        engineTemp: 0,
        distanceFromDepot: 0,
      });
      const dv = new DataView(buf);
      expect(dv.getUint16(24, true)).toBe(455);
    });

    it('stores fuel and engineTemp as uint8 at offsets 26/27', () => {
      const buf = encodeVehicleTelemetry({
        timestamp: new Date(),
        lat: 0,
        lng: 0,
        speed: 0,
        fuel: 87,
        engineTemp: 91,
        distanceFromDepot: 0,
      });
      const dv = new DataView(buf);
      expect(dv.getUint8(26)).toBe(87);
      expect(dv.getUint8(27)).toBe(91);
    });

    it('stores distanceFromDepot as float32 at offset 28', () => {
      const buf = encodeVehicleTelemetry({
        timestamp: new Date(),
        lat: 0,
        lng: 0,
        speed: 0,
        fuel: 0,
        engineTemp: 0,
        distanceFromDepot: 3.5,
      });
      const dv = new DataView(buf);
      expect(dv.getFloat32(28, true)).toBeCloseTo(3.5, 4);
    });
  });

  describe('encodeGlobalTelemetry', () => {
    it('produces a 49-byte ArrayBuffer', () => {
      const buf = encodeGlobalTelemetry({
        vehicleId: 'V-001',
        timestamp: new Date(),
        lat: 12.9716,
        lng: 77.5946,
        speed: 40,
        fuel: 75,
        engineTemp: 88,
        distanceFromDepot: 0.5,
        status: 'active',
      });
      expect(buf.byteLength).toBe(49);
    });

    it('pads vehicleId to 16 bytes', () => {
      const buf = encodeGlobalTelemetry({
        vehicleId: 'V-001',
        timestamp: new Date(),
        lat: 0,
        lng: 0,
        speed: 0,
        fuel: 0,
        engineTemp: 0,
        distanceFromDepot: 0,
        status: 'active',
      });
      const dv = new DataView(buf);
      const id = new TextDecoder().decode(new Uint8Array(buf, 0, 16)).replace(/\0/g, '');
      expect(id).toBe('V-001');
    });

    it('truncates vehicleIds longer than 16 bytes', () => {
      const buf = encodeGlobalTelemetry({
        vehicleId: 'V-12345678901234567890',
        timestamp: new Date(),
        lat: 0,
        lng: 0,
        speed: 0,
        fuel: 0,
        engineTemp: 0,
        distanceFromDepot: 0,
        status: 'active',
      });
      const id = new TextDecoder().decode(new Uint8Array(buf, 0, 16)).replace(/\0/g, '');
      expect(id).toHaveLength(16);
    });

    it('encodes status enum (0=active, 1=maintenance, 2=offline)', () => {
      const mk = (status: string) =>
        encodeGlobalTelemetry({
          vehicleId: 'V-001',
          timestamp: new Date(),
          lat: 0,
          lng: 0,
          speed: 0,
          fuel: 0,
          engineTemp: 0,
          distanceFromDepot: 0,
          status,
        });

      expect(new DataView(mk('active')).getUint8(48)).toBe(0);
      expect(new DataView(mk('maintenance')).getUint8(48)).toBe(1);
      expect(new DataView(mk('offline')).getUint8(48)).toBe(2);
    });

    it('defaults unknown status to active (0)', () => {
      const buf = encodeGlobalTelemetry({
        vehicleId: 'V-001',
        timestamp: new Date(),
        lat: 0,
        lng: 0,
        speed: 0,
        fuel: 0,
        engineTemp: 0,
        distanceFromDepot: 0,
        status: 'unknown-status',
      });
      expect(new DataView(buf).getUint8(48)).toBe(0);
    });
  });
});
