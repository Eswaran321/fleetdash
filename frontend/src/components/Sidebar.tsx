import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, Compass, BarChart3, Settings, ShieldCheck } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/" end className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/vehicles" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <Truck size={18} />
            <span>Vehicles</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/geofences" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <Compass size={18} />
            <span>Geofences</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/analytics" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <BarChart3 size={18} />
            <span>Analytics</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
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
