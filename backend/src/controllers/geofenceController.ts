import { Request, Response, NextFunction } from 'express';
import { geofenceService } from '../services/geofenceService';
import logger from '../utils/logger';

export const listZones = (req: Request, res: Response, next: NextFunction) => {
  try {
    const zones = geofenceService.getZones();
    return res.status(200).json({
      success: true,
      count: zones.length,
      data: zones,
    });
  } catch (error: any) {
    logger.error(`Error listing geofence zones: ${error.message}`);
    next(error);
  }
};

export const listBreaches = (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const breaches = geofenceService.getBreachHistory(limit);
    return res.status(200).json({
      success: true,
      count: breaches.length,
      data: breaches,
    });
  } catch (error: any) {
    logger.error(`Error listing breach history: ${error.message}`);
    next(error);
  }
};
