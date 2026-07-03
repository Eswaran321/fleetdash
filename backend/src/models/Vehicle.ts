import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle extends Document {
  vehicleId: string;
  name: string;
  licensePlate: string;
  type: 'truck' | 'car' | 'van' | 'motorcycle';
  status: 'active' | 'maintenance' | 'offline';
  lastActive: Date;
  lastLocation?: {
    lat: number;
    lng: number;
  };
  lastSpeed?: number;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema: Schema = new Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    licensePlate: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['truck', 'car', 'van', 'motorcycle'],
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'maintenance', 'offline'],
      default: 'offline',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    lastSpeed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields.
  }
);

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
