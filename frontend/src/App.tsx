import React, { useEffect, useState, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import StatsCard from './components/StatsCard';
import MapPlaceholder from './components/MapPlaceholder';
import VehicleListPanel from './components/VehicleListPanel';
import Loading from './components/Loading';
import ErrorAlert from './components/ErrorAlert';
import { apiService } from './services/api';
import { decodeGlobalTelemetry, decodeVehicleTelemetry } from './services/binaryProtocol';
import { Vehicle, TelemetryPoint, BreachAlert, GeofenceZone } from './types';
import { Truck, Navigation, Gauge, Zap, MapPin } from 'lucide-react';
import VehiclesPage from './pages/VehiclesPage';
import GeofencesPage from './pages/GeofencesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const defaultGeofenceZones: GeofenceZone[] = [
  { geofenceId: 'zone-depot', name: 'Central Depot', type: 'circle', center: { lat: 12.9716, lng: 77.5946 }, radius: 1.5, status: 'active' },
  { geofenceId: 'zone-bangalore', name: 'Bangalore Operational Area', type: 'polygon', coordinates: [{ lat: 12.8000, lng: 77.4000 }, { lat: 12.8000, lng: 77.8000 }, { lat: 13.1000, lng: 77.8000 }, { lat: 13.1000, lng: 77.4000 }], status: 'active' },
  { geofenceId: 'zone-north-corridor', name: 'North Corridor', type: 'circle', center: { lat: 13.0200, lng: 77.6200 }, radius: 2.0, status: 'active' },
];

function loadSettings() {
  try {
    const raw = localStorage.getItem('fleetdash-settings');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { notifications: true, autoRefresh: true, refreshInterval: 30, mapFollow: true, alertSound: true, alertDuration: 6 };
}

// ---- Extracted Dashboard component (stable identity, no re-mount on parent state) ----
interface DashboardProps {
  loading: boolean;
  error: string | null;
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;
  telemetryHistory: TelemetryPoint[];
  breachAlerts: BreachAlert[];
  geofenceZones: GeofenceZone[];
  showNotifications: boolean;
}

const Dashboard: React.FC<DashboardProps> = React.memo(({
  loading, error, vehicles, selectedVehicleId, setSelectedVehicleId,
  telemetryHistory, breachAlerts, geofenceZones, showNotifications,
}) => {
  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', backgroundColor: 'var(--bg-main)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loading />
      </div>
    );
  }

  const totalVehiclesCount = vehicles.length;
  const activeVehiclesCount = vehicles.filter((v) => v.status === 'active').length;
  const avgSpeed = activeVehiclesCount > 0
    ? Math.round(vehicles.filter((v) => v.status === 'active').reduce((acc, v) => acc + (v.lastSpeed || 0), 0) / activeVehiclesCount)
    : 0;
  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId) || null;

  return (
    <>
      {error && <ErrorAlert message={error} />}

      {showNotifications && breachAlerts.length > 0 && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '380px' }}>
          {breachAlerts.map((alert) => (
            <div key={alert.alertId} className="glass-panel" style={{
              padding: '12px 16px',
              borderLeft: `3px solid ${alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f59e0b' : '#38bdf8'}`,
              fontSize: '0.8rem',
              animation: 'slideIn 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <MapPin size={14} color={alert.breachType === 'entry' ? '#10b981' : '#f59e0b'} />
                <strong style={{ color: 'var(--text-main)' }}>{alert.geofenceName}</strong>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: alert.breachType === 'entry' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: alert.breachType === 'entry' ? '#10b981' : '#f59e0b',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>{alert.breachType}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{alert.description}</div>
            </div>
          ))}
        </div>
      )}

      <section className="stats-grid">
        <StatsCard label="Total Fleet Vehicles" value={totalVehiclesCount} icon={<Truck size={22} />} accentColor="#818cf8" />
        <StatsCard label="Vehicles Online" value={activeVehiclesCount} icon={<Zap size={22} />} accentColor="#10b981" />
        <StatsCard label="Avg Speed (Active)" value={`${avgSpeed} km/h`} icon={<Gauge size={22} />} accentColor="#38bdf8" />
        <StatsCard label="Telemetry Streams" value={telemetryHistory.length} icon={<Navigation size={22} />} accentColor="#f59e0b" />
      </section>

      <section className="dashboard-body">
        <MapPlaceholder allVehicles={vehicles} selectedVehicle={selectedVehicle} telemetryHistory={telemetryHistory} geofenceZones={geofenceZones} />
        <VehicleListPanel vehicles={vehicles} selectedVehicleId={selectedVehicleId} onSelectVehicle={setSelectedVehicleId} />
      </section>
    </>
  );
});

// ---- 404 page ----
const NotFound: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
    <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '3rem', fontWeight: 800, color: 'var(--primary-accent)' }}>404</h1>
    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Page not found</p>
    <Link to="/" className="back-btn" style={{ textDecoration: 'none' }}>Back to Dashboard</Link>
  </div>
);

// ---- App ----
export const App: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [breachAlerts, setBreachAlerts] = useState<BreachAlert[]>([]);
  const [breachHistory, setBreachHistory] = useState<BreachAlert[]>([]);
  const [geofenceZones, setGeofenceZones] = useState<GeofenceZone[]>(defaultGeofenceZones);
  const [settings, setSettings] = useState(loadSettings);

  const socketRef = useRef<Socket | null>(null);
  const selectedVehicleIdRef = useRef(selectedVehicleId);
  selectedVehicleIdRef.current = selectedVehicleId;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Refresh settings from localStorage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSettings(loadSettings());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await apiService.getVehicles();
      if (res.success) {
        setVehicles(res.data);
        if (res.data.length > 0 && selectedVehicleIdRef.current === null) {
          setSelectedVehicleId(res.data[0].vehicleId);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to establish API connection to server.');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchVehicles();
      setLoading(false);
    };
    init();
  }, []);

  // Auto-refresh vehicles based on settings
  useEffect(() => {
    if (!settings.autoRefresh) return;
    const interval = setInterval(() => {
      fetchVehicles();
    }, settings.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval, fetchVehicles]);

  // Fetch geofence zones from backend
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await apiService.getGeofences();
        if (res.success && res.data.length > 0) setGeofenceZones(res.data);
      } catch { /* keep defaults */ }
    };
    fetchZones();
  }, []);

  // Fetch breach history from backend on mount
  useEffect(() => {
    const fetchBreaches = async () => {
      try {
        const res = await apiService.getBreachHistory(500);
        if (res.success && res.data.length > 0) setBreachHistory(res.data);
      } catch { /* empty is fine */ }
    };
    fetchBreaches();
  }, []);

  // Telemetry history for selected vehicle
  useEffect(() => {
    if (!selectedVehicleId) return;
    const loadHistory = async () => {
      try {
        const res = await apiService.getVehicleTelemetry(selectedVehicleId, 2);
        if (res.success) setTelemetryHistory(res.data);
      } catch (err: any) {
        console.error(`Error loading history for ${selectedVehicleId}:`, err);
      }
    };
    loadHistory();
  }, [selectedVehicleId]);

  // Socket.io connection
  useEffect(() => {
    const s = io(SOCKET_URL);
    socketRef.current = s;

    s.on('connect', () => setSocketConnected(true));
    s.on('disconnect', () => setSocketConnected(false));

    s.on('geofence:breach', (alert: BreachAlert) => {
      const current = settingsRef.current;
      if (current.notifications) {
        setBreachAlerts((prev) => [alert, ...prev].slice(0, 20));
        setTimeout(() => {
          setBreachAlerts((prev) => prev.filter((a) => a.alertId !== alert.alertId));
        }, current.alertDuration * 1000);
      }
      setBreachHistory((prev) => [alert, ...prev].slice(0, 500));
    });

    s.on('telemetry_global', (raw: ArrayBuffer | any) => {
      const data = raw instanceof ArrayBuffer ? decodeGlobalTelemetry(raw) : raw;
      if (!data.vehicleId) return;

      setVehicles((prev) => {
        const idx = prev.findIndex((v) => v.vehicleId === data.vehicleId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            lastActive: data.timestamp,
            lastLocation: { lat: data.lat, lng: data.lng },
            lastSpeed: data.speed,
            status: data.status,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              _id: `temp-${data.vehicleId}`,
              vehicleId: data.vehicleId,
              name: `Fleet Vehicle ${data.vehicleId}`,
              licensePlate: `FT-${data.vehicleId.toUpperCase().slice(-4)}`,
              type: 'truck',
              status: data.status,
              lastActive: data.timestamp,
              lastLocation: { lat: data.lat, lng: data.lng },
              lastSpeed: data.speed,
              createdAt: data.timestamp,
              updatedAt: data.timestamp,
            },
          ];
        }
      });
    });

    return () => { s.disconnect(); socketRef.current = null; };
  }, []);

  // Bind live telemetry for selected vehicle
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedVehicleId) return;

    const channelName = `telemetry:${selectedVehicleId}`;

    const handleLivePoint = (raw: ArrayBuffer | any) => {
      const point = raw instanceof ArrayBuffer ? decodeVehicleTelemetry(raw) : raw;
      if (!point.timestamp) return;

      setTelemetryHistory((prev) => {
        if (prev.some((p) => new Date(p.timestamp).getTime() === new Date(point.timestamp).getTime())) {
          return prev;
        }
        return [...prev, {
          timestamp: point.timestamp,
          lat: point.lat,
          lng: point.lng,
          speed: point.speed,
          fuel: point.fuel,
          engineTemp: point.engineTemp,
        }];
      });
    };

    socket.on(channelName, handleLivePoint);
    return () => { socket.off(channelName, handleLivePoint); };
  }, [selectedVehicleId]);

  const totalVehiclesCount = vehicles.length;

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar socketConnected={socketConnected} totalVehicles={totalVehiclesCount} />
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <Dashboard
                loading={loading}
                error={error}
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
                setSelectedVehicleId={setSelectedVehicleId}
                telemetryHistory={telemetryHistory}
                breachAlerts={breachAlerts}
                geofenceZones={geofenceZones}
                showNotifications={settings.notifications}
              />
            } />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/vehicles/:vehicleId" element={<VehiclesPage />} />
            <Route path="/geofences" element={<GeofencesPage zones={geofenceZones} breachHistory={breachHistory} />} />
            <Route path="/analytics" element={<AnalyticsPage vehicles={vehicles} breachHistory={breachHistory} telemetryHistory={telemetryHistory} />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
