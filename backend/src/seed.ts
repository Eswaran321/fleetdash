import mongoose from 'mongoose';
import Vehicle from './models/Vehicle';
import { connectDB } from './config/db';
import logger from './utils/logger';

const seedVehicles = [
  { vehicleId: 'V-001', name: 'Cargo Truck Alpha', licensePlate: 'FT-0001', type: 'truck' as const, status: 'active' as const, lastSpeed: 0 },
  { vehicleId: 'V-002', name: 'Delivery Van Beta', licensePlate: 'FT-0002', type: 'van' as const, status: 'active' as const, lastSpeed: 0 },
  { vehicleId: 'V-003', name: 'Service Car Gamma', licensePlate: 'FT-0003', type: 'car' as const, status: 'active' as const, lastSpeed: 0 },
  { vehicleId: 'V-004', name: 'Heavy Hauler Delta', licensePlate: 'FT-0004', type: 'truck' as const, status: 'active' as const, lastSpeed: 0 },
  { vehicleId: 'V-005', name: 'Express Bike Epsilon', licensePlate: 'FT-0005', type: 'motorcycle' as const, status: 'active' as const, lastSpeed: 0 },
  { vehicleId: 'V-006', name: 'Refrigerated Van Zeta', licensePlate: 'FT-0006', type: 'van' as const, status: 'active' as const, lastSpeed: 0 },
  { vehicleId: 'V-007', name: 'Passenger Bus Eta', licensePlate: 'FT-0007', type: 'truck' as const, status: 'active' as const, lastSpeed: 0 },
  { vehicleId: 'V-008', name: 'Utility Pickup Theta', licensePlate: 'FT-0008', type: 'truck' as const, status: 'active' as const, lastSpeed: 0 },
  { vehicleId: 'V-009', name: 'Tanker Truck Iota', licensePlate: 'FT-0009', type: 'truck' as const, status: 'active' as const, lastSpeed: 0 },
  { vehicleId: 'V-010', name: 'Courier Scooter Kappa', licensePlate: 'FT-0010', type: 'motorcycle' as const, status: 'active' as const, lastSpeed: 0 },
];

async function seed() {
  await connectDB();

  let inserted = 0;
  let skipped = 0;

  for (const v of seedVehicles) {
    const existing = await Vehicle.findOne({ vehicleId: v.vehicleId });
    if (existing) {
      skipped++;
      continue;
    }
    await Vehicle.create({
      ...v,
      lastActive: new Date(),
      lastLocation: { lat: 12.9716, lng: 77.5946 },
    });
    inserted++;
  }

  logger.info(`Seed complete: ${inserted} inserted, ${skipped} already existed`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
