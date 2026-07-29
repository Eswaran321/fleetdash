import * as turf from '@turf/turf';
import { BreachAlert, BreachType, GeofenceZone } from '../types/breachAlert';
import logger from '../utils/logger';

const DEPOT_LAT = 12.9716;
const DEPOT_LNG = 77.5946;

const defaultZones: GeofenceZone[] = [
  {
    geofenceId: 'zone-depot',
    name: 'Central Depot',
    type: 'circle',
    center: { lat: DEPOT_LAT, lng: DEPOT_LNG },
    radius: 1.5,
    status: 'active',
  },
  {
    geofenceId: 'zone-bangalore',
    name: 'Bangalore Operational Area',
    type: 'polygon',
    coordinates: [
      { lat: 12.8000, lng: 77.4000 },
      { lat: 12.8000, lng: 77.8000 },
      { lat: 13.1000, lng: 77.8000 },
      { lat: 13.1000, lng: 77.4000 },
    ],
    status: 'active',
  },
  {
    geofenceId: 'zone-north-corridor',
    name: 'North Corridor',
    type: 'circle',
    center: { lat: 13.0200, lng: 77.6200 },
    radius: 2.0,
    status: 'active',
  },
];

export class GeofenceService {
  private zones: GeofenceZone[];
  private allZones: GeofenceZone[];
  private previousState: Map<string, Map<string, boolean>> = new Map();
  private breachHistory: BreachAlert[] = [];
  private static readonly MAX_BREACH_HISTORY = 500;

  constructor(zones: GeofenceZone[] = defaultZones) {
    this.allZones = zones;
    this.zones = zones.filter((z) => z.status === 'active');
    logger.info(`GeofenceService initialized with ${this.zones.length} active zones`);
  }

  getZones(): GeofenceZone[] {
    return this.allZones;
  }

  getBreachHistory(limit: number = 100): BreachAlert[] {
    return this.breachHistory.slice(0, limit);
  }

  private wasInside(vehicleId: string, zoneId: string): boolean {
    return this.previousState.get(vehicleId)?.get(zoneId) ?? false;
  }

  private setInside(vehicleId: string, zoneId: string, inside: boolean): void {
    if (!this.previousState.has(vehicleId)) {
      this.previousState.set(vehicleId, new Map());
    }
    this.previousState.get(vehicleId)!.set(zoneId, inside);
  }

  private pointInZone(lat: number, lng: number, zone: GeofenceZone): boolean {
    const pt = turf.point([lng, lat]);

    if (zone.type === 'circle' && zone.center && zone.radius !== undefined) {
      const center = turf.point([zone.center.lng, zone.center.lat]);
      const dist = turf.distance(pt, center, { units: 'kilometers' });
      return dist <= zone.radius;
    }

    if (zone.type === 'polygon' && zone.coordinates && zone.coordinates.length >= 3) {
      const coords = zone.coordinates.map((c) => [c.lng, c.lat]);
      coords.push(coords[0]);
      const polygon = turf.polygon([coords]);
      return turf.booleanPointInPolygon(pt, polygon);
    }

    return false;
  }

  checkPoint(vehicleId: string, lat: number, lng: number, speed: number): BreachAlert[] {
    const alerts: BreachAlert[] = [];
    const now = new Date().toISOString();
    let alertIdCounter = 0;

    for (const zone of this.zones) {
      const isInside = this.pointInZone(lat, lng, zone);
      const wasInside = this.wasInside(vehicleId, zone.geofenceId);

      if (isInside && !wasInside) {
        alertIdCounter++;
        alerts.push({
          alertId: `br-${Date.now()}-${alertIdCounter}`,
          vehicleId,
          geofenceId: zone.geofenceId,
          geofenceName: zone.name,
          breachType: 'entry',
          severity: zone.geofenceId === 'zone-depot' ? 'info' : 'warning',
          timestamp: now,
          vehicleLat: lat,
          vehicleLng: lng,
          vehicleSpeed: speed,
          distanceToBoundary: 0,
          description: `Vehicle ${vehicleId} entered ${zone.name}`,
        });
      } else if (!isInside && wasInside) {
        alertIdCounter++;
        alerts.push({
          alertId: `br-${Date.now()}-${alertIdCounter}`,
          vehicleId,
          geofenceId: zone.geofenceId,
          geofenceName: zone.name,
          breachType: 'exit',
          severity: 'info',
          timestamp: now,
          vehicleLat: lat,
          vehicleLng: lng,
          vehicleSpeed: speed,
          distanceToBoundary: 0,
          description: `Vehicle ${vehicleId} exited ${zone.name}`,
        });
      }

      this.setInside(vehicleId, zone.geofenceId, isInside);
    }

    if (alerts.length > 0) {
      this.breachHistory = [...alerts, ...this.breachHistory].slice(0, GeofenceService.MAX_BREACH_HISTORY);
    }

    return alerts;
  }
}

export const geofenceService = new GeofenceService();
