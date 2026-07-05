import { Request, Response, NextFunction } from 'express';
import TelemetryBucket from '../models/TelemetryBucket';
import Vehicle from '../models/Vehicle';
import { runCoordinateParserWorker } from '../workers/workerPool';
import { publisher, isAvailable as redisAvailable, TELEMETRY_CHANNEL, TELEMETRY_GLOBAL_CHANNEL } from '../config/redis';
import logger from '../utils/logger';

/**
 * Ingests a new telemetry ping for a vehicle.
 * Coordinates are parsed in a worker thread, stored using the Bucket Pattern,
 * cached on the Vehicle record, and broadcasted via Redis Pub/Sub → Socket.io.
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
    await TelemetryBucket.findOneAndUpdate(
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
    await Vehicle.findOneAndUpdate(
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

    // 5. Broadcast telemetry — via Redis Pub/Sub if available, else direct Socket.io
    const vehiclePayload = {
      vehicleId,
      timestamp: pingTime,
      lat,
      lng,
      speed: Number(speed),
      fuel: Number(fuel),
      engineTemp: Number(engineTemp),
      distanceFromDepot,
    };

    if (redisAvailable && publisher) {
      publisher.publish(TELEMETRY_CHANNEL, JSON.stringify(vehiclePayload));
      publisher.publish(TELEMETRY_GLOBAL_CHANNEL, JSON.stringify({ ...vehiclePayload, status: 'active' }));
    } else {
      const io = req.app.get('io');
      if (io) {
        io.emit(`telemetry:${vehicleId}`, vehiclePayload);
        io.emit('telemetry_global', { ...vehiclePayload, status: 'active' });
      }
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
