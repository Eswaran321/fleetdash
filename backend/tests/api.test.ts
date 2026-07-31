import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import Vehicle from '../src/models/Vehicle';
import TelemetryBucket from '../src/models/TelemetryBucket';

describe('API Integration Tests', () => {
  describe('GET /health', () => {
    it('returns healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('fleetdash-backend');
      expect(res.body.timestamp).toBeTruthy();
    });
  });

  describe('POST /telemetry', () => {
    it('ingests valid telemetry and returns 201', async () => {
      const res = await request(app).post('/telemetry').send({
        vehicleId: 'V-INT-001',
        gpsString: '12.9716,77.5946',
        speed: 45,
        fuel: 80,
        engineTemp: 90,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vehicleId).toBe('V-INT-001');
      expect(res.body.data.lat).toBe(12.9716);
      expect(res.body.data.lng).toBe(77.5946);
      expect(typeof res.body.data.distanceFromDepot).toBe('number');
    });

    it('persists telemetry into an hourly bucket', async () => {
      await request(app).post('/telemetry').send({
        vehicleId: 'V-INT-002',
        gpsString: '12.9716,77.5946',
        speed: 40,
        fuel: 70,
        engineTemp: 85,
      });

      const bucket = await TelemetryBucket.findOne({ vehicleId: 'V-INT-002' });
      expect(bucket).not.toBeNull();
      expect(bucket!.telemetry).toHaveLength(1);
      expect(bucket!.count).toBe(1);
      expect(bucket!.telemetry[0].speed).toBe(40);
    });

    it('upserts vehicle record with cached metrics', async () => {
      await request(app).post('/telemetry').send({
        vehicleId: 'V-INT-003',
        gpsString: '12.9800,77.6000',
        speed: 55,
        fuel: 60,
        engineTemp: 88,
      });

      const vehicle = await Vehicle.findOne({ vehicleId: 'V-INT-003' });
      expect(vehicle).not.toBeNull();
      expect(vehicle!.status).toBe('active');
      expect(vehicle!.lastSpeed).toBe(55);
      expect(vehicle!.lastLocation).toEqual({ lat: 12.98, lng: 77.6 });
    });

    it('accumulates multiple pings in the same hourly bucket', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app).post('/telemetry').send({
          vehicleId: 'V-INT-004',
          gpsString: '12.9716,77.5946',
          speed: 30 + i,
          fuel: 50,
          engineTemp: 80,
        });
      }
      const bucket = await TelemetryBucket.findOne({ vehicleId: 'V-INT-004' });
      expect(bucket!.telemetry).toHaveLength(3);
      expect(bucket!.count).toBe(3);
    });

    describe('validation failures', () => {
      it('rejects missing vehicleId', async () => {
        const res = await request(app).post('/telemetry').send({
          gpsString: '12.9716,77.5946',
          speed: 40,
          fuel: 70,
          engineTemp: 85,
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors.some((e: any) => e.field === 'vehicleId')).toBe(true);
      });

      it('rejects malformed gpsString', async () => {
        const res = await request(app).post('/telemetry').send({
          vehicleId: 'V-001',
          gpsString: '12.9716 77.5946',
          speed: 40,
          fuel: 70,
          engineTemp: 85,
        });
        expect(res.status).toBe(400);
        expect(res.body.errors.some((e: any) => e.field === 'gpsString')).toBe(true);
      });

      it('rejects negative speed', async () => {
        const res = await request(app).post('/telemetry').send({
          vehicleId: 'V-001',
          gpsString: '12.9716,77.5946',
          speed: -5,
          fuel: 70,
          engineTemp: 85,
        });
        expect(res.status).toBe(400);
        expect(res.body.errors.some((e: any) => e.field === 'speed')).toBe(true);
      });

      it('rejects fuel above 100', async () => {
        const res = await request(app).post('/telemetry').send({
          vehicleId: 'V-001',
          gpsString: '12.9716,77.5946',
          speed: 40,
          fuel: 150,
          engineTemp: 85,
        });
        expect(res.status).toBe(400);
        expect(res.body.errors.some((e: any) => e.field === 'fuel')).toBe(true);
      });

      it('rejects missing engineTemp', async () => {
        const res = await request(app).post('/telemetry').send({
          vehicleId: 'V-001',
          gpsString: '12.9716,77.5946',
          speed: 40,
          fuel: 70,
        });
        expect(res.status).toBe(400);
        expect(res.body.errors.some((e: any) => e.field === 'engineTemp')).toBe(true);
      });

      it('rejects non-numeric speed', async () => {
        const res = await request(app).post('/telemetry').send({
          vehicleId: 'V-001',
          gpsString: '12.9716,77.5946',
          speed: 'fast',
          fuel: 70,
          engineTemp: 85,
        });
        expect(res.status).toBe(400);
        expect(res.body.errors.some((e: any) => e.field === 'speed')).toBe(true);
      });
    });
  });

  describe('GET /vehicles', () => {
    it('returns an empty list when no vehicles exist', async () => {
      const res = await request(app).get('/vehicles');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('returns ingested vehicles sorted by vehicleId', async () => {
      await request(app).post('/telemetry').send({
        vehicleId: 'V-B',
        gpsString: '12.9716,77.5946',
        speed: 40,
        fuel: 70,
        engineTemp: 85,
      });
      await request(app).post('/telemetry').send({
        vehicleId: 'V-A',
        gpsString: '12.9716,77.5946',
        speed: 40,
        fuel: 70,
        engineTemp: 85,
      });

      const res = await request(app).get('/vehicles');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.data[0].vehicleId).toBe('V-A');
      expect(res.body.data[1].vehicleId).toBe('V-B');
    });
  });

  describe('GET /vehicles/:vehicleId', () => {
    it('returns flattened telemetry history', async () => {
      await request(app).post('/telemetry').send({
        vehicleId: 'V-HIST',
        gpsString: '12.9716,77.5946',
        speed: 35,
        fuel: 72,
        engineTemp: 82,
      });
      await request(app).post('/telemetry').send({
        vehicleId: 'V-HIST',
        gpsString: '12.9720,77.5950',
        speed: 38,
        fuel: 71,
        engineTemp: 83,
      });

      const res = await request(app).get('/vehicles/V-HIST');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.vehicleId).toBe('V-HIST');
      expect(res.body.pointsCount).toBe(2);
      expect(res.body.data).toHaveLength(2);
      // Chronological order (oldest first)
      expect(res.body.data[0].speed).toBe(35);
      expect(res.body.data[1].speed).toBe(38);
    });

    it('returns empty data for an unknown vehicle', async () => {
      const res = await request(app).get('/vehicles/V-UNKNOWN');
      expect(res.status).toBe(200);
      expect(res.body.pointsCount).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('honors the hours query parameter', async () => {
      const res = await request(app).get('/vehicles/V-HIST?hours=1');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /geofences', () => {
    it('returns all geofence zones', async () => {
      const res = await request(app).get('/geofences');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(3);
      expect(res.body.data.some((z: any) => z.geofenceId === 'zone-depot')).toBe(true);
    });
  });

  describe('GET /geofences/breaches', () => {
    it('returns recorded breach history', async () => {
      // Trigger a depot entry breach through the ingestion pipeline
      await request(app).post('/telemetry').send({
        vehicleId: 'V-BREACH',
        gpsString: '12.9716,77.5946',
        speed: 20,
        fuel: 60,
        engineTemp: 80,
      });

      const res = await request(app).get('/geofences/breaches');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      const depotBreach = res.body.data.find((b: any) => b.vehicleId === 'V-BREACH');
      expect(depotBreach).toBeTruthy();
      expect(depotBreach.breachType).toBe('entry');
      expect(depotBreach.geofenceName).toBe('Central Depot');
    });

    it('honors the limit query parameter', async () => {
      const res = await request(app).get('/geofences/breaches?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /analytics/stats', () => {
    it('returns zeroed stats when fleet is empty', async () => {
      const res = await request(app).get('/analytics/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        totalVehicles: 0,
        activeVehicles: 0,
        maintenanceVehicles: 0,
        offlineVehicles: 0,
        avgSpeed: 0,
        maxSpeed: 0,
      });
      expect(typeof res.body.data.totalBreaches).toBe('number');
      expect(typeof res.body.data.bucketCount).toBe('number');
    });

    it('computes aggregate fleet metrics', async () => {
      await request(app).post('/telemetry').send({
        vehicleId: 'V-STAT-1',
        gpsString: '12.9716,77.5946',
        speed: 50,
        fuel: 70,
        engineTemp: 85,
      });
      await request(app).post('/telemetry').send({
        vehicleId: 'V-STAT-2',
        gpsString: '12.9800,77.6000',
        speed: 30,
        fuel: 65,
        engineTemp: 84,
      });

      const res = await request(app).get('/analytics/stats');
      expect(res.status).toBe(200);
      expect(res.body.data.totalVehicles).toBe(2);
      expect(res.body.data.activeVehicles).toBe(2);
      expect(res.body.data.avgSpeed).toBe(40);
      expect(res.body.data.maxSpeed).toBe(50);
    });
  });

  describe('404 handler', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('does-not-exist');
    });
  });

  describe('error handling', () => {
    it('returns JSON error format with 500 for unhandled DB errors', async () => {
      const vehicleModel = mongoose.model('Vehicle');
      jest.spyOn(vehicleModel, 'find').mockReturnValueOnce({
        sort: () => Promise.reject(new Error('boom')),
      } as any);
      const res = await request(app).get('/vehicles');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('boom');
      jest.restoreAllMocks();
    });
  });
});
