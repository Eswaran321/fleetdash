import mongoose from 'mongoose';
import logger from '../utils/logger';

let mongoMemoryServer: any = null;

/**
 * Establish a connection to the MongoDB Database using credentials from environment variables,
 * or boots an in-memory Mongo server if USE_IN_MEMORY_DB is set to true.
 */
export const connectDB = async (): Promise<void> => {
  let mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fleetdash';

  if (process.env.USE_IN_MEMORY_DB === 'true') {
    try {
      logger.info('Initializing In-Memory MongoDB Server (Zero Setup)...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      mongoURI = mongoMemoryServer.getUri();
      logger.info(`In-Memory MongoDB Server is active at: ${mongoURI}`);
    } catch (err: any) {
      logger.error(`Could not start In-Memory MongoDB: ${err.message}. Falling back to default URI.`);
    }
  }

  try {
    logger.info(`Attempting database connection to: ${mongoURI}`);
    await mongoose.connect(mongoURI, {
      autoIndex: true, // Auto-build indexes in development; ideal for schemas with custom compound keys.
    });
    logger.info('Successfully connected to MongoDB Database.');
  } catch (error: any) {
    logger.error(`Database connection failure: ${error.message}`);
    process.exit(1); // Stop execution immediately since database connectivity is a hard requirement.
  }
};

// Monitor mongoose state changes.
mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose default connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Mongoose connection error: ${err.message}`);
});
