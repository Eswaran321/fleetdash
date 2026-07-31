import { runCoordinateParserWorker } from '../src/workers/workerPool';

describe('runCoordinateParserWorker', () => {
  it('parses a valid coordinate string and returns metrics', async () => {
    const result = await runCoordinateParserWorker({
      gpsString: '12.9716,77.5946',
      speed: '55',
      fuel: '80',
      engineTemp: '90',
    });

    expect(result).toMatchObject({
      lat: 12.9716,
      lng: 77.5946,
      speed: 55,
      fuel: 80,
      engineTemp: 90,
    });
    expect(typeof result.distanceFromDepot).toBe('number');
    expect(typeof result.checksum).toBe('number');
  });

  it('trims whitespace around coordinates', async () => {
    const result = await runCoordinateParserWorker({
      gpsString: '  12.9716 ,  77.5946  ',
      speed: 30,
      fuel: 50,
      engineTemp: 80,
    });
    expect(result.lat).toBe(12.9716);
    expect(result.lng).toBe(77.5946);
  });

  it('computes a near-zero distance for a point at the depot', async () => {
    const result = await runCoordinateParserWorker({
      gpsString: '12.9716,77.5946',
      speed: 0,
      fuel: 100,
      engineTemp: 70,
    });
    expect(result.distanceFromDepot).toBeLessThan(0.01);
  });

  it('computes a sensible distance for a far-away point', async () => {
    // ~111 km north of the depot (1 degree latitude)
    const result = await runCoordinateParserWorker({
      gpsString: '13.9716,77.5946',
      speed: 0,
      fuel: 100,
      engineTemp: 70,
    });
    expect(result.distanceFromDepot).toBeGreaterThan(100);
    expect(result.distanceFromDepot).toBeLessThan(120);
  });

  it('rejects malformed GPS strings', async () => {
    await expect(
      runCoordinateParserWorker({
        gpsString: 'not-a-coordinate',
        speed: 10,
        fuel: 50,
        engineTemp: 80,
      })
    ).rejects.toThrow();
  });

  it('rejects out-of-range latitude', async () => {
    await expect(
      runCoordinateParserWorker({
        gpsString: '95.0,77.5946',
        speed: 10,
        fuel: 50,
        engineTemp: 80,
      })
    ).rejects.toThrow(/Latitude out of bounds/i);
  });

  it('rejects out-of-range longitude', async () => {
    await expect(
      runCoordinateParserWorker({
        gpsString: '12.9716,190.0',
        speed: 10,
        fuel: 50,
        engineTemp: 80,
      })
    ).rejects.toThrow(/Longitude out of bounds/i);
  });

  it('coerces numeric string fields to numbers', async () => {
    const result = await runCoordinateParserWorker({
      gpsString: '12.9716,77.5946',
      speed: '42.5',
      fuel: '66',
      engineTemp: '84',
    });
    expect(result.speed).toBe(42.5);
    expect(result.fuel).toBe(66);
    expect(result.engineTemp).toBe(84);
  });
});
