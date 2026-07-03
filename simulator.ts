import http from 'http';

interface VehicleState {
  vehicleId: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  fuel: number;
  engineTemp: number;
  heading: number; // angle in radians to simulate smoother path steering
}

const API_URL = 'http://localhost:5000/telemetry';
const UPDATE_INTERVAL_MS = 3000;

// Initialize 5 distinct fleet vehicles with different start positions around Bangalore, India.
const vehicles: VehicleState[] = [
  { vehicleId: 'V-001', name: 'Cargo Truck Alpha', lat: 12.9716, lng: 77.5946, speed: 50, fuel: 85.5, engineTemp: 82, heading: 0 },
  { vehicleId: 'V-002', name: 'Delivery Van Beta', lat: 12.9801, lng: 77.5802, speed: 65, fuel: 92.0, engineTemp: 80, heading: Math.PI / 4 },
  { vehicleId: 'V-003', name: 'Service Car Gamma', lat: 12.9605, lng: 77.6010, speed: 40, fuel: 60.3, engineTemp: 85, heading: Math.PI / 2 },
  { vehicleId: 'V-004', name: 'Heavy Hauler Delta', lat: 12.9512, lng: 77.5701, speed: 30, fuel: 45.1, engineTemp: 90, heading: Math.PI },
  { vehicleId: 'V-005', name: 'Express Bike Epsilon', lat: 12.9902, lng: 77.6115, speed: 75, fuel: 78.4, engineTemp: 78, heading: -Math.PI / 4 },
];

/**
 * Mutates coordinates and sensor telemetry values to simulate continuous driving.
 */
function updateVehicleState(v: VehicleState) {
  // 1. Simulate steering heading changes (slight angular changes)
  v.heading += (Math.random() - 0.5) * 0.5;

  // 2. Adjust speed based on speed limit fluctuations (0 to 110 km/h)
  v.speed += (Math.random() - 0.5) * 8;
  if (v.speed < 0) v.speed = 0;
  if (v.speed > 110) v.speed = 110;

  // 3. Move coordinates in direction of heading according to speed
  const speedFactor = v.speed / 360000; // Translate speed into degrees lat/lng
  v.lat += Math.sin(v.heading) * speedFactor;
  v.lng += Math.cos(v.heading) * speedFactor;

  // Bound variables to sensible coordinate maps
  if (v.lat < 12.8) v.lat = 12.9716;
  if (v.lat > 13.1) v.lat = 12.9716;
  if (v.lng < 77.4) v.lng = 77.5946;
  if (v.lng > 77.8) v.lng = 77.5946;

  // 4. Slowly deplete fuel
  v.fuel -= (Math.random() * 0.05) + 0.01;
  if (v.fuel <= 0) v.fuel = 100; // Auto-refuel simulation

  // 5. Engine temperature fluctuations based on speeds
  const targetTemp = 75 + (v.speed * 0.25) + (Math.random() * 3);
  v.engineTemp += (targetTemp - v.engineTemp) * 0.1;
}

/**
 * Performs HTTP POST telemetry ingestion using the standard http library.
 */
function postTelemetry(vehicle: VehicleState): Promise<void> {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      vehicleId: vehicle.vehicleId,
      gpsString: `${vehicle.lat.toFixed(6)},${vehicle.lng.toFixed(6)}`,
      speed: Math.round(vehicle.speed),
      fuel: Math.round(vehicle.fuel),
      engineTemp: Math.round(vehicle.engineTemp),
      timestamp: new Date().toISOString(),
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/telemetry',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log(`[Simulator] Telemetry sent for ${vehicle.vehicleId}: ${vehicle.lat.toFixed(4)},${vehicle.lng.toFixed(4)} | Speed: ${Math.round(vehicle.speed)} km/h | Fuel: ${Math.round(vehicle.fuel)}%`);
        } else {
          console.error(`[Simulator] Ingestion failed for ${vehicle.vehicleId}. Status: ${res.statusCode} | Response: ${body}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`[Simulator] Request error for ${vehicle.vehicleId}: ${e.message}`);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Primary simulation loop. Runs updates and sends HTTP requests.
 */
async function startSimulation() {
  console.log('====================================================');
  console.log(' FleetDash Telemetry Generator Simulator Initiated');
  console.log(` Target Ingestion Server: ${API_URL}`);
  console.log(` Frequency: Every ${UPDATE_INTERVAL_MS / 1000} seconds`);
  console.log('====================================================');

  while (true) {
    const promises = vehicles.map(async (v) => {
      updateVehicleState(v);
      await postTelemetry(v);
    });

    await Promise.all(promises);
    await new Promise((r) => setTimeout(r, UPDATE_INTERVAL_MS));
  }
}

// Start simulation process.
startSimulation();
