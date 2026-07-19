import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const vehicles = [
  { vehicleId: 'V-001', lat: 12.9716, lng: 77.5946 },
  { vehicleId: 'V-002', lat: 12.9801, lng: 77.5802 },
  { vehicleId: 'V-003', lat: 12.9605, lng: 77.6010 },
  { vehicleId: 'V-004', lat: 12.9512, lng: 77.5701 },
  { vehicleId: 'V-005', lat: 12.9902, lng: 77.6115 },
  { vehicleId: 'V-006', lat: 12.9650, lng: 77.5600 },
  { vehicleId: 'V-007', lat: 12.9850, lng: 77.6050 },
  { vehicleId: 'V-008', lat: 12.9550, lng: 77.5850 },
  { vehicleId: 'V-009', lat: 12.9750, lng: 77.5750 },
  { vehicleId: 'V-010', lat: 12.9950, lng: 77.5900 },
];

const errorRate = new Rate('errors');
const ingestionDuration = new Trend('ingestion_duration');

function randomOffset(base, range) {
  return base + (Math.random() - 0.5) * range;
}

function buildPayload(vehicle) {
  const lat = randomOffset(vehicle.lat, 0.02);
  const lng = randomOffset(vehicle.lng, 0.02);
  return JSON.stringify({
    vehicleId: vehicle.vehicleId,
    gpsString: `${lat.toFixed(6)},${lng.toFixed(6)}`,
    speed: Math.round(randomOffset(50, 40)),
    fuel: Math.round(randomOffset(75, 30)),
    engineTemp: Math.round(randomOffset(83, 10)),
    timestamp: new Date().toISOString(),
  });
}

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '2m', target: 2000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

function telemetryIngestionTest() {
  group('POST /telemetry', () => {
    vehicles.forEach((vehicle) => {
      const payload = buildPayload(vehicle);
      const params = {
        headers: { 'Content-Type': 'application/json' },
      };

      const res = http.post(`${BASE_URL}/telemetry`, payload, params);
      ingestionDuration.add(res.timings.duration);

      const success = check(res, {
        'status is 201': (r) => r.status === 201,
        'response has success true': (r) => {
          try {
            return JSON.parse(r.body).success === true;
          } catch {
            return false;
          }
        },
      });

      if (!success) {
        errorRate.add(1);
        console.error(`FAIL ${vehicle.vehicleId}: ${res.status} ${res.body}`);
      }
    });
  });
}

export function teardown() {
  const res = http.get(`${BASE_URL}/vehicles`);
  check(res, {
    'teardown: vehicles endpoint is reachable': (r) => r.status === 200,
  });
  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      console.log(`Total vehicles in DB after load test: ${body.count}`);
      const allHaveLocations = body.data.every((v) => v.lastLocation);
      console.log(`All vehicles have location data: ${allHaveLocations}`);
    } catch (e) {
      console.error(`Teardown parse error: ${e.message}`);
    }
  }
}

export default function () {
  telemetryIngestionTest();
  sleep(1);
}
