import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import telemetryRoutes from './routes/telemetryRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import geofenceRoutes from './routes/geofenceRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables.
dotenv.config();

const app = express();

// Enable Cross-Origin Resource Sharing.
app.use(cors());

// Parse incoming requests with JSON payloads.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check endpoint.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'fleetdash-backend',
  });
});

// Bind API route namespaces.
app.use('/telemetry', telemetryRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/geofences', geofenceRoutes);
app.use('/analytics', analyticsRoutes);

// Catch-all route for unhandled resources.
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Resource not found: ${req.method} ${req.path}`,
    },
  });
});

// Centralized error handling middleware (must be registered last).
app.use(errorHandler);

export default app;
