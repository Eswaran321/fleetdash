import axios from 'axios';
import { Vehicle, TelemetryPoint, APIResponse, GeofenceZone, BreachAlert, FleetStats } from '../types';

// Pull base URL from Vite environment config (defaults to /api which triggers Vite dev proxy)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API client endpoints calling the backend server.
 */
export const apiService = {
  /**
   * Fetches metadata and cached positions for all fleet vehicles.
   */
  async getVehicles(): Promise<APIResponse<Vehicle[]>> {
    const response = await apiClient.get<APIResponse<Vehicle[]>>('/vehicles');
    return response.data;
  },

  /**
   * Fetches flattened, historical telemetry pings for a specific vehicle.
   * @param vehicleId Unique identifier of the fleet vehicle.
   * @param hours Number of hours of historical buckets to retrieve (default: 24).
   */
  async getVehicleTelemetry(vehicleId: string, hours: number = 24): Promise<APIResponse<TelemetryPoint[]>> {
    const response = await apiClient.get<APIResponse<TelemetryPoint[]>>(`/vehicles/${vehicleId}`, {
      params: { hours },
    });
    return response.data;
  },

  /**
   * Fetches all geofence zone definitions from the backend.
   */
  async getGeofences(): Promise<APIResponse<GeofenceZone[]>> {
    const response = await apiClient.get<APIResponse<GeofenceZone[]>>('/geofences');
    return response.data;
  },

  /**
   * Fetches geofence breach history from the backend.
   * @param limit Maximum number of breach records to return (default: 100).
   */
  async getBreachHistory(limit: number = 100): Promise<APIResponse<BreachAlert[]>> {
    const response = await apiClient.get<APIResponse<BreachAlert[]>>('/geofences/breaches', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Fetches aggregated fleet statistics from the backend.
   */
  async getFleetStats(): Promise<APIResponse<FleetStats>> {
    const response = await apiClient.get<APIResponse<FleetStats>>('/analytics/stats');
    return response.data;
  },
};

export default apiService;
