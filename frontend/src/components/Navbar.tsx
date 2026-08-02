import React from 'react';
import { Moon, Radio, Sun, Truck, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  socketConnected: boolean;
  totalVehicles: number;
  onMenuToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ socketConnected, totalVehicles, onMenuToggle }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="nav-brand">
        {onMenuToggle && (
          <button className="hamburger-btn" onClick={onMenuToggle} aria-label="Toggle menu">
            <Menu size={20} />
          </button>
        )}
        <img src="/favicon.svg" alt="FleetDash logo" style={{ width: '26px', height: '26px', borderRadius: '6px' }} />
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

        <div className="nav-fleet-badge">
          <Truck size={16} />
          <span>Fleet: <strong>{totalVehicles}</strong></span>
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
          <span className="status-text">{socketConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
