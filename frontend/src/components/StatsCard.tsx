import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, accentColor }) => {
  return (
    <div 
      className="glass-panel stat-card"
      style={{
        borderLeft: accentColor ? `3px solid ${accentColor}` : '1px solid var(--border-color)'
      }}
    >
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div 
        className="stat-icon-wrapper" 
        style={{ 
          backgroundColor: accentColor ? `${accentColor}15` : 'rgba(56, 189, 248, 0.1)',
          color: accentColor || 'var(--primary-accent)'
        }}
      >
        {icon}
      </div>
    </div>
  );
};

export default StatsCard;
