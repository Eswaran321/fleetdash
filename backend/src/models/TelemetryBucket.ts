import mongoose, { Schema, Document } from 'mongoose';

export interface ITelemetryReading {
  timestamp: Date;
  lat: number;
  lng: number;
  speed: number;
  fuel: number;
  engineTemp: number;
}

export interface ITelemetryBucket extends Document {
  vehicleId: string;
  bucketStart: Date;
  count: number;
  telemetry: ITelemetryReading[];
}

const TelemetryReadingSchema = new Schema(
  {
    timestamp: {
      type: Date,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,
      required: true,
      min: 0,
    },
    fuel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    engineTemp: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false, // Prevents creation of internal _ids for each subdocument, reducing BSON document bloat.
  }
);

const TelemetryBucketSchema = new Schema(
  {
    vehicleId: {
      type: String,
      required: true,
    },
    bucketStart: {
      type: Date,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
    },
    telemetry: [TelemetryReadingSchema],
  },
  {
    collection: 'telemetry_buckets',
  }
);

// Compound index for querying specific vehicle telemetry history over time windows.
TelemetryBucketSchema.index({ vehicleId: 1, bucketStart: -1 });

// TTL index to automatically remove buckets older than 72 hours.
TelemetryBucketSchema.index({ bucketStart: 1 }, { expireAfterSeconds: 259200 });

export default mongoose.model<ITelemetryBucket>('TelemetryBucket', TelemetryBucketSchema);
