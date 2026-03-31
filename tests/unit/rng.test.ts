import { describe, it, expect } from 'vitest';
import { RNG } from '../../js/engine/rng';

describe('RNG', () => {
  describe('constructor', () => {
    it('accepts a seed', () => {
      const rng = new RNG(42);
      expect(rng.seed).toBe(42);
    });

    it('uses fallback seed for 0', () => {
      const rng = new RNG(0);
      expect(rng.seed).toBe(0xDEADBEEF);
    });
  });

  describe('next()', () => {
    it('returns a value in [0, 1)', () => {
      const rng = new RNG(1);
      for (let i = 0; i < 100; i++) {
        const v = rng.next();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it('is deterministic for the same seed', () => {
      const r1 = new RNG(999);
      const r2 = new RNG(999);
      for (let i = 0; i < 20; i++) {
        expect(r1.next()).toBe(r2.next());
      }
    });

    it('produces different sequences for different seeds', () => {
      const r1 = new RNG(1);
      const r2 = new RNG(2);
      const vals1 = Array.from({ length: 10 }, () => r1.next());
      const vals2 = Array.from({ length: 10 }, () => r2.next());
      expect(vals1).not.toEqual(vals2);
    });
  });

  describe('int(min, max)', () => {
    it('returns a value in [min, max] inclusive', () => {
      const rng = new RNG(42);
      for (let i = 0; i < 200; i++) {
        const v = rng.int(3, 7);
        expect(v).toBeGreaterThanOrEqual(3);
        expect(v).toBeLessThanOrEqual(7);
      }
    });

    it('returns min when min === max', () => {
      const rng = new RNG(42);
      for (let i = 0; i < 10; i++) {
        expect(rng.int(5, 5)).toBe(5);
      }
    });

    it('returns an integer', () => {
      const rng = new RNG(7);
      for (let i = 0; i < 50; i++) {
        const v = rng.int(0, 100);
        expect(Number.isInteger(v)).toBe(true);
      }
    });
  });

  describe('float(min, max)', () => {
    it('returns a value in [min, max)', () => {
      const rng = new RNG(42);
      for (let i = 0; i < 200; i++) {
        const v = rng.float(1.5, 3.5);
        expect(v).toBeGreaterThanOrEqual(1.5);
        expect(v).toBeLessThan(3.5);
      }
    });
  });

  describe('pick(arr)', () => {
    it('returns undefined for empty array', () => {
      const rng = new RNG(1);
      expect(rng.pick([])).toBeUndefined();
    });

    it('returns the only element for a single-element array', () => {
      const rng = new RNG(1);
      expect(rng.pick(['only'])).toBe('only');
    });

    it('returns elements from the array', () => {
      const rng = new RNG(42);
      const arr = ['a', 'b', 'c', 'd'];
      for (let i = 0; i < 50; i++) {
        expect(arr).toContain(rng.pick(arr));
      }
    });
  });

  describe('weightedPick(items)', () => {
    it('always returns the single item when only one provided', () => {
      const rng = new RNG(1);
      for (let i = 0; i < 10; i++) {
        expect(rng.weightedPick([{ value: 'x', weight: 5 }])).toBe('x');
      }
    });

    it('never selects an item with weight 0', () => {
      const rng = new RNG(42);
      const items = [
        { value: 'zero', weight: 0 },
        { value: 'positive', weight: 100 },
      ];
      for (let i = 0; i < 50; i++) {
        expect(rng.weightedPick(items)).toBe('positive');
      }
    });

    it('favors higher-weighted items over many samples', () => {
      const rng = new RNG(123);
      const items = [
        { value: 'rare', weight: 1 },
        { value: 'common', weight: 99 },
      ];
      const counts: Record<string, number> = { rare: 0, common: 0 };
      for (let i = 0; i < 1000; i++) {
        counts[rng.weightedPick(items)]++;
      }
      expect(counts.common).toBeGreaterThan(counts.rare);
    });
  });

  describe('shuffle(arr)', () => {
    it('preserves array length', () => {
      const rng = new RNG(1);
      const arr = [1, 2, 3, 4, 5];
      rng.shuffle(arr);
      expect(arr).toHaveLength(5);
    });

    it('preserves all original elements', () => {
      const rng = new RNG(7);
      const arr = [10, 20, 30, 40, 50];
      const original = [...arr];
      rng.shuffle(arr);
      expect(arr.sort()).toEqual(original.sort());
    });

    it('is deterministic for the same seed', () => {
      const arr1 = [1, 2, 3, 4, 5, 6, 7, 8];
      const arr2 = [...arr1];
      new RNG(55).shuffle(arr1);
      new RNG(55).shuffle(arr2);
      expect(arr1).toEqual(arr2);
    });

    it('produces different orders for different seeds', () => {
      const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const arr2 = [...arr1];
      new RNG(1).shuffle(arr1);
      new RNG(2).shuffle(arr2);
      expect(arr1).not.toEqual(arr2);
    });
  });

  describe('roll(n, s)', () => {
    it('returns a value in [n, n*s]', () => {
      const rng = new RNG(42);
      for (let i = 0; i < 100; i++) {
        const v = rng.roll(3, 6); // 3d6 → [3, 18]
        expect(v).toBeGreaterThanOrEqual(3);
        expect(v).toBeLessThanOrEqual(18);
      }
    });

    it('returns 0 for 0 dice', () => {
      const rng = new RNG(1);
      expect(rng.roll(0, 6)).toBe(0);
    });

    it('returns an integer', () => {
      const rng = new RNG(42);
      expect(Number.isInteger(rng.roll(2, 8))).toBe(true);
    });
  });

  describe('chance(percent)', () => {
    it('always returns false for 0%', () => {
      const rng = new RNG(42);
      for (let i = 0; i < 50; i++) {
        expect(rng.chance(0)).toBe(false);
      }
    });

    it('always returns true for 100%', () => {
      const rng = new RNG(42);
      for (let i = 0; i < 50; i++) {
        expect(rng.chance(100)).toBe(true);
      }
    });

    it('returns a boolean', () => {
      const rng = new RNG(42);
      expect(typeof rng.chance(50)).toBe('boolean');
    });

    it('roughly matches expected probability over many samples', () => {
      const rng = new RNG(123);
      let trueCount = 0;
      const samples = 2000;
      for (let i = 0; i < samples; i++) {
        if (rng.chance(30)) trueCount++;
      }
      // Expect roughly 30% ± 5%
      const pct = trueCount / samples;
      expect(pct).toBeGreaterThan(0.25);
      expect(pct).toBeLessThan(0.35);
    });
  });

  describe('word()', () => {
    it('returns a non-empty string', () => {
      const rng = new RNG(1);
      const w = rng.word();
      expect(typeof w).toBe('string');
      expect(w.length).toBeGreaterThan(0);
    });

    it('starts with an uppercase letter', () => {
      const rng = new RNG(42);
      for (let i = 0; i < 20; i++) {
        const w = rng.word();
        expect(w[0]).toBe(w[0].toUpperCase());
      }
    });

    it('respects minSyl=1 maxSyl=1 (short word)', () => {
      const rng = new RNG(7);
      for (let i = 0; i < 20; i++) {
        const w = rng.word(1, 1);
        // With 1 syllable, the word should be shorter than with 3 syllables
        expect(w.length).toBeGreaterThan(0);
        expect(w.length).toBeLessThanOrEqual(6); // onset(2) + nucleus(2) + coda(2)
      }
    });

    it('is deterministic with the same seed', () => {
      expect(new RNG(100).word()).toBe(new RNG(100).word());
    });
  });
});
