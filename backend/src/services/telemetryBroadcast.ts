import { Server as SocketIOServer } from 'socket.io';
import { subscriber, isAvailable, TELEMETRY_CHANNEL, TELEMETRY_GLOBAL_CHANNEL } from '../config/redis';
import { BREACH_ALERT_CHANNEL } from '../types/breachAlert';
import { encodeVehicleTelemetry, encodeGlobalTelemetry } from '../utils/binaryProtocol';
import logger from '../utils/logger';

function parseAndEmit(channel: string, message: string, io: SocketIOServer): void {
  try {
    const data = JSON.parse(message);

    if (channel === TELEMETRY_CHANNEL) {
      const binary = encodeVehicleTelemetry({
        timestamp: new Date(data.timestamp),
        lat: data.lat,
        lng: data.lng,
        speed: data.speed,
        fuel: data.fuel,
        engineTemp: data.engineTemp,
        distanceFromDepot: data.distanceFromDepot,
      });
      io.emit(`telemetry:${data.vehicleId}`, binary);
    } else if (channel === TELEMETRY_GLOBAL_CHANNEL) {
      const binary = encodeGlobalTelemetry({
        vehicleId: data.vehicleId,
        timestamp: new Date(data.timestamp),
        lat: data.lat,
        lng: data.lng,
        speed: data.speed,
        fuel: data.fuel,
        engineTemp: data.engineTemp,
        distanceFromDepot: data.distanceFromDepot,
        status: data.status,
      });
      io.emit('telemetry_global', binary);
    } else if (channel === BREACH_ALERT_CHANNEL) {
      io.emit(BREACH_ALERT_CHANNEL, data);
    }
  } catch (err: any) {
    logger.error(`Failed to process ${channel}: ${err.message}`);
  }
}

export function startTelemetryBroadcast(io: SocketIOServer): void {
  if (!isAvailable || !subscriber) {
    logger.warn('Redis subscriber unavailable — skipping Redis → Socket.io bridge');
    return;
  }

  subscriber.subscribe(TELEMETRY_CHANNEL, TELEMETRY_GLOBAL_CHANNEL, BREACH_ALERT_CHANNEL, (err, count) => {
    if (err) {
      logger.error(`Redis subscription failed: ${err.message}`);
      return;
    }
    logger.info(`Subscribed to ${count} Redis channels (telemetry + geofence)`);
  });

  subscriber.on('message', (channel, message) => {
    parseAndEmit(channel, message, io);
  });

  logger.info('Telemetry broadcast service initialized (Redis → Socket.io)');
}
