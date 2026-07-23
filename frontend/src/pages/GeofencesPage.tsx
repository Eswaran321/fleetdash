import React, { useState } from 'react';
import { Compass, ArrowLeft, MapPin, ShieldCheck, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { GeofenceZone, BreachAlert } from '../types';

const severityColor = (s: string) => {
  switch (s) {
    case 'critical': return '#ef4444';
    case 'warning': return '#f59e0b';
    default: return '#38bdf8';
  };
};

const breachTypeIcon = (type: string) => {
  return type === 'entry' ? <MapPin size={14} color="#10b981" /> : <MapPin size={14} color="#f59e0b" />;
};

interface Props {
  zones: GeofenceZone[];
  breachHistory: BreachAlert[];
}

export const GeofencesPage: React.FC<Props> = ({ zones, breachHistory }) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [filterBreach, setFilterBreach] = useState<'all' | 'entry' | 'exit'>('all');

  const activeZones = zones.filter((z) => z.status === 'active');
  const zone = zones.find((z) => z.geofenceId === selectedZone) || null;
  const zoneBreaches = breachHistory.filter(
    (b) => b.geofenceId === selectedZone && (filterBreach === 'all' || b.breachType === filterBreach)
  );

  // Detail view
  if (zone) {
    return (
      <div className="page-container">
        <button className="back-btn" onClick={() => setSelectedZone(null)}>
          <ArrowLeft size={16} />
          <span>Back to Geofences</span>
        </button>

        <div className="detail-header">
          <div className="detail-title">
            <Compass size={28} color="var(--primary-accent)" />
            <div>
              <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.6rem', fontWeight: 700 }}>{zone.name}</h1>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{zone.geofenceId}</span>
            </div>
          </div>
          <span className={`status-badge ${zone.status}`}>{zone.status}</span>
        </div>

        <div className="stats-grid">
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <span className="stat-label">Zone Type</span>
              <span className="stat-value" style={{ fontSize: '1.3rem', textTransform: 'capitalize' }}>{zone.type}</span>
            </div>
            <div className="stat-icon-wrapper"><ShieldCheck size={20} /></div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <span className="stat-label">Total Breaches</span>
              <span className="stat-value" style={{ fontSize: '1.3rem' }}>{breachHistory.filter((b) => b.geofenceId === zone.geofenceId).length}</span>
            </div>
            <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <span className="stat-label">Entries</span>
              <span className="stat-value" style={{ fontSize: '1.3rem', color: 'var(--success)' }}>{breachHistory.filter((b) => b.geofenceId === zone.geofenceId && b.breachType === 'entry').length}</span>
            </div>
            <div className="stat-icon-wrapper"><MapPin size={20} /></div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-info">
              <span className="stat-label">Exits</span>
              <span className="stat-value" style={{ fontSize: '1.3rem', color: 'var(--warning)' }}>{breachHistory.filter((b) => b.geofenceId === zone.geofenceId && b.breachType === 'exit').length}</span>
            </div>
            <div className="stat-icon-wrapper"><MapPin size={20} /></div>
          </div>
        </div>

        {zone.type === 'circle' && zone.center && zone.radius !== undefined && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={16} color="var(--primary-accent)" /> Circle Boundaries
            </h3>
            <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Center Lat: <strong style={{ color: 'var(--text-main)' }}>{zone.center.lat.toFixed(4)}</strong></span>
              <span>Center Lng: <strong style={{ color: 'var(--text-main)' }}>{zone.center.lng.toFixed(4)}</strong></span>
              <span>Radius: <strong style={{ color: 'var(--text-main)' }}>{zone.radius} km</strong></span>
            </div>
          </div>
        )}

        {zone.type === 'polygon' && zone.coordinates && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={16} color="var(--primary-accent)" /> Polygon Vertices
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {zone.coordinates.map((c, i) => (
                <span key={i} style={{ fontSize: '0.8rem', fontFamily: 'monospace', background: 'rgba(56,189,248,0.08)', padding: '4px 10px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                  ({c.lat.toFixed(4)}, {c.lng.toFixed(4)})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Breach History */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.1rem', fontWeight: 600 }}>Breach History</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'entry', 'exit'] as const).map((f) => (
              <button key={f} className={`filter-chip ${filterBreach === f ? 'active' : ''}`} onClick={() => setFilterBreach(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {zoneBreaches.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Time</th>
                  <th style={{ padding: '8px 12px' }}>Vehicle</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Severity</th>
                  <th style={{ padding: '8px 12px' }}>Speed</th>
                  <th style={{ padding: '8px 12px' }}>Position</th>
                </tr>
              </thead>
              <tbody>
                {zoneBreaches.map((b) => (
                  <tr key={b.alertId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{new Date(b.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>{b.vehicleId}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', background: b.breachType === 'entry' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: b.breachType === 'entry' ? '#10b981' : '#f59e0b' }}>
                        {breachTypeIcon(b.breachType)} {b.breachType}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ color: severityColor(b.severity), fontWeight: 600, textTransform: 'capitalize' }}>{b.severity}</span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>{b.vehicleSpeed} km/h</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{b.vehicleLat.toFixed(4)}, {b.vehicleLng.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Clock size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <div>No breach events recorded for this zone.</div>
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
          <Compass size={22} style={{ verticalAlign: 'middle', marginRight: '10px', color: 'var(--primary-accent)' }} />
          Geofences
        </h1>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{activeZones.length} active zones</span>
      </div>

      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Breach Events</span>
            <span className="stat-value">{breachHistory.length}</span>
          </div>
          <div className="stat-icon-wrapper"><AlertTriangle size={22} /></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Active Zones</span>
            <span className="stat-value">{activeZones.length}</span>
          </div>
          <div className="stat-icon-wrapper"><ShieldCheck size={22} /></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Recent Entries</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>{breachHistory.filter((b) => b.breachType === 'entry').length}</span>
          </div>
          <div className="stat-icon-wrapper"><MapPin size={22} /></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Recent Exits</span>
            <span className="stat-value" style={{ color: 'var(--warning)' }}>{breachHistory.filter((b) => b.breachType === 'exit').length}</span>
          </div>
          <div className="stat-icon-wrapper"><MapPin size={22} /></div>
        </div>
      </div>

      <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.1rem', fontWeight: 600 }}>Zone Definitions</h3>

      <div className="vehicle-grid">
        {zones.map((z) => {
          const zoneBreachCount = breachHistory.filter((b) => b.geofenceId === z.geofenceId).length;
          return (
            <div key={z.geofenceId} className="glass-panel vehicle-card" onClick={() => setSelectedZone(z.geofenceId)}>
              <div className="vehicle-card-header">
                <Compass size={20} color={z.status === 'active' ? 'var(--success)' : 'var(--text-muted)'} />
                <span className={`status-badge ${z.status}`}>{z.status}</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.1rem', fontWeight: 600 }}>{z.name}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '10px' }}>{z.geofenceId}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div>Type: <strong style={{ textTransform: 'capitalize' }}>{z.type}</strong></div>
                {z.type === 'circle' && z.radius !== undefined && <div>Radius: <strong>{z.radius} km</strong></div>}
                {z.type === 'polygon' && z.coordinates && <div>Vertices: <strong>{z.coordinates.length}</strong></div>}
                <div>Breaches: <strong style={{ color: zoneBreachCount > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>{zoneBreachCount}</strong></div>
              </div>
              <div className="vehicle-card-footer">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {z.type === 'circle' && z.center ? `${z.center.lat.toFixed(2)}, ${z.center.lng.toFixed(2)}` : `${z.coordinates?.length} pts`}
                </span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Breach Log */}
      {breachHistory.length > 0 && (
        <>
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.1rem', fontWeight: 600, marginTop: '10px' }}>Recent Breach Activity</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Time</th>
                  <th style={{ padding: '8px 12px' }}>Vehicle</th>
                  <th style={{ padding: '8px 12px' }}>Zone</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Severity</th>
                  <th style={{ padding: '8px 12px' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {breachHistory.slice(0, 20).map((b) => (
                  <tr key={b.alertId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{new Date(b.timestamp).toLocaleTimeString()}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>{b.vehicleId}</td>
                    <td style={{ padding: '8px 12px' }}>{b.geofenceName}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', background: b.breachType === 'entry' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: b.breachType === 'entry' ? '#10b981' : '#f59e0b' }}>
                        {b.breachType}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: severityColor(b.severity), fontWeight: 600, textTransform: 'capitalize' }}>{b.severity}</td>
                    <td style={{ padding: '8px 12px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default GeofencesPage;
