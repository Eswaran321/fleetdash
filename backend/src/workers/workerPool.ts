import { Worker } from 'worker_threads';
import path from 'path';
import logger from '../utils/logger';

export interface ParsedTelemetry {
  lat: number;
  lng: number;
  speed: number;
  fuel: number;
  engineTemp: number;
  distanceFromDepot: number;
  checksum: number;
}

/**
 * Offloads coordinate parsing and geofence math to a background worker thread.
 * Returns a Promise that resolves with the parsed and validated metrics.
 */
export function runCoordinateParserWorker(payload: {
  gpsString: string;
  speed: string | number;
  fuel: string | number;
  engineTemp: string | number;
}): Promise<ParsedTelemetry> {
  return new Promise((resolve, reject) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const workerFilename = isProduction ? 'parser.js' : 'parser.ts';
    const workerPath = path.resolve(__dirname, workerFilename);

    // If running in development via ts-node, register ts-node compiler inside the worker thread
    const workerOptions = !isProduction
      ? { execArgv: ['-r', 'ts-node/register'] }
      : {};

    const worker = new Worker(workerPath, workerOptions);

    // Send the telemetry payload to the worker
    worker.postMessage(payload);

    // Handle messages sent back from the worker
    worker.on('message', (response) => {
      worker.terminate(); // Clean up worker resources immediately after processing
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error));
      }
    });

    // Handle worker execution errors
    worker.on('error', (error) => {
      worker.terminate();
      reject(error);
    });

    // Handle worker unexpected termination
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker thread exited abnormally with code: ${code}`));
      }
    });
  });
}
