import React, { useEffect, useState } from 'react';
import { Settings, User, Bell, Monitor, Globe, Save, RotateCcw, CheckCircle, Database, Wifi, Cpu, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Profile {
  name: string;
  email: string;
  role: string;
}

interface AppSettings {
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  mapFollow: boolean;
  alertSound: boolean;
  alertDuration: number;
}

const defaultProfile: Profile = { name: '', email: '', role: 'Operator' };
const defaultSettings: AppSettings = { notifications: true, autoRefresh: true, refreshInterval: 30, mapFollow: true, alertSound: true, alertDuration: 6 };

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem('fleetdash-profile');
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  } catch { return defaultProfile; }
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('fleetdash-settings');
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch { return defaultSettings; }
}

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setSettings(loadSettings());
  }, []);

  const handleSave = () => {
    localStorage.setItem('fleetdash-profile', JSON.stringify(profile));
    localStorage.setItem('fleetdash-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setProfile(defaultProfile);
    setSettings(defaultSettings);
    localStorage.removeItem('fleetdash-profile');
    localStorage.removeItem('fleetdash-settings');
  };

  const updateProfile = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updateSetting = <K extends keyof AppSettings>(field: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.6rem', fontWeight: 700 }}>
          <Settings size={22} style={{ verticalAlign: 'middle', marginRight: '10px', color: 'var(--primary-accent)' }} />
          Settings
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="back-btn" onClick={handleReset}>
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
          <button className="save-btn" onClick={handleSave}>
            {saved ? <CheckCircle size={14} /> : <Save size={14} />}
            <span>{saved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Profile Section */}
        <div className="glass-panel settings-section">
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} color="var(--primary-accent)" /> Profile
          </h3>
          <div className="settings-field">
            <label className="settings-label">Full Name</label>
            <input
              className="settings-input"
              type="text"
              placeholder="Enter your name"
              value={profile.name}
              onChange={(e) => updateProfile('name', e.target.value)}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">Email</label>
            <input
              className="settings-input"
              type="email"
              placeholder="operator@fleetdash.com"
              value={profile.email}
              onChange={(e) => updateProfile('email', e.target.value)}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">Role</label>
            <select
              className="settings-input"
              value={profile.role}
              onChange={(e) => updateProfile('role', e.target.value)}
            >
              <option value="Operator">Operator</option>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="glass-panel settings-section">
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={16} color="var(--primary-accent)" /> Appearance
          </h3>
          <div className="settings-row">
            <div>
              <div className="settings-label">Theme</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current: <strong style={{ textTransform: 'capitalize' }}>{theme}</strong></div>
            </div>
            <button className="settings-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Map Follow Vehicle</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Center map on selected vehicle</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={settings.mapFollow} onChange={(e) => updateSetting('mapFollow', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="glass-panel settings-section">
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} color="var(--primary-accent)" /> Notifications
          </h3>
          <div className="settings-row">
            <div>
              <div className="settings-label">Enable Notifications</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Show breach alert toasts</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={settings.notifications} onChange={(e) => updateSetting('notifications', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Alert Sound</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Play sound on critical alerts</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={settings.alertSound} onChange={(e) => updateSetting('alertSound', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
          <div className="settings-field">
            <label className="settings-label">Alert Duration (seconds)</label>
            <input
              className="settings-input"
              type="number"
              min={1}
              max={30}
              value={settings.alertDuration}
              onChange={(e) => updateSetting('alertDuration', Math.max(1, parseInt(e.target.value) || 6))}
            />
          </div>
        </div>

        {/* Data & Refresh Section */}
        <div className="glass-panel settings-section">
          <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} color="var(--primary-accent)" /> Data & Refresh
          </h3>
          <div className="settings-row">
            <div>
              <div className="settings-label">Auto Refresh</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Periodically reload vehicle data</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={settings.autoRefresh} onChange={(e) => updateSetting('autoRefresh', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
          <div className="settings-field">
            <label className="settings-label">Refresh Interval (seconds)</label>
            <input
              className="settings-input"
              type="number"
              min={5}
              max={300}
              value={settings.refreshInterval}
              onChange={(e) => updateSetting('refreshInterval', Math.max(5, parseInt(e.target.value) || 30))}
            />
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="glass-panel settings-section" style={{ marginTop: '4px' }}>
        <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} color="var(--primary-accent)" /> System Info
        </h3>
        <div className="system-info-grid">
          <div className="system-info-item">
            <Database size={14} color="var(--text-muted)" />
            <span className="settings-label" style={{ marginBottom: 0 }}>Database</span>
            <span className="system-info-value">MongoDB (Bucket Pattern)</span>
          </div>
          <div className="system-info-item">
            <Wifi size={14} color="var(--text-muted)" />
            <span className="settings-label" style={{ marginBottom: 0 }}>Transport</span>
            <span className="system-info-value">Socket.io (Binary ArrayBuffer)</span>
          </div>
          <div className="system-info-item">
            <Cpu size={14} color="var(--text-muted)" />
            <span className="settings-label" style={{ marginBottom: 0 }}>Worker Threads</span>
            <span className="system-info-value">Haversine GPS Parser</span>
          </div>
          <div className="system-info-item">
            <Clock size={14} color="var(--text-muted)" />
            <span className="settings-label" style={{ marginBottom: 0 }}>TTL</span>
            <span className="system-info-value">72h Telemetry Buckets</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
