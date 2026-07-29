import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, MapPin, Gauge, Fuel, Thermometer, Clock, ChevronRight } from 'lucide-react';
import { apiService } from '../services/api';
import { Vehicle, TelemetryPoint } from '../types';
import Loading from '../components/Loading';
import ErrorAlert from '../components/ErrorAlert';

const statusColor = (status: string) => {
  switch (status) {
    case 'active': return 'var(--success)';
    case 'maintenance': return 'var(--warning)';
    default: return 'var(--text-muted)';
  };
};

export const VehiclesPage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'maintenance' | 'offline'>('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiService.getVehicles();
        if (res.success) setVehicles(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (vehicleId) {
      const v = vehicles.find((vh) => vh.vehicleId === vehicleId) || null;
      setSelectedVehicle(v);
    } else {
      setSelectedVehicle(null);
    }
  }, [vehicleId, vehicles]);

  useEffect(() => {
    if (!vehicleId) return;
    const loadHistory = async () => {
      try {
        const res = await apiService.getVehicleTelemetry(vehicleId, 6);
        if (res.success) setHistory(res.data);
      } catch { setHistory([]); }
    };
    loadHistory();
  }, [vehicleId]);

  if (loading) return <Loading />;

  const filtered = vehicles.filter((v) => {
    const matchSearch = search === '' || v.name.toLowerCase().includes(search.toLowerCase()) || v.licensePlate.toLowerCase().includes(search.toLowerCase()) || v.vehicleId.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || v.status === filter;
    return matchSearch && matchFilter;
  });

  // Detail view
  if (selectedVehicle && vehicleId) {
    const latest = history.length > 0 ? history[history.length - 1] : null;
    return (
      <div className="page-container">
        <button className="back-btn" onClick={() => navigate('/vehicles')}>
          <ArrowLeft size={16} />
          <span>Back to Vehicles</span>
        </button>

        <div className="detail-header">
          <div className="detail-title">
            <Truck size={28} color={statusColor(selectedVehicle.status)} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.6rem', fontWeight: 700 }}>{selectedVehicle.name}</h1>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{selectedVehicle.vehicleId}</span>
            </div>
          </div>
          <span className={`status-badge ${selectedVehicle.status}`}>{selectedVehicle.status}</span>
        </div>

        <div className="stats-grid">
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <span className="stat-label">License Plate</span>
              <span className="stat-value" style={{ fontSize: '1.3rem' }}>{selectedVehicle.licensePlate}</span>
            </div>
            <div className="stat-icon-wrapper"><Truck size={20} /></div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <span className="stat-label">Vehicle Type</span>
              <span className="stat-value" style={{ fontSize: '1.3rem', textTransform: 'capitalize' }}>{selectedVehicle.type}</span>
            </div>
            <div className="stat-icon-wrapper"><Gauge size={20} /></div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <span className="stat-label">Current Speed</span>
              <span className="stat-value" style={{ fontSize: '1.3rem' }}>{latest ? `${latest.speed} km/h` : 'N/A'}</span>
            </div>
            <div className="stat-icon-wrapper"><Gauge size={20} /></div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <span className="stat-label">Fuel Level</span>
              <span className="stat-value" style={{ fontSize: '1.3rem' }}>{latest ? `${latest.fuel}%` : 'N/A'}</span>
            </div>
            <div className="stat-icon-wrapper"><Fuel size={20} /></div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <span className="stat-label">Engine Temp</span>
              <span className="stat-value" style={{ fontSize: '1.3rem' }}>{latest ? `${latest.engineTemp}°C` : 'N/A'}</span>
            </div>
            <div className="stat-icon-wrapper"><Thermometer size={20} /></div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <span className="stat-label">Last Active</span>
              <span className="stat-value" style={{ fontSize: '1rem' }}>{new Date(selectedVehicle.lastActive).toLocaleString()}</span>
            </div>
            <div className="stat-icon-wrapper"><Clock size={20} /></div>
          </div>
        </div>

        {selectedVehicle.lastLocation && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="var(--primary-accent)" /> Last Known Position
            </h3>
            <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Lat: <strong style={{ color: 'var(--text-main)' }}>{selectedVehicle.lastLocation.lat.toFixed(6)}</strong></span>
              <span>Lng: <strong style={{ color: 'var(--text-main)' }}>{selectedVehicle.lastLocation.lng.toFixed(6)}</strong></span>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', marginBottom: '12px' }}>
              Telemetry History (last {history.length} pings)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Time</th>
                    <th style={{ padding: '8px 12px' }}>Speed</th>
                    <th style={{ padding: '8px 12px' }}>Fuel</th>
                    <th style={{ padding: '8px 12px' }}>Engine Temp</th>
                    <th style={{ padding: '8px 12px' }}>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice().reverse().slice(0, 20).map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{new Date(p.timestamp).toLocaleTimeString()}</td>
                      <td style={{ padding: '8px 12px' }}>{p.speed} km/h</td>
                      <td style={{ padding: '8px 12px' }}>{p.fuel}%</td>
                      <td style={{ padding: '8px 12px' }}>{p.engineTemp}°C</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.6rem', fontWeight: 700 }}>
          <Truck size={22} style={{ verticalAlign: 'middle', marginRight: '10px', color: 'var(--primary-accent)' }} />
          Fleet Vehicles
        </h1>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{filtered.length} vehicles</span>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="filters-bar">
        <input
          className="search-input"
          placeholder="Search by name, plate, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        {(['all', 'active', 'maintenance', 'offline'] as const).map((f) => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="vehicle-grid">
        {filtered.map((v) => (
          <div
            key={v.vehicleId}
            className="glass-panel vehicle-card"
            onClick={() => navigate(`/vehicles/${v.vehicleId}`)}
          >
            <div className="vehicle-card-header">
              <Truck size={20} color={statusColor(v.status)} />
              <span className={`status-badge ${v.status}`}>{v.status}</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.1rem', fontWeight: 600 }}>{v.name}</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '10px' }}>{v.vehicleId}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>Plate: <strong>{v.licensePlate}</strong></div>
              <div>Type: <span style={{ textTransform: 'capitalize' }}>{v.type}</span></div>
              {v.lastSpeed !== undefined && <div>Speed: <strong style={{ color: 'var(--primary-accent)' }}>{v.lastSpeed} km/h</strong></div>}
            </div>
            <div className="vehicle-card-footer">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {new Date(v.lastActive).toLocaleTimeString()}
              </span>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No vehicles match your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default VehiclesPage;
