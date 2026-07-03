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
