import { cn, LocalStorage, SessionStorage, InputDate, ShowDate, formatNumber } from '../utils';

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
    });
  });

  describe('LocalStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should set and get items', () => {
      LocalStorage.setItem('test-key', 'test-value');
      expect(LocalStorage.getItem('test-key')).toBe('test-value');
    });

    it('should remove items', () => {
      LocalStorage.setItem('test-key', 'test-value');
      LocalStorage.removeItem('test-key');
      expect(LocalStorage.getItem('test-key')).toBeNull();
    });

    it('should return null for non-existent keys', () => {
      expect(LocalStorage.getItem('non-existent')).toBeNull();
    });
  });

  describe('SessionStorage', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('should set and get items', () => {
      SessionStorage.setItem('test-key', 'test-value');
      expect(SessionStorage.getItem('test-key')).toBe('test-value');
    });

    it('should remove items', () => {
      SessionStorage.setItem('test-key', 'test-value');
      SessionStorage.removeItem('test-key');
      expect(SessionStorage.getItem('test-key')).toBeNull();
    });

    it('should return null for non-existent keys', () => {
      expect(SessionStorage.getItem('non-existent')).toBeNull();
    });
  });

  describe('InputDate', () => {
    it('should format date for input field', () => {
      const date = new Date('2024-01-15');
      expect(InputDate(date)).toBe('2024-01-15');
    });

    it('should handle string dates', () => {
      expect(InputDate('2024-03-05')).toBe('2024-03-05');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2024-01-05');
      expect(InputDate(date)).toBe('2024-01-05');
    });
  });

  describe('ShowDate', () => {
    it('should format date for display', () => {
      const date = new Date('2024-01-15');
      expect(ShowDate(date)).toBe('15/01/2024');
    });

    it('should handle string dates', () => {
      expect(ShowDate('2024-03-05')).toBe('05/03/2024');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2024-01-05');
      expect(ShowDate(date)).toBe('05/01/2024');
    });
  });

  describe('formatNumber', () => {
    it('should pad numbers to 4 digits', () => {
      expect(formatNumber(1)).toBe('0001');
      expect(formatNumber(42)).toBe('0042');
      expect(formatNumber(123)).toBe('0123');
      expect(formatNumber(1234)).toBe('1234');
    });

    it('should handle numbers with more than 4 digits', () => {
      expect(formatNumber(12345)).toBe('12345');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0000');
    });
  });
});

