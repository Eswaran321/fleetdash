import { Server as SocketIOServer } from 'socket.io';
import { subscriber, isAvailable, TELEMETRY_CHANNEL, TELEMETRY_GLOBAL_CHANNEL } from '../config/redis';
import logger from '../utils/logger';

export function startTelemetryBroadcast(io: SocketIOServer): void {
  if (!isAvailable || !subscriber) {
    logger.warn('Redis subscriber unavailable — skipping Redis → Socket.io bridge');
    return;
  }

  subscriber.subscribe(TELEMETRY_CHANNEL, TELEMETRY_GLOBAL_CHANNEL, (err, count) => {
    if (err) {
      logger.error(`Redis subscription failed: ${err.message}`);
      return;
    }
    logger.info(`Subscribed to ${count} Redis telemetry channels`);
  });

  subscriber.on('message', (channel, message) => {
    try {
      if (channel === TELEMETRY_CHANNEL) {
        const data = JSON.parse(message);
        io.emit(`telemetry:${data.vehicleId}`, data);
      } else if (channel === TELEMETRY_GLOBAL_CHANNEL) {
        const data = JSON.parse(message);
        io.emit('telemetry_global', data);
      }
    } catch (parseError: any) {
      logger.error(`Failed to parse Redis message on ${channel}: ${parseError.message}`);
    }
  });

  logger.info('Telemetry broadcast service initialized (Redis → Socket.io)');
}
