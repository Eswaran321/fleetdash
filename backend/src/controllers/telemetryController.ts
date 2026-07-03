import { Request, Response, NextFunction } from 'express';
import TelemetryBucket from '../models/TelemetryBucket';
import Vehicle from '../models/Vehicle';
import { runCoordinateParserWorker } from '../workers/workerPool';
import logger from '../utils/logger';

/**
 * Ingests a new telemetry ping for a vehicle.
 * Coordinates are parsed in a worker thread, stored using the Bucket Pattern,
 * cached on the Vehicle record, and broadcasted via WebSockets.
 */
export const ingestTelemetry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, gpsString, speed, fuel, engineTemp, timestamp } = req.body;

    // Use current time if timestamp is not supplied in telemetry payload
    const pingTime = timestamp ? new Date(timestamp) : new Date();

    // 1. Offload heavy parsing & geofence computations to the worker thread
    const parsedData = await runCoordinateParserWorker({
      gpsString,
      speed,
      fuel,
      engineTemp,
    });

    const { lat, lng, distanceFromDepot } = parsedData;

    // 2. Compute the start of the hour for this reading to locate/create the bucket
    const bucketStart = new Date(pingTime);
    bucketStart.setMinutes(0, 0, 0);

    // 3. Upsert telemetry record in the hourly Bucket document
    const updatedBucket = await TelemetryBucket.findOneAndUpdate(
      { vehicleId, bucketStart },
      {
        $push: {
          telemetry: {
            timestamp: pingTime,
            lat,
            lng,
            speed: Number(speed),
            fuel: Number(fuel),
            engineTemp: Number(engineTemp),
          },
        },
        $inc: { count: 1 },
      },
      { upsert: true, new: true }
    );

    // 4. Update the vehicle status and cache the latest location coordinates
    const updatedVehicle = await Vehicle.findOneAndUpdate(
      { vehicleId },
      {
        $set: {
          lastActive: pingTime,
          lastLocation: { lat, lng },
          lastSpeed: Number(speed),
          status: 'active',
        },
        $setOnInsert: {
          name: `Fleet Vehicle ${vehicleId}`,
          licensePlate: `FT-${vehicleId.toUpperCase().slice(-4)}`,
          type: 'truck',
        },
      },
      { upsert: true, new: true }
    );

    // 5. Emit live telemetry data point via WebSockets for real-time tracking
    const io = req.app.get('io');
    if (io) {
      io.emit(`telemetry:${vehicleId}`, {
        vehicleId,
        timestamp: pingTime,
        lat,
        lng,
        speed: Number(speed),
        fuel: Number(fuel),
        engineTemp: Number(engineTemp),
        distanceFromDepot,
      });
      // Broadcast globally to update lists
      io.emit('telemetry_global', {
        vehicleId,
        timestamp: pingTime,
        lat,
        lng,
        speed: Number(speed),
        fuel: Number(fuel),
        engineTemp: Number(engineTemp),
        status: 'active',
      });
    }

    logger.debug(`Ingested telemetry for vehicle ${vehicleId}. Distance from depot: ${distanceFromDepot.toFixed(2)} km`);

    return res.status(201).json({
      success: true,
      message: 'Telemetry data ingested successfully.',
      data: {
        vehicleId,
        timestamp: pingTime,
        lat,
        lng,
        speed: Number(speed),
        fuel: Number(fuel),
        engineTemp: Number(engineTemp),
        distanceFromDepot,
      },
    });
  } catch (error: any) {
    logger.error(`Telemetry ingestion error: ${error.message}`);
    next(error);
  }
};
