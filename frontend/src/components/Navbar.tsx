import React from 'react';
import { Activity, Moon, Radio, Sun, Truck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  socketConnected: boolean;
  totalVehicles: number;
}

export const Navbar: React.FC<NavbarProps> = ({ socketConnected, totalVehicles }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="nav-brand">
        <Activity size={24} style={{ color: 'var(--primary-accent)' }} />
        <span>FleetDash</span>
      </div>

      <div className="nav-status">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <Truck size={16} />
          <span>Active Fleet: <strong>{totalVehicles}</strong></span>
        </div>

        <div className="status-indicator">
          <div className={socketConnected ? "dot-pulse" : ""} style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: socketConnected ? 'var(--success)' : 'var(--danger)',
            boxShadow: socketConnected ? '0 0 8px var(--success)' : 'none'
          }} />
          <Radio size={14} style={{ marginLeft: '4px' }} />
          <span>{socketConnected ? 'Real-time Feed Active' : 'Feed Disconnected'}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
