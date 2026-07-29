import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { connectDB } from '../config/db';

describe('FleetDash REST API Endpoints', () => {
  beforeAll(async () => {
    process.env.USE_IN_MEMORY_DB = 'true';
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('GET /health - should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('fleetdash-backend');
  });

  it('POST /telemetry - should ingest valid telemetry ping', async () => {
    const payload = {
      vehicleId: 'TEST-01',
      gpsString: '12.9716,77.5946',
      speed: 55,
      fuel: 90,
      engineTemp: 82,
      timestamp: new Date().toISOString(),
    };

    const res = await request(app).post('/telemetry').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vehicleId).toBe('TEST-01');
    expect(res.body.data.lat).toBe(12.9716);
    expect(res.body.data.lng).toBe(77.5946);
  });

  it('GET /vehicles - should return list of active vehicles', async () => {
    const res = await request(app).get('/vehicles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((v: any) => v.vehicleId === 'TEST-01')).toBe(true);
  });

  it('GET /vehicles/:vehicleId - should return telemetry history for vehicle', async () => {
    const res = await request(app).get('/vehicles/TEST-01');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.vehicleId).toBe('TEST-01');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
