import { Request, Response, NextFunction } from 'express';
import Vehicle from '../models/Vehicle';
import TelemetryBucket from '../models/TelemetryBucket';
import { geofenceService } from '../services/geofenceService';
import logger from '../utils/logger';

export const getFleetStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicles = await Vehicle.find();
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter((v) => v.status === 'active').length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance').length;
    const offlineVehicles = vehicles.filter((v) => v.status === 'offline').length;

    const speeds = vehicles.map((v) => v.lastSpeed || 0).filter((s) => s > 0);
    const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

    const breachHistory = geofenceService.getBreachHistory(500);
    const totalBreaches = breachHistory.length;
    const entryBreaches = breachHistory.filter((b) => b.breachType === 'entry').length;
    const exitBreaches = breachHistory.filter((b) => b.breachType === 'exit').length;

    const bucketCount = await TelemetryBucket.countDocuments();

    return res.status(200).json({
      success: true,
      data: {
        totalVehicles,
        activeVehicles,
        maintenanceVehicles,
        offlineVehicles,
        avgSpeed,
        maxSpeed,
        totalBreaches,
        entryBreaches,
        exitBreaches,
        bucketCount,
      },
    });
  } catch (error: any) {
    logger.error(`Error fetching fleet stats: ${error.message}`);
    next(error);
  }
};
