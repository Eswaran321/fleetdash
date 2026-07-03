import { Request, Response, NextFunction } from 'express';
import Vehicle from '../models/Vehicle';
import TelemetryBucket from '../models/TelemetryBucket';
import logger from '../utils/logger';

/**
 * Retrieves a list of all registered vehicles with their cached real-time metrics.
 */
export const getVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicles = await Vehicle.find().sort({ vehicleId: 1 });
    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error: any) {
    logger.error(`Error retrieving vehicles: ${error.message}`);
    next(error);
  }
};

/**
 * Retrieves historical telemetry logs for a vehicle.
 * Reads hourly buckets and flattens nested readings into a clean, chronological time-series array.
 */
export const getTelemetryByVehicleId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId } = req.params;
    const { hours } = req.query;

    const bucketLimit = hours ? parseInt(hours as string, 10) : 24;

    logger.debug(`Fetching telemetry history for vehicle ${vehicleId} (Limit: ${bucketLimit} hours)`);

    // Fetch the most recent buckets for this vehicle
    const buckets = await TelemetryBucket.find({ vehicleId })
      .sort({ bucketStart: -1 })
      .limit(bucketLimit);

    // Flatten all telemetry items and sort chronologically (oldest to newest)
    const telemetryPoints = buckets
      .flatMap((bucket) => bucket.telemetry)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return res.status(200).json({
      success: true,
      vehicleId,
      pointsCount: telemetryPoints.length,
      data: telemetryPoints,
    });
  } catch (error: any) {
    logger.error(`Error retrieving telemetry for vehicle ${req.params.vehicleId}: ${error.message}`);
    next(error);
  }
};
