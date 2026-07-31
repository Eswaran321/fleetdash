import { GeofenceService } from '../src/services/geofenceService';
import { GeofenceZone } from '../src/types/breachAlert';

// Depot center coordinates (from geofenceService)
const DEPOT_LAT = 12.9716;
const DEPOT_LNG = 77.5946;

// North corridor center (13.0200, 77.6200), radius 2.0 km
const NORTH_LAT = 13.0200;
const NORTH_LNG = 77.6200;

describe('GeofenceService', () => {
  let service: GeofenceService;

  beforeEach(() => {
    service = new GeofenceService();
  });

  describe('getZones', () => {
    it('returns all configured zones', () => {
      const zones = service.getZones();
      expect(zones).toHaveLength(3);
      expect(zones.map((z) => z.geofenceId)).toEqual([
        'zone-depot',
        'zone-bangalore',
        'zone-north-corridor',
      ]);
    });

    it('excludes inactive zones from breach checks', () => {
      const zones: GeofenceZone[] = [
        {
          geofenceId: 'zone-a',
          name: 'A',
          type: 'circle',
          center: { lat: 0, lng: 0 },
          radius: 1,
          status: 'active',
        },
        {
          geofenceId: 'zone-b',
          name: 'B',
          type: 'circle',
          center: { lat: 0, lng: 0 },
          radius: 1,
          status: 'inactive',
        },
      ];
      const svc = new GeofenceService(zones);
      // Point at center of both zones — only active zone-A alerts
      const alerts = svc.checkPoint('v1', 0, 0, 40);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].geofenceId).toBe('zone-a');
    });
  });

  describe('circle zones', () => {
    it('fires an entry alert when a vehicle enters the depot zone', () => {
      // Depot center with radius 1.5km — a point ~0.5km away is inside
      const alerts = service.checkPoint('V-001', DEPOT_LAT + 0.004, DEPOT_LNG, 30);
      const depotAlerts = alerts.filter((a) => a.geofenceId === 'zone-depot');
      expect(depotAlerts).toHaveLength(1);
      expect(depotAlerts[0].breachType).toBe('entry');
      expect(depotAlerts[0].vehicleId).toBe('V-001');
      expect(depotAlerts[0].geofenceName).toBe('Central Depot');
      expect(depotAlerts[0].severity).toBe('info');
      expect(depotAlerts[0].vehicleSpeed).toBe(30);
    });

    it('fires an exit alert when a vehicle leaves the depot zone', () => {
      service.checkPoint('V-001', DEPOT_LAT, DEPOT_LNG, 10); // inside
      // Move far away (outside radius)
      const alerts = service.checkPoint('V-001', DEPOT_LAT + 0.05, DEPOT_LNG, 20);
      const depotAlerts = alerts.filter((a) => a.geofenceId === 'zone-depot');
      expect(depotAlerts).toHaveLength(1);
      expect(depotAlerts[0].breachType).toBe('exit');
    });

    it('does not alert when a vehicle stays inside the zone', () => {
      service.checkPoint('V-001', DEPOT_LAT, DEPOT_LNG, 10);
      const alerts = service.checkPoint('V-001', DEPOT_LAT + 0.001, DEPOT_LNG, 10);
      const depotAlerts = alerts.filter((a) => a.geofenceId === 'zone-depot');
      expect(depotAlerts).toHaveLength(0);
    });

    it('does not alert when a vehicle stays outside the zone', () => {
      const alerts = service.checkPoint('V-001', DEPOT_LAT + 0.1, DEPOT_LNG, 40);
      const depotAlerts = alerts.filter((a) => a.geofenceId === 'zone-depot');
      expect(depotAlerts).toHaveLength(0);
    });

    it('assigns warning severity for non-depot zone entries', () => {
      const alerts = service.checkPoint('V-002', NORTH_LAT, NORTH_LNG, 50);
      const northAlerts = alerts.filter((a) => a.geofenceId === 'zone-north-corridor');
      expect(northAlerts).toHaveLength(1);
      expect(northAlerts[0].severity).toBe('warning');
    });
  });

  describe('polygon zones', () => {
    it('detects entry into the Bangalore operational polygon', () => {
      // Coordinates inside the Bangalore bounding polygon (12.9, 77.5)
      const alerts = service.checkPoint('V-003', 12.9, 77.5, 60);
      const bangaloreAlerts = alerts.filter((a) => a.geofenceId === 'zone-bangalore');
      expect(bangaloreAlerts).toHaveLength(1);
      expect(bangaloreAlerts[0].breachType).toBe('entry');
    });

    it('does not alert for points outside the polygon', () => {
      // Far outside Bangalore polygon (e.g., lat 14.0)
      const alerts = service.checkPoint('V-003', 14.0, 77.5, 60);
      const bangaloreAlerts = alerts.filter((a) => a.geofenceId === 'zone-bangalore');
      expect(bangaloreAlerts).toHaveLength(0);
    });
  });

  describe('breach history', () => {
    it('records breaches in history in reverse chronological order', () => {
      service.checkPoint('V-001', DEPOT_LAT, DEPOT_LNG, 10);
      service.checkPoint('V-002', DEPOT_LAT, DEPOT_LNG, 10);
      const history = service.getBreachHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
      // Most recent first
      expect(history[0].vehicleId).toBe('V-002');
    });

    it('respects the limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        service.checkPoint(`V-${i}`, DEPOT_LAT, DEPOT_LNG, 10);
      }
      const limited = service.getBreachHistory(3);
      expect(limited).toHaveLength(3);
    });

    it('caps history at 500 entries', () => {
      for (let i = 0; i < 600; i++) {
        service.checkPoint(`V-${i}`, DEPOT_LAT, DEPOT_LNG, 10);
      }
      const history = service.getBreachHistory(1000);
      expect(history.length).toBeLessThanOrEqual(500);
    });

    it('returns empty history when no breaches occurred', () => {
      expect(service.getBreachHistory()).toHaveLength(0);
    });
  });

  describe('per-vehicle state isolation', () => {
    it('tracks inside/outside state independently per vehicle', () => {
      // V-A enters depot
      service.checkPoint('V-A', DEPOT_LAT, DEPOT_LNG, 10);
      // V-B never entered; placing it at depot should still be an entry for V-B
      const alerts = service.checkPoint('V-B', DEPOT_LAT, DEPOT_LNG, 10);
      const depotAlerts = alerts.filter((a) => a.geofenceId === 'zone-depot');
      expect(depotAlerts).toHaveLength(1);
      expect(depotAlerts[0].vehicleId).toBe('V-B');
      expect(depotAlerts[0].breachType).toBe('entry');
    });
  });
});
