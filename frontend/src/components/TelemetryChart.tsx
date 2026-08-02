import React from 'react';
import { Activity, Gauge, Fuel, Thermometer } from 'lucide-react';
import { TelemetryPoint, Vehicle } from '../types';

interface TelemetryChartProps {
  selectedVehicle: Vehicle | null;
  telemetryHistory: TelemetryPoint[];
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  selectedVehicle,
  telemetryHistory,
}) => {
  if (!selectedVehicle) {
    return (
      <div className="glass-panel chart-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a vehicle to view telemetry trends</div>
      </div>
    );
  }

  if (telemetryHistory.length === 0) {
    return (
      <div className="glass-panel chart-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Awaiting telemetry readings for {selectedVehicle.name}...</div>
      </div>
    );
  }

  // Take the last 20 readings for responsive SVG line graph
  const points = telemetryHistory.slice(-20);

  const maxSpeed = Math.max(...points.map((p) => p.speed), 100);
  const maxTemp = 120; // 120 °C scale
  const maxFuel = 100; // 100 % scale

  const width = 600;
  const height = 140;

  // Helper to map index to SVG X
  const getX = (idx: number) => {
    if (points.length <= 1) return width / 2;
    return (idx / (points.length - 1)) * (width - 40) + 20;
  };

  // Helpers to map values to SVG Y (inverted)
  const getSpeedY = (val: number) => height - (val / maxSpeed) * (height - 20) - 10;
  const getFuelY = (val: number) => height - (val / maxFuel) * (height - 20) - 10;
  const getTempY = (val: number) => height - (val / maxTemp) * (height - 20) - 10;

  // Build SVG path strings
  const speedPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getSpeedY(p.speed)}`).join(' ');
  const fuelPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getFuelY(p.fuel)}`).join(' ');
  const tempPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getTempY(p.engineTemp)}`).join(' ');

  const latest = points[points.length - 1];

  return (
    <div className="glass-panel chart-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Activity size={18} style={{ color: 'var(--primary)' }} />
          <span>Real-time Telemetry Trends ({selectedVehicle.vehicleId})</span>
        </h3>

        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb' }}>
            <Gauge size={14} />
            <span>Speed ({latest.speed} km/h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}>
            <Fuel size={14} />
            <span>Fuel ({latest.fuel}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}>
            <Thermometer size={14} />
            <span>Engine Temp ({latest.engineTemp}°C)</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '140px', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Horizontal Reference Lines */}
          <line x1="0" y1="10" x2={width} y2="10" stroke="var(--border-color)" strokeDasharray="4 4" />
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--border-color)" strokeDasharray="4 4" />
          <line x1="0" y1={height - 10} x2={width} y2={height - 10} stroke="var(--border-color)" strokeDasharray="4 4" />

          {/* Paths */}
          <path d={speedPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
          <path d={fuelPath} fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="3 3" />
          <path d={tempPath} fill="none" stroke="#dc2626" strokeWidth="2" />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getSpeedY(p.speed)} r="3" fill="#2563eb" />
              <circle cx={getX(i)} cy={getFuelY(p.fuel)} r="2.5" fill="#16a34a" />
              <circle cx={getX(i)} cy={getTempY(p.engineTemp)} r="2.5" fill="#dc2626" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default TelemetryChart;
