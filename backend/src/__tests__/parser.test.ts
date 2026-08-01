import { runCoordinateParserWorker } from '../workers/workerPool';

describe('Worker Thread Coordinate Parser & Haversine Math', () => {
  it('should successfully parse valid GPS string and calculate distance from Bangalore depot', async () => {
    // Standard Depot coordinates: 12.9716, 77.5946
    const payload = {
      gpsString: '12.9716,77.5946',
      speed: '60',
      fuel: '80',
      engineTemp: '85',
    };

    const result = await runCoordinateParserWorker(payload);

    expect(result).toBeDefined();
    expect(result.lat).toBe(12.9716);
    expect(result.lng).toBe(77.5946);
    expect(result.speed).toBe(60);
    expect(result.fuel).toBe(80);
    expect(result.engineTemp).toBe(85);
    expect(result.distanceFromDepot).toBeLessThan(0.01); // At depot location
  });

  it('should calculate non-zero Haversine distance for offset coordinates', async () => {
    const payload = {
      gpsString: '12.9800,77.6000',
      speed: 45,
      fuel: 90,
      engineTemp: 78,
    };

    const result = await runCoordinateParserWorker(payload);

    expect(result.distanceFromDepot).toBeGreaterThan(0.5);
    expect(result.distanceFromDepot).toBeLessThan(10);
  });

  it('should throw error for invalid GPS string format', async () => {
    const payload = {
      gpsString: 'invalid-string',
      speed: 50,
      fuel: 50,
      engineTemp: 80,
    };

    await expect(runCoordinateParserWorker(payload)).rejects.toThrow();
  });
});
