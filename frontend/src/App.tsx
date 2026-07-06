import React, { useEffect, useState } from 'react';
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
import { Vehicle, TelemetryPoint } from './types';
import { Truck, Navigation, Gauge, Zap } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const App: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  // Reference for socket connection
  const [socket, setSocket] = useState<Socket | null>(null);

  // 1. Initial Load of vehicle lists
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const res = await apiService.getVehicles();
        if (res.success) {
          setVehicles(res.data);
          // Auto-select first vehicle if available
          if (res.data.length > 0) {
            setSelectedVehicleId(res.data[0].vehicleId);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to establish API connection to server.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // 2. Fetch history when vehicle selection changes
  useEffect(() => {
    if (!selectedVehicleId) return;

    const loadHistory = async () => {
      try {
        const res = await apiService.getVehicleTelemetry(selectedVehicleId, 2); // get last 2 hours of telemetry
        if (res.success) {
          setTelemetryHistory(res.data);
        }
      } catch (err: any) {
        console.error(`Error loading history for ${selectedVehicleId}:`, err);
      }
    };

    loadHistory();
  }, [selectedVehicleId]);

  // 3. Connect Socket.io for live updates
  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => {
      setSocketConnected(true);
      setError(null); // Clear connection errors
    });

    s.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Listen for global telemetry pings to update list status and cached speed in sidebar
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

    return () => {
      s.disconnect();
    };
  }, []);

  // 4. Bind socket listener for the active vehicle's telemetry stream to append history points
  useEffect(() => {
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

    return () => {
      socket.off(channelName, handleLivePoint);
    };
  }, [socket, selectedVehicleId]);

  // Compute stats metrics dynamically
  const totalVehiclesCount = vehicles.length;
  const activeVehiclesCount = vehicles.filter((v) => v.status === 'active').length;
  const avgSpeed = activeVehiclesCount > 0
    ? Math.round(vehicles.filter((v) => v.status === 'active').reduce((acc, v) => acc + (v.lastSpeed || 0), 0) / activeVehiclesCount)
    : 0;

  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId) || null;

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', backgroundColor: '#060913', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loading />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar socketConnected={socketConnected} totalVehicles={totalVehiclesCount} />
      <Sidebar />

      <main className="main-content">
        {error && <ErrorAlert message={error} />}

        {/* Dashboard KPIs Grid */}
        <section className="stats-grid">
          <StatsCard 
            label="Total Fleet Vehicles" 
            value={totalVehiclesCount} 
            icon={<Truck size={22} />} 
            accentColor="#818cf8"
          />
          <StatsCard 
            label="Vehicles Online" 
            value={activeVehiclesCount} 
            icon={<Zap size={22} />} 
            accentColor="#10b981"
          />
          <StatsCard 
            label="Avg Speed (Active)" 
            value={`${avgSpeed} km/h`} 
            icon={<Gauge size={22} />} 
            accentColor="#38bdf8"
          />
          <StatsCard 
            label="Telemetry Streams" 
            value={telemetryHistory.length} 
            icon={<Navigation size={22} />} 
            accentColor="#f59e0b"
          />
        </section>

        {/* Main interactive split area */}
        <section className="dashboard-body">
          <MapPlaceholder 
            allVehicles={vehicles} 
            selectedVehicle={selectedVehicle} 
            telemetryHistory={telemetryHistory} 
          />
          <VehicleListPanel 
            vehicles={vehicles} 
            selectedVehicleId={selectedVehicleId} 
            onSelectVehicle={setSelectedVehicleId} 
          />
        </section>
      </main>
    </div>
  );
};

export default App;
