import Redis from 'ioredis';
import logger from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

export let isAvailable = false;
export let publisher: Redis | null = null;
export let subscriber: Redis | null = null;

export const TELEMETRY_CHANNEL = 'telemetry:ingest';
export const TELEMETRY_GLOBAL_CHANNEL = 'telemetry:global';

export async function initRedis(): Promise<void> {
  if (!REDIS_ENABLED) {
    logger.info('Redis is disabled via REDIS_ENABLED=false');
    return;
  }

  try {
    publisher = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    subscriber = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    await Promise.all([publisher.connect(), subscriber.connect()]);

    publisher.on('error', (err) => logger.warn(`Redis publisher: ${err.message}`));
    subscriber.on('error', (err) => logger.warn(`Redis subscriber: ${err.message}`));

    isAvailable = true;
    logger.info('Redis connected and ready');
  } catch (err: any) {
    logger.warn(`Redis unavailable (${err.message}). Falling back to direct Socket.io broadcast.`);
    publisher = null;
    subscriber = null;
    isAvailable = false;
  }
}
