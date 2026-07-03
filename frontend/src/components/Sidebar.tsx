import React from 'react';
import { LayoutDashboard, Truck, Compass, BarChart3, Settings, ShieldCheck } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <ul className="sidebar-menu">
        <li>
          <div className="sidebar-item active">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
        </li>
        <li>
          <div className="sidebar-item">
            <Truck size={18} />
            <span>Vehicles</span>
          </div>
        </li>
        <li>
          <div className="sidebar-item">
            <Compass size={18} />
            <span>Geofences</span>
          </div>
        </li>
        <li>
          <div className="sidebar-item">
            <BarChart3 size={18} />
            <span>Analytics</span>
          </div>
        </li>
        <li>
          <div className="sidebar-item">
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </li>
      </ul>

      <div style={{
        background: 'rgba(56, 189, 248, 0.04)',
        border: '1px solid var(--border-color)',
        padding: '16px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-accent)' }}>
          <ShieldCheck size={16} />
          <span>Core Ingestion</span>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          MongoDB Bucket Pattern:<br/>
          <strong style={{ color: 'var(--success)' }}>Active (Hourly)</strong>
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Worker Threads Parsing:<br/>
          <strong style={{ color: 'var(--success)' }}>Enabled (Haversine)</strong>
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
