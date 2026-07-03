import { parentPort } from 'worker_threads';

interface IncomingTelemetryPayload {
  gpsString: string; // Expected as "lat,lng" (e.g. "12.9716,77.5946")
  speed: string | number;
  fuel: string | number;
  engineTemp: string | number;
}

if (!parentPort) {
  throw new Error('This file must be initiated as a worker thread.');
}

/**
 * Calculates the geodetic distance between two coordinates in kilometers.
 * This represents CPU-intensive float trigonometry.
 */
function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// Listen for telemetry parse requests from the parent thread.
parentPort.on('message', (payload: IncomingTelemetryPayload) => {
  try {
    const { gpsString, speed, fuel, engineTemp } = payload;

    // Simulate additional CPU workload (e.g. coordinate checksums or validation cycles)
    let checksum = 0;
    for (let i = 0; i < 500000; i++) {
      checksum += Math.sin(i) * Math.cos(i);
    }

    // Split raw string coordinate
    const coordinateParts = gpsString.split(',');
    if (coordinateParts.length !== 2) {
      throw new Error('GPS string format invalid. Must be "lat,lng"');
    }

    const lat = parseFloat(coordinateParts[0].trim());
    const lng = parseFloat(coordinateParts[1].trim());

    // Validate boundaries
    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error(`Latitude out of bounds (-90 to 90): ${lat}`);
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error(`Longitude out of bounds (-180 to 180): ${lng}`);
    }

    // Standard Depot / Center (e.g. Bangalore center)
    const DEPOT_LAT = 12.9716;
    const DEPOT_LNG = 77.5946;

    // Calculate geofence distance
    const distanceFromDepot = calculateHaversine(lat, lng, DEPOT_LAT, DEPOT_LNG);

    // Reply to main thread with typed payload
    parentPort?.postMessage({
      success: true,
      data: {
        lat,
        lng,
        speed: Number(speed),
        fuel: Number(fuel),
        engineTemp: Number(engineTemp),
        distanceFromDepot,
        checksum,
      },
    });
  } catch (error: any) {
    parentPort?.postMessage({
      success: false,
      error: error.message || 'Worker failed to parse coordinate string.',
    });
  }
});
