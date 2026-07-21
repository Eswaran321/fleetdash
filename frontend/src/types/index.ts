export interface Vehicle {
  _id: string;
  vehicleId: string;
  name: string;
  licensePlate: string;
  type: 'truck' | 'car' | 'van' | 'motorcycle';
  status: 'active' | 'maintenance' | 'offline';
  lastActive: string;
  lastLocation?: {
    lat: number;
    lng: number;
  };
  lastSpeed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryPoint {
  timestamp: string;
  lat: number;
  lng: number;
  speed: number;
  fuel: number;
  engineTemp: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  pointsCount?: number;
}

export type BreachType = 'entry' | 'exit';
export type Severity = 'info' | 'warning' | 'critical';

export interface BreachAlert {
  alertId: string;
  vehicleId: string;
  geofenceId: string;
  geofenceName: string;
  breachType: BreachType;
  severity: Severity;
  timestamp: string;
  vehicleLat: number;
  vehicleLng: number;
  vehicleSpeed: number;
  distanceToBoundary: number;
  description: string;
}

export interface GeofenceZone {
  geofenceId: string;
  name: string;
  type: 'circle' | 'polygon';
  center?: { lat: number; lng: number };
  radius?: number;
  coordinates?: { lat: number; lng: number }[];
  status: 'active' | 'inactive';
}
