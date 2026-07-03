import React, { useEffect, useRef } from 'react';
import { Compass } from 'lucide-react';
import { Vehicle, TelemetryPoint } from '../types';

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

  // Constants mapping GPS bounds to the Canvas coordinate grid (Centered on Bangalore)
  const MIN_LAT = 12.9300;
  const MAX_LAT = 13.0200;
  const MIN_LNG = 77.5400;
  const MAX_LNG = 77.6400;
  const DEPOT_LAT = 12.9716;
  const DEPOT_LNG = 77.5946;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let pulseRadius = 6;
    let pulseGrowing = true;

    // Helper to project GPS values to Canvas X coordinate
    const getX = (lng: number, width: number) => {
      const scale = (lng - MIN_LNG) / (MAX_LNG - MIN_LNG);
      return scale * width;
    };

    // Helper to project GPS values to Canvas Y coordinate (y-axis is inverted in canvas)
    const getY = (lat: number, height: number) => {
      const scale = (lat - MIN_LAT) / (MAX_LAT - MIN_LAT);
      return height - (scale * height);
    };

    const drawMap = () => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 600;
      const height = canvas.height = canvas.parentElement?.clientHeight || 380;

      // 1. Draw Map Background grid
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
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
      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.arc(depotX, depotY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label Depot
      ctx.fillStyle = '#818cf8';
      ctx.font = '10px Inter';
      ctx.fillText('Central Depot', depotX + 12, depotY + 4);

      // 3. Draw Trajectory Path for selected vehicle
      if (selectedVehicle && telemetryHistory.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]); // Dashed line for path

        telemetryHistory.forEach((point, idx) => {
          const px = getX(point.lng, width);
          const py = getY(point.lat, height);
          if (idx === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        });
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      }

      // 4. Draw All Vehicles
      allVehicles.forEach((vehicle) => {
        if (!vehicle.lastLocation) return;

        const vx = getX(vehicle.lastLocation.lng, width);
        const vy = getY(vehicle.lastLocation.lat, height);
        const isSelected = selectedVehicle && vehicle.vehicleId === selectedVehicle.vehicleId;

        // Pulse effect animation variables
        if (isSelected) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.beginPath();
          ctx.arc(vx, vy, pulseRadius * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw pin dot
        ctx.fillStyle = vehicle.status === 'active' ? '#10b981' : '#64748b';
        ctx.beginPath();
        ctx.arc(vx, vy, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#38bdf8' : '#060913';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw text label next to selected vehicle
        if (isSelected || vehicle.status === 'active') {
          ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
          ctx.font = isSelected ? 'bold 11px Inter' : '10px Inter';
          ctx.fillText(vehicle.vehicleId, vx + 10, vy + 4);
        }
      });

      // 5. Update pulse radius for active animations
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
  }, [allVehicles, selectedVehicle, telemetryHistory]);

  return (
    <div className="glass-panel map-container">
      <div className="map-header">
        <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={18} style={{ color: 'var(--primary-accent)' }} />
          <span>Active Telemetry Map</span>
        </h3>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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
