import { getSafeId, safeParseInt } from '../../lib/utils/parse';
import { ValidationError } from '../../lib/exceptions';

describe('lib/utils/parse', () => {
  describe('safeParseInt', () => {
    it('should parse a valid integer string', () => {
      expect(safeParseInt('123', 0)).toBe(123);
    });

    it('should return fallback for non-integer strings', () => {
      expect(safeParseInt('abc', 10)).toBe(10);
    });

    it('should return fallback for null or undefined', () => {
      expect(safeParseInt(null, 5)).toBe(5);
      expect(safeParseInt(undefined, 5)).toBe(5);
    });

    it('should handle empty strings', () => {
      expect(safeParseInt('', 0)).toBe(0);
    });
  });

  describe('getSafeId', () => {
    it('should return a number for valid numeric ID strings', () => {
      expect(getSafeId('1')).toBe(1);
      expect(getSafeId('42')).toBe(42);
    });

    it('should throw ValidationError for non-numeric strings', () => {
      expect(() => getSafeId('abc')).toThrow(ValidationError);
      expect(() => getSafeId('abc')).toThrow(/n'est pas valide/);
    });

    it('should throw ValidationError for non-integer numeric strings', () => {
      expect(() => getSafeId('1.5')).toThrow(ValidationError);
    });

    it('should throw ValidationError for zero or negative IDs', () => {
      expect(() => getSafeId('0')).toThrow(ValidationError);
      expect(() => getSafeId('-5')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null, undefined, or empty strings', () => {
      expect(() => getSafeId(null)).toThrow(ValidationError);
      expect(() => getSafeId(undefined)).toThrow(ValidationError);
      expect(() => getSafeId('')).toThrow(ValidationError);
    });

    it('should use custom field name in error messages', () => {
      expect(() => getSafeId('abc', 'userId')).toThrow(/userId/);
    });
  });
});
