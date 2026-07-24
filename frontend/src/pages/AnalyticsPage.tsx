import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Gauge, Truck, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { Vehicle, TelemetryPoint, BreachAlert } from '../types';

interface Props {
  vehicles: Vehicle[];
  breachHistory: BreachAlert[];
  telemetryHistory: TelemetryPoint[];
}

interface SpeedBucket {
  label: string;
  count: number;
  color: string;
}

interface StatusBucket {
  label: string;
  count: number;
  color: string;
}

export const AnalyticsPage: React.FC<Props> = ({ vehicles, breachHistory, telemetryHistory }) => {
  const metrics = useMemo(() => {
    const active = vehicles.filter((v) => v.status === 'active');
    const speeds = vehicles.map((v) => v.lastSpeed || 0).filter((s) => s > 0);
    const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0;

    const entries = breachHistory.filter((b) => b.breachType === 'entry');
    const exits = breachHistory.filter((b) => b.breachType === 'exit');
    const critical = breachHistory.filter((b) => b.severity === 'critical');
    const warnings = breachHistory.filter((b) => b.severity === 'warning');

    return { active, speeds, avgSpeed, maxSpeed, minSpeed, entries, exits, critical, warnings };
  }, [vehicles, breachHistory]);

  // Speed distribution buckets
  const speedBuckets = useMemo((): SpeedBucket[] => {
    const buckets: SpeedBucket[] = [
      { label: '0-20', count: 0, color: '#10b981' },
      { label: '21-40', count: 0, color: '#38bdf8' },
      { label: '41-60', count: 0, color: '#818cf8' },
      { label: '61-80', count: 0, color: '#f59e0b' },
      { label: '81+', count: 0, color: '#ef4444' },
    ];
    for (const s of metrics.speeds) {
      if (s <= 20) buckets[0].count++;
      else if (s <= 40) buckets[1].count++;
      else if (s <= 60) buckets[2].count++;
      else if (s <= 80) buckets[3].count++;
      else buckets[4].count++;
    }
    return buckets;
  }, [metrics.speeds]);

  const maxBucket = Math.max(...speedBuckets.map((b) => b.count), 1);

  // Status distribution
  const statusBuckets = useMemo((): StatusBucket[] => {
    return [
      { label: 'Active', count: vehicles.filter((v) => v.status === 'active').length, color: '#10b981' },
      { label: 'Maintenance', count: vehicles.filter((v) => v.status === 'maintenance').length, color: '#f59e0b' },
      { label: 'Offline', count: vehicles.filter((v) => v.status === 'offline').length, color: '#64748b' },
    ];
  }, [vehicles]);

  const maxStatus = Math.max(...statusBuckets.map((b) => b.count), 1);

  // Breach type distribution
  const breachBuckets = useMemo((): StatusBucket[] => {
    return [
      { label: 'Entry', count: metrics.entries.length, color: '#10b981' },
      { label: 'Exit', count: metrics.exits.length, color: '#f59e0b' },
      { label: 'Critical', count: metrics.critical.length, color: '#ef4444' },
      { label: 'Warning', count: metrics.warnings.length, color: '#818cf8' },
    ];
  }, [metrics]);

  const maxBreach = Math.max(...breachBuckets.map((b) => b.count), 1);

  // Breach events per zone
  const zoneBreachMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of breachHistory) {
      map[b.geofenceName] = (map[b.geofenceName] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [breachHistory]);

  const maxZoneBreaches = Math.max(...zoneBreachMap.map(([, c]) => c), 1);

  // Telemetry point speed timeline (last 50 points)
  const timelinePoints = useMemo(() => {
    return telemetryHistory.slice(-50);
  }, [telemetryHistory]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.6rem', fontWeight: 700 }}>
          <BarChart3 size={22} style={{ verticalAlign: 'middle', marginRight: '10px', color: 'var(--primary-accent)' }} />
          Analytics
        </h1>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fleet performance overview</span>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Fleet Size</span>
            <span className="stat-value">{vehicles.length}</span>
          </div>
          <div className="stat-icon-wrapper"><Truck size={22} /></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Online Rate</span>
            <span className="stat-value">{vehicles.length > 0 ? Math.round((metrics.active.length / vehicles.length) * 100) : 0}%</span>
          </div>
          <div className="stat-icon-wrapper"><TrendingUp size={22} /></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Avg Speed</span>
            <span className="stat-value">{metrics.avgSpeed} km/h</span>
          </div>
          <div className="stat-icon-wrapper"><Gauge size={22} /></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Max Speed</span>
            <span className="stat-value" style={{ color: metrics.maxSpeed > 70 ? 'var(--danger)' : 'var(--text-main)' }}>{metrics.maxSpeed} km/h</span>
          </div>
          <div className="stat-icon-wrapper"><Gauge size={22} /></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Breaches</span>
            <span className="stat-value">{breachHistory.length}</span>
          </div>
          <div className="stat-icon-wrapper"><AlertTriangle size={22} /></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Telemetry Points</span>
            <span className="stat-value">{telemetryHistory.length}</span>
          </div>
          <div className="stat-icon-wrapper"><Clock size={22} /></div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Speed Distribution */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gauge size={16} color="var(--primary-accent)" /> Speed Distribution
          </h3>
          <div className="bar-chart">
            {speedBuckets.map((b) => (
              <div key={b.label} className="bar-row">
                <span className="bar-label">{b.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(b.count / maxBucket) * 100}%`, background: b.color }} />
                </div>
                <span className="bar-value">{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Status */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={16} color="var(--primary-accent)" /> Fleet Status
          </h3>
          <div className="bar-chart">
            {statusBuckets.map((b) => (
              <div key={b.label} className="bar-row">
                <span className="bar-label">{b.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(b.count / maxStatus) * 100}%`, background: b.color }} />
                </div>
                <span className="bar-value">{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breach Type Breakdown */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--primary-accent)" /> Breach Breakdown
          </h3>
          <div className="bar-chart">
            {breachBuckets.map((b) => (
              <div key={b.label} className="bar-row">
                <span className="bar-label">{b.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(b.count / maxBreach) * 100}%`, background: b.color }} />
                </div>
                <span className="bar-value">{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breaches per Zone */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="var(--primary-accent)" /> Breaches per Zone
          </h3>
          <div className="bar-chart">
            {zoneBreachMap.length > 0 ? zoneBreachMap.map(([name, count]) => (
              <div key={name} className="bar-row">
                <span className="bar-label" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(count / maxZoneBreaches) * 100}%`, background: 'var(--primary-accent)' }} />
                </div>
                <span className="bar-value">{count}</span>
              </div>
            )) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>No breach data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Speed Timeline */}
      {timelinePoints.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="var(--primary-accent)" /> Speed Timeline (last {timelinePoints.length} pings)
          </h3>
          <div className="timeline-chart">
            {timelinePoints.map((p, i) => {
              const maxTimeline = Math.max(...timelinePoints.map((pt) => pt.speed), 1);
              const height = Math.max((p.speed / maxTimeline) * 100, 2);
              const color = p.speed > 70 ? '#ef4444' : p.speed > 50 ? '#f59e0b' : '#38bdf8';
              return (
                <div key={i} className="timeline-bar" title={`${p.speed} km/h at ${new Date(p.timestamp).toLocaleTimeString()}`}>
                  <div className="timeline-bar-fill" style={{ height: `${height}%`, background: color }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            <span>{new Date(timelinePoints[0].timestamp).toLocaleTimeString()}</span>
            <span>{new Date(timelinePoints[timelinePoints.length - 1].timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Vehicle Speed Leaderboard */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gauge size={16} color="var(--primary-accent)" /> Vehicle Speed Leaderboard
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>#</th>
                <th style={{ padding: '8px 12px' }}>Vehicle</th>
                <th style={{ padding: '8px 12px' }}>Speed</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
                <th style={{ padding: '8px 12px' }}>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {[...vehicles]
                .sort((a, b) => (b.lastSpeed || 0) - (a.lastSpeed || 0))
                .map((v, i) => (
                  <tr key={v.vehicleId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: i < 3 ? 'var(--primary-accent)' : 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>{v.name}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontWeight: 600, color: (v.lastSpeed || 0) > 70 ? '#ef4444' : (v.lastSpeed || 0) > 50 ? '#f59e0b' : 'var(--primary-accent)' }}>
                        {v.lastSpeed || 0} km/h
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}><span className={`status-badge ${v.status}`}>{v.status}</span></td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.75rem' }}>{new Date(v.lastActive).toLocaleTimeString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
