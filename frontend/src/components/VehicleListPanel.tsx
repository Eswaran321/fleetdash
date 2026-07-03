import React, { useState } from 'react';
import { Search, Truck, Car, Bike, ShieldAlert } from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleListPanelProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
}

export const VehicleListPanel: React.FC<VehicleListPanelProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter vehicles based on search criteria (name, plate number, or id)
  const filteredVehicles = vehicles.filter((vehicle) => {
    const term = searchTerm.toLowerCase();
    return (
      vehicle.name.toLowerCase().includes(term) ||
      vehicle.vehicleId.toLowerCase().includes(term) ||
      vehicle.licensePlate.toLowerCase().includes(term)
    );
  });

  // Get appropriate category icon
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck size={18} />;
      case 'van':
        return <Truck size={18} style={{ transform: 'scaleX(-1)' }} />; // Simple variation
      case 'motorcycle':
        return <Bike size={18} />;
      case 'car':
      default:
        return <Car size={18} />;
    }
  };

  return (
    <div className="glass-panel vehicle-panel">
      <h3 className="panel-title">Fleet Vehicles ({filteredVehicles.length})</h3>

      <div className="search-input-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Filter by ID, name, plate..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="vehicle-list">
        {filteredVehicles.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '24px',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            <ShieldAlert size={24} />
            <span style={{ fontSize: '0.85rem' }}>No matching vehicles found</span>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => {
            const isSelected = vehicle.vehicleId === selectedVehicleId;
            return (
              <div
                key={vehicle.vehicleId}
                className={`vehicle-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectVehicle(vehicle.vehicleId)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    color: isSelected ? 'var(--primary-accent)' : 'var(--text-secondary)',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                    padding: '8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getVehicleIcon(vehicle.type)}
                  </div>
                  <div className="vehicle-meta">
                    <span className="vehicle-name" style={{ color: isSelected ? 'var(--text-main)' : 'var(--text-main)' }}>
                      {vehicle.name}
                    </span>
                    <span className="vehicle-sub">
                      {vehicle.vehicleId} • {vehicle.licensePlate}
                    </span>
                  </div>
                </div>

                <div className="vehicle-status-cell">
                  <span className={`status-badge ${vehicle.status}`}>
                    {vehicle.status}
                  </span>
                  {vehicle.status === 'active' && vehicle.lastSpeed !== undefined ? (
                    <span className="vehicle-speed">{vehicle.lastSpeed} km/h</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Offline</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VehicleListPanel;
