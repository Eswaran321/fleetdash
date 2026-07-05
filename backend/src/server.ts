import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { initRedis } from './config/redis';
import { startTelemetryBroadcast } from './services/telemetryBroadcast';
import logger from './utils/logger';

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping the Express app.
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration matching the React frontend.
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from any host in development.
    methods: ['GET', 'POST'],
  },
});

// Set the socket instance on the Express app for controller fallback (when Redis is unavailable).
app.set('io', io);

// Handle WebSockets connection lifecycle events.
io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Bootstrap server dependencies.
const bootstrap = async () => {
  try {
    // 1. Connect database
    await connectDB();

    // 2. Attempt Redis connection (non-fatal if unavailable)
    await initRedis();

    // 3. Start Redis subscriber → Socket.io bridge (no-op if Redis unavailable)
    startTelemetryBroadcast(io);

    // 4. Start listening for network traffic
    server.listen(PORT, () => {
      logger.info(`===================================================`);
      logger.info(` FleetDash Server is active on port ${PORT}`);
      logger.info(` Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`===================================================`);
    });
  } catch (error: any) {
    logger.error(`Bootstrap crash: ${error.message}`);
    process.exit(1);
  }
};

bootstrap();
