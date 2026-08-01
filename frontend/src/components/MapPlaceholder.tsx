import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Compass, Maximize2, Minimize2 } from 'lucide-react';
import { Vehicle, TelemetryPoint, GeofenceZone } from '../types';

const MIN_LAT = 12.9300;
const MAX_LAT = 13.0200;
const MIN_LNG = 77.5400;
const MAX_LNG = 77.6400;
const DEPOT_LAT = 12.9716;
const DEPOT_LNG = 77.5946;

function isDarkTheme(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark';
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
  geofenceZones?: GeofenceZone[];
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  allVehicles,
  selectedVehicle,
  telemetryHistory,
  geofenceZones = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const allVehiclesRef = useRef(allVehicles);
  const selectedVehicleRef = useRef(selectedVehicle);
  const telemetryHistoryRef = useRef(telemetryHistory);
  const geofenceZonesRef = useRef(geofenceZones);
  const prevPositionsRef = useRef<Map<string, { lat: number; lng: number; heading: number }>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);

  allVehiclesRef.current = allVehicles;
  selectedVehicleRef.current = selectedVehicle;
  telemetryHistoryRef.current = telemetryHistory;
  geofenceZonesRef.current = geofenceZones;

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
      const area = canvas.parentElement?.getBoundingClientRect();
      const width = canvas.width = Math.floor(area?.width || 600);
      const height = canvas.height = Math.floor(area?.height || 380);
      const dark = isDarkTheme();

      const landColor = dark ? '#141414' : '#eef0f3';
      const waterColor = dark ? '#0f1f27' : '#cfe3f2';
      const waterEdge = dark ? '#1c3a4a' : '#9fc0d8';
      const parkColor = dark ? '#10210c' : '#d9ead1';
      const parkEdge = dark ? '#223d18' : '#b3cfa8';
      const buildingColor = dark ? '#202020' : '#d6dbe1';
      const buildingAccent = dark ? '#2c2c2c' : '#c3cad3';
      const roadMinorCasing = dark ? '#303030' : '#cdd2d9';
      const roadMinorFill = dark ? '#1c1c1c' : '#ffffff';
      const roadMajorCasing = dark ? '#3a3a3a' : '#c3c9d1';
      const roadMajorFill = dark ? '#232323' : '#ffffff';
      const centerlineColor = dark ? 'rgba(245, 158, 11, 0.5)' : 'rgba(217, 119, 6, 0.5)';
      const railColor = dark ? '#4a5a6e' : '#aab6c4';
      const labelColor = dark ? '#6b7a8c' : '#8a94a0';
      const majorLabelColor = dark ? '#7d8c9e' : '#7d8794';
      const gridColor = dark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(100, 116, 139, 0.07)';
      const depotColor = dark ? '#3b82f6' : '#2563eb';
      const depotRing = dark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.35)';
      const trajectoryColor = dark ? 'rgba(96, 165, 250, 0.6)' : 'rgba(37, 99, 235, 0.5)';
      const pulseColor = dark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(37, 99, 235, 0.10)';
      const activePin = dark ? '#22c55e' : '#16a34a';
      const offlinePin = dark ? '#64748b' : '#9ca3af';
      const selectedStroke = dark ? '#60a5fa' : '#2563eb';
      const pinStroke = dark ? '#000000' : '#ffffff';
      const labelActive = dark ? '#93c5fd' : '#2563eb';
      const labelOffline = dark ? '#94a3b8' : '#6b7280';
      const zoneStroke = dark ? 'rgba(245, 158, 11, 0.55)' : 'rgba(217, 119, 6, 0.55)';
      const zoneFill = dark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(217, 119, 6, 0.05)';
      const zoneLabel = dark ? '#f59e0b' : '#d97706';

      const vehicles = allVehiclesRef.current;
      const selected = selectedVehicleRef.current;
      const history = telemetryHistoryRef.current;

      // --- Base map helpers (deterministic per frame) ---
      const P = (nx: number, ny: number) => ({ x: nx * width, y: ny * height });

      const mulberry32 = (seed: number) => () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };

      const drawBlob = (cx: number, cy: number, r: number, seed: number, fill: string, edge: string) => {
        const rand = mulberry32(seed);
        const n = 16;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const rr = r * (0.8 + rand() * 0.4);
          pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
        }
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 0; i < n; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % n];
          ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1;
        ctx.stroke();
      };

      const drawPolyline = (
        pts: [number, number][],
        w: number,
        casing: string,
        fill: string,
        centerline?: boolean,
      ) => {
        const pxPts = pts.map(([nx, ny]) => P(nx, ny));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = casing;
        ctx.lineWidth = w + 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        pxPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        ctx.strokeStyle = fill;
        ctx.lineWidth = w;
        ctx.beginPath();
        pxPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        if (centerline) {
          ctx.strokeStyle = centerlineColor;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([10, 8]);
          ctx.beginPath();
          pxPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
          ctx.stroke();
        }
        ctx.setLineDash([]);
      };

      const drawRail = (pts: [number, number][]) => {
        const pxPts = pts.map(([nx, ny]) => P(nx, ny));
        ctx.lineCap = 'butt';
        ctx.strokeStyle = railColor;
        ctx.lineWidth = 6;
        for (let i = 0; i < pxPts.length - 1; i++) {
          const a = pxPts[i];
          const b = pxPts[i + 1];
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const steps = Math.floor(len / 22);
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          const px = -Math.sin(ang) * 3.5;
          const py = Math.cos(ang) * 3.5;
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            ctx.beginPath();
            ctx.moveTo(a.x + (b.x - a.x) * t - px, a.y + (b.y - a.y) * t - py);
            ctx.lineTo(a.x + (b.x - a.x) * t + px, a.y + (b.y - a.y) * t + py);
            ctx.stroke();
          }
        }
        ctx.strokeStyle = railColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        pxPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        ctx.setLineDash([]);
      };

      const drawRoadLabel = (txt: string, nx: number, ny: number, angle: number, color: string, size: number) => {
        ctx.save();
        ctx.translate(P(nx, ny).x, P(nx, ny).y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.font = `${size}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, 0, 0);
        ctx.restore();
      };

      // 1. Base map: land
      ctx.fillStyle = landColor;
      ctx.fillRect(0, 0, width, height);

      // 2. Water bodies
      drawBlob(P(0.68, 0.44).x, P(0.68, 0.44).y, width * 0.06, 7, waterColor, waterEdge);
      drawBlob(P(0.24, 0.70).x, P(0.24, 0.70).y, width * 0.032, 8, waterColor, waterEdge);

      // 3. Parks / green spaces
      drawBlob(P(0.32, 0.20).x, P(0.32, 0.20).y, width * 0.045, 11, parkColor, parkEdge);
      drawBlob(P(0.78, 0.24).x, P(0.78, 0.24).y, width * 0.036, 12, parkColor, parkEdge);
      drawBlob(P(0.48, 0.78).x, P(0.48, 0.78).y, width * 0.04, 13, parkColor, parkEdge);
      drawBlob(P(0.90, 0.62).x, P(0.90, 0.62).y, width * 0.028, 14, parkColor, parkEdge);
      drawBlob(P(0.10, 0.42).x, P(0.10, 0.42).y, width * 0.03, 15, parkColor, parkEdge);

      // 4. Building blocks (urban districts)
      const districts: [number, number, number, number, number][] = [
        [0.40, 0.30, 0.56, 0.52, 101],
        [0.16, 0.52, 0.30, 0.68, 102],
        [0.72, 0.40, 0.90, 0.58, 103],
        [0.40, 0.60, 0.56, 0.76, 104],
        [0.06, 0.16, 0.20, 0.32, 105],
        [0.56, 0.16, 0.66, 0.30, 106],
        [0.84, 0.14, 0.96, 0.30, 107],
        [0.62, 0.62, 0.74, 0.80, 108],
        [0.28, 0.76, 0.38, 0.92, 109],
      ];
      districts.forEach(([x1, y1, x2, y2, seed]) => {
        const rand = mulberry32(seed);
        const cols = Math.max(2, Math.round((x2 - x1) / 0.022));
        const rows = Math.max(2, Math.round((y2 - y1) / 0.022));
        const cellW = (x2 - x1) / cols;
        const cellH = (y2 - y1) / rows;
        ctx.fillStyle = buildingColor;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (rand() < 0.16) continue;
            const jx = (rand() - 0.5) * cellW * 0.3;
            const jy = (rand() - 0.5) * cellH * 0.3;
            const bw = cellW * (0.6 + rand() * 0.3);
            const bh = cellH * (0.6 + rand() * 0.3);
            ctx.fillRect(P(x1 + c * cellW + jx, y1 + r * cellH + jy).x, P(x1 + c * cellW + jx, y1 + r * cellH + jy).y, bw * width, bh * height);
          }
        }
        // a few accent towers per district
        const rand2 = mulberry32(seed + 7);
        const towerCount = 5 + Math.floor(rand2() * 5);
        ctx.fillStyle = buildingAccent;
        for (let i = 0; i < towerCount; i++) {
          const tx = x1 + rand2() * (x2 - x1);
          const ty = y1 + rand2() * (y2 - y1);
          const tw = 0.006 + rand2() * 0.004;
          const th = 0.009 + rand2() * 0.006;
          ctx.fillRect(P(tx, ty).x, P(tx, ty).y, tw * width, th * height);
        }
      });

      // 5. Minor roads
      const minorRoads: [number, number][][] = [
        [[0, 0.16], [1, 0.16]],
        [[0, 0.66], [1, 0.66]],
        [[0.18, 0], [0.18, 1]],
        [[0.55, 0], [0.55, 1]],
        [[0.88, 0], [0.88, 1]],
        [[0, 0.40], [0.42, 0.40]],
      ];
      minorRoads.forEach((road) => drawPolyline(road, 4, roadMinorCasing, roadMinorFill));

      // 6. Major roads (arterials)
      drawPolyline([[0, 0.30], [1, 0.30]], 10, roadMajorCasing, roadMajorFill, true);
      drawPolyline([[0, 0.52], [1, 0.52]], 12, roadMajorCasing, roadMajorFill, true);
      drawPolyline([[0, 0.85], [1, 0.85]], 8, roadMajorCasing, roadMajorFill);
      drawPolyline([[0.42, 0], [0.42, 1]], 10, roadMajorCasing, roadMajorFill, true);
      drawPolyline([[0.72, 0.06], [0.72, 1]], 9, roadMajorCasing, roadMajorFill);

      // 7. Rail line
      drawRail([[0.10, 0.92], [0.30, 0.70], [0.52, 0.10]]);

      // 8. Landmarks and labels
      ctx.font = '10px Inter';
      ctx.fillStyle = labelColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Ulsoor Lake', P(0.68, 0.44).x - 36, P(0.68, 0.44).y + 3);
      ctx.fillText('Cubbon Park', P(0.32, 0.20).x - 38, P(0.32, 0.20).y + 3);
      drawRoadLabel('OUTER RING RD', 0.32, 0.275, 0, majorLabelColor, 9);
      drawRoadLabel('MG ROAD', 0.32, 0.492, 0, majorLabelColor, 9);
      drawRoadLabel('AIRPORT RD', 0.40, 0.42, -Math.PI / 2, majorLabelColor, 9);
      drawRoadLabel('TECH DISTRICT', 0.48, 0.47, 0, labelColor, 8);
      drawRoadLabel('OLD TOWN', 0.23, 0.59, 0, labelColor, 8);

      // 9. Faint grid overlay
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

      // 2. Draw Geofence Zones
      const zones = geofenceZonesRef.current;
      zones.forEach((zone) => {
        ctx.strokeStyle = zoneStroke;
        ctx.fillStyle = zoneFill;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        if (zone.type === 'circle' && zone.center && zone.radius) {
          const cx = getX(zone.center.lng, width);
          const cy = getY(zone.center.lat, height);
          const pxPerDeg = width / (MAX_LNG - MIN_LNG);
          const r = zone.radius / 111.32 * pxPerDeg;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = zoneLabel;
          ctx.font = '10px Inter';
          ctx.fillText(zone.name, cx + r + 4, cy + 3);
          ctx.setLineDash([4, 4]);
        }

        if (zone.type === 'polygon' && zone.coordinates && zone.coordinates.length >= 3) {
          ctx.beginPath();
          zone.coordinates.forEach((coord, idx) => {
            const px = getX(coord.lng, width);
            const py = getY(coord.lat, height);
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          const label = zone.coordinates[0];
          ctx.fillStyle = zoneLabel;
          ctx.font = '10px Inter';
          ctx.fillText(zone.name, getX(label.lng, width) + 6, getY(label.lat, height) - 6);
          ctx.setLineDash([4, 4]);
        }
      });
      ctx.setLineDash([]);

      // 10. Draw Depot
      const depotX = getX(DEPOT_LNG, width);
      const depotY = getY(DEPOT_LAT, height);
      ctx.fillStyle = depotColor;
      ctx.beginPath();
      ctx.arc(depotX, depotY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = depotRing;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = depotColor;
      ctx.font = '10px Inter';
      ctx.fillText('Central Depot', depotX + 12, depotY + 4);

      // 11. Draw Trajectory Path for selected vehicle
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

      // 12. Draw All Vehicles
      const prevPositions = prevPositionsRef.current;
      vehicles.forEach((vehicle) => {
        if (!vehicle.lastLocation) return;

        const vx = getX(vehicle.lastLocation.lng, width);
        const vy = getY(vehicle.lastLocation.lat, height);
        const isSelected = selected && vehicle.vehicleId === selected.vehicleId;

        // Compute heading from position delta — only update on actual movement
        const prev = prevPositions.get(vehicle.vehicleId);
        let heading = prev ? prev.heading : 0;
        if (prev) {
          const prevX = getX(prev.lng, width);
          const prevY = getY(prev.lat, height);
          const dx = vx - prevX;
          const dy = vy - prevY;
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            heading = Math.atan2(dy, dx);
            prevPositions.set(vehicle.vehicleId, { lat: vehicle.lastLocation.lat, lng: vehicle.lastLocation.lng, heading });
          }
        } else {
          prevPositions.set(vehicle.vehicleId, { lat: vehicle.lastLocation.lat, lng: vehicle.lastLocation.lng, heading: 0 });
        }

        if (isSelected) {
          ctx.fillStyle = pulseColor;
          ctx.beginPath();
          ctx.arc(vx, vy, pulseRadius * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw vehicle circle
        ctx.fillStyle = vehicle.status === 'active' ? activePin : offlinePin;
        ctx.beginPath();
        ctx.arc(vx, vy, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isSelected ? selectedStroke : pinStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw direction arrow
        const arrowColor = isSelected ? selectedStroke : (vehicle.status === 'active' ? activePin : '#94a3b8');
        ctx.save();
        ctx.translate(vx, vy);
        ctx.rotate(heading);
        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(24, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(15, -6);
        ctx.lineTo(15, 6);
        ctx.closePath();
        ctx.fillStyle = arrowColor;
        ctx.fill();
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
          <Compass size={18} style={{ color: 'var(--primary)' }} />
          <span>Active Telemetry Map</span>
        </h3>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#16a34a' }} />
            <span>Active</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#2563eb' }} />
            <span>Depot</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#9ca3af' }} />
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

        <div className="map-hud" style={{ bottom: '12px', left: '12px' }}>
          <div>GRID: Bangalore Metropol</div>
          <div>SW: {MIN_LAT.toFixed(4)}N, {MIN_LNG.toFixed(4)}E</div>
          <div>NE: {MAX_LAT.toFixed(4)}N, {MAX_LNG.toFixed(4)}E</div>
        </div>

        {selectedVehicle && (
          <div className="map-hud" style={{ top: '12px', right: '12px' }}>
            <div>Target: <strong>{selectedVehicle.name}</strong></div>
            {selectedVehicle.lastLocation && (
              <div className="mono">
                POS: {selectedVehicle.lastLocation.lat.toFixed(5)}, {selectedVehicle.lastLocation.lng.toFixed(5)}
              </div>
            )}
            {telemetryHistory.length > 0 && (
              <div>Trajectory logs: {telemetryHistory.length} readings</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPlaceholder;
