import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Compass, Maximize2, Minimize2 } from 'lucide-react';
import { Vehicle, TelemetryPoint } from '../types';

const MIN_LAT = 12.9300;
const MAX_LAT = 13.0200;
const MIN_LNG = 77.5400;
const MAX_LNG = 77.6400;
const DEPOT_LAT = 12.9716;
const DEPOT_LNG = 77.5946;

function isLightTheme(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'light';
}

function getX(lng: number, width: number): number {
  return ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * width;
}

function getY(lat: number, height: number): number {
  return height - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * height;
}

interface MapPlaceholderProps {
  allVehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  telemetryHistory: TelemetryPoint[];
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  allVehicles,
  selectedVehicle,
  telemetryHistory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const allVehiclesRef = useRef(allVehicles);
  const selectedVehicleRef = useRef(selectedVehicle);
  const telemetryHistoryRef = useRef(telemetryHistory);
  const prevPositionsRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);

  allVehiclesRef.current = allVehicles;
  selectedVehicleRef.current = selectedVehicle;
  telemetryHistoryRef.current = telemetryHistory;

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let pulseRadius = 6;
    let pulseGrowing = true;

    const drawMap = () => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 600;
      const height = canvas.height = canvas.parentElement?.clientHeight || 380;
      const light = isLightTheme();

      const bgColor = light ? '#f8fafc' : '#060913';
      const gridColor = light ? 'rgba(100, 116, 139, 0.08)' : 'rgba(56, 189, 248, 0.05)';
      const depotColor = '#818cf8';
      const trajectoryColor = light ? 'rgba(2, 132, 199, 0.5)' : 'rgba(56, 189, 248, 0.6)';
      const pulseColor = light ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.15)';
      const activePin = light ? '#059669' : '#10b981';
      const offlinePin = light ? '#94a3b8' : '#64748b';
      const selectedStroke = light ? '#0284c7' : '#38bdf8';
      const pinStroke = light ? '#f8fafc' : '#060913';
      const labelActive = light ? '#0284c7' : '#38bdf8';
      const labelOffline = light ? '#64748b' : '#94a3b8';

      const vehicles = allVehiclesRef.current;
      const selected = selectedVehicleRef.current;
      const history = telemetryHistoryRef.current;

      // 1. Draw Map Background grid
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Depot
      const depotX = getX(DEPOT_LNG, width);
      const depotY = getY(DEPOT_LAT, height);
      ctx.fillStyle = depotColor;
      ctx.beginPath();
      ctx.arc(depotX, depotY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = depotColor;
      ctx.font = '10px Inter';
      ctx.fillText('Central Depot', depotX + 12, depotY + 4);

      // 3. Draw Trajectory Path for selected vehicle
      if (selected && history.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = trajectoryColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]);

        history.forEach((point, idx) => {
          const px = getX(point.lng, width);
          const py = getY(point.lat, height);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Draw All Vehicles
      const prevPositions = prevPositionsRef.current;
      vehicles.forEach((vehicle) => {
        if (!vehicle.lastLocation) return;

        const vx = getX(vehicle.lastLocation.lng, width);
        const vy = getY(vehicle.lastLocation.lat, height);
        const isSelected = selected && vehicle.vehicleId === selected.vehicleId;

        // Compute heading from position delta
        const prev = prevPositions.get(vehicle.vehicleId);
        let heading = 0;
        if (prev) {
          const prevX = getX(prev.lng, width);
          const prevY = getY(prev.lat, height);
          heading = Math.atan2(vy - prevY, vx - prevX);
        }
        prevPositions.set(vehicle.vehicleId, { lat: vehicle.lastLocation.lat, lng: vehicle.lastLocation.lng });

        if (isSelected) {
          ctx.fillStyle = pulseColor;
          ctx.beginPath();
          ctx.arc(vx, vy, pulseRadius * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw vehicle as a directional triangle
        const size = isSelected ? 8 : 6;
        ctx.save();
        ctx.translate(vx, vy);
        ctx.rotate(heading);

        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size, -size * 0.6);
        ctx.lineTo(-size, size * 0.6);
        ctx.closePath();

        ctx.fillStyle = vehicle.status === 'active' ? activePin : offlinePin;
        ctx.fill();
        ctx.strokeStyle = isSelected ? selectedStroke : pinStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();

        if (isSelected || vehicle.status === 'active') {
          ctx.fillStyle = isSelected ? labelActive : labelOffline;
          ctx.font = isSelected ? 'bold 11px Inter' : '10px Inter';
          ctx.fillText(vehicle.vehicleId, vx + 12, vy + 4);
        }
      });

      // 5. Update pulse
      if (pulseGrowing) {
        pulseRadius += 0.15;
        if (pulseRadius > 10) pulseGrowing = false;
      } else {
        pulseRadius -= 0.15;
        if (pulseRadius < 5) pulseGrowing = true;
      }

      animationFrameId = requestAnimationFrame(drawMap);
    };

    drawMap();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="glass-panel map-container" ref={containerRef}>
      <div className="map-header">
        <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={18} style={{ color: 'var(--primary-accent)' }} />
          <span>Active Telemetry Map</span>
        </h3>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#818cf8' }} />
            <span>Depot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748b' }} />
            <span>Offline</span>
          </div>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            className="theme-toggle"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 8px' }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      <div className="map-canvas-area">
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

        {/* HUD overlay for coordinate mapping metrics */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(6, 9, 19, 0.85)',
          border: '1px solid var(--border-color)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontFamily: 'monospace'
        }}>
          <div>GRID: Bangalore Metropol</div>
          <div>SW: {MIN_LAT.toFixed(4)}N, {MIN_LNG.toFixed(4)}E</div>
          <div>NE: {MAX_LAT.toFixed(4)}N, {MAX_LNG.toFixed(4)}E</div>
        </div>

        {selectedVehicle && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(6, 9, 19, 0.85)',
            border: '1px solid var(--border-color)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div>Target: <strong>{selectedVehicle.name}</strong></div>
            {selectedVehicle.lastLocation && (
              <div style={{ color: 'var(--primary-accent)', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                POS: {selectedVehicle.lastLocation.lat.toFixed(5)}, {selectedVehicle.lastLocation.lng.toFixed(5)}
              </div>
            )}
            {telemetryHistory.length > 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                Trajectory logs: {telemetryHistory.length} readings
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPlaceholder;
