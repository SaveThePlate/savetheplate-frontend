import { calculateDistance, formatDistance } from '../distanceUtils';

describe('distanceUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Paris to London (approximately 344 km)
      const paris = { lat: 48.8566, lon: 2.3522 };
      const london = { lat: 51.5074, lon: -0.1278 };
      
      const distance = calculateDistance(paris.lat, paris.lon, london.lat, london.lon);
      
      // Allow some margin of error (±10 km)
      expect(distance).toBeGreaterThan(334);
      expect(distance).toBeLessThan(354);
    });

    it('should return 0 for the same coordinates', () => {
      const distance = calculateDistance(48.8566, 2.3522, 48.8566, 2.3522);
      expect(distance).toBeCloseTo(0, 2);
    });

    it('should return Infinity for invalid coordinates', () => {
      expect(calculateDistance(NaN, 2.3522, 48.8566, 2.3522)).toBe(Infinity);
      expect(calculateDistance(48.8566, NaN, 48.8566, 2.3522)).toBe(Infinity);
      expect(calculateDistance(0, 0, NaN, 2.3522)).toBe(Infinity);
    });

    it('should return Infinity for null/undefined coordinates', () => {
      expect(calculateDistance(null as any, 2.3522, 48.8566, 2.3522)).toBe(Infinity);
      expect(calculateDistance(48.8566, undefined as any, 48.8566, 2.3522)).toBe(Infinity);
    });
  });

  describe('formatDistance', () => {
    it('should format distance in meters when less than 1 km', () => {
      expect(formatDistance(0.5)).toBe('500 m');
      expect(formatDistance(0.123)).toBe('123 m');
      expect(formatDistance(0.999)).toBe('999 m');
    });

    it('should format distance in kilometers when 1 km or more', () => {
      expect(formatDistance(1)).toBe('1.0 km');
      expect(formatDistance(1.234)).toBe('1.2 km');
      expect(formatDistance(10.567)).toBe('10.6 km');
      expect(formatDistance(100)).toBe('100.0 km');
    });

    it('should return "—" for invalid distances', () => {
      expect(formatDistance(Infinity)).toBe('—');
      expect(formatDistance(NaN)).toBe('—');
    });

    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0 m');
    });
  });
});

