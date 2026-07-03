import { Router } from 'express';
import { getVehicles, getTelemetryByVehicleId } from '../controllers/vehicleController';

const router = Router();

// Route to fetch metadata for all active vehicles.
router.get('/', getVehicles);

// Route to fetch historical telemetry logs for a specific vehicle.
router.get('/:vehicleId', getTelemetryByVehicleId);

export default router;
