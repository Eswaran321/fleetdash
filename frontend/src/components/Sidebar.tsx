import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, Compass, BarChart3, Settings, ShieldCheck, X } from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-mobile-header">
          <span style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 700, color: 'var(--primary-accent)' }}>Menu</span>
          <button className="sidebar-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <ul className="sidebar-menu">
          <li onClick={handleNavClick}>
            <NavLink to="/" end className={({ isActive }: { isActive: boolean }) => `sidebar-item${isActive ? ' active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li onClick={handleNavClick}>
            <NavLink to="/vehicles" className={({ isActive }: { isActive: boolean }) => `sidebar-item${isActive ? ' active' : ''}`}>
              <Truck size={18} />
              <span>Vehicles</span>
            </NavLink>
          </li>
          <li onClick={handleNavClick}>
            <NavLink to="/geofences" className={({ isActive }: { isActive: boolean }) => `sidebar-item${isActive ? ' active' : ''}`}>
              <Compass size={18} />
              <span>Geofences</span>
            </NavLink>
          </li>
          <li onClick={handleNavClick}>
            <NavLink to="/analytics" className={({ isActive }: { isActive: boolean }) => `sidebar-item${isActive ? ' active' : ''}`}>
              <BarChart3 size={18} />
              <span>Analytics</span>
            </NavLink>
          </li>
          <li onClick={handleNavClick}>
            <NavLink to="/settings" className={({ isActive }: { isActive: boolean }) => `sidebar-item${isActive ? ' active' : ''}`}>
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-info-box">
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
    </>
  );
};

export default Sidebar;
