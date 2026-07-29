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

export const BREACH_ALERT_CHANNEL = 'geofence:breach';
