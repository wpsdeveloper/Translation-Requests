import { describe, it, expect } from 'vitest';
import { formatDate, formatTime } from '../client/services/utils.js';

describe('utils.js', () => {
  describe('formatDate', () => {
    it('should format date as MM/DD/YYYY', () => {
      const date = new Date('2023-10-25T12:00:00');
      // toLocaleDateString depends on system locale in some environments, 
      // but 'en-US' should be consistent.
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('10/25/2023');
    });

    it('should format date as MMM D, YYYY', () => {
      const date = new Date('2023-10-25T12:00:00');
      expect(formatDate(date, 'MMM D, YYYY')).toBe('Oct 25, 2023');
    });

    it('should return empty string on error', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('not a date')).toBe('');
    });
  });

  describe('formatTime', () => {
    it('should format time as h:mm A', () => {
      const date = new Date();
      date.setHours(14, 30, 0); // 2:30 PM
      expect(formatTime(date, 'h:mm A')).toMatch(/2:30\s*PM/);
    });

    it('should format morning time as h:mm A', () => {
      const date = new Date();
      date.setHours(9, 5, 0); // 9:05 AM
      expect(formatTime(date, 'h:mm A')).toMatch(/9:05\s*AM/);
    });

    it('should return empty string for invalid inputs', () => {
      expect(formatTime(null)).toBe('');
      expect(formatTime('12:00')).toBe('');
      expect(formatTime(new Date('invalid'))).toBe('');
    });
  });
});
