import { describe, expect, it } from 'vitest';
import { woundTarget } from './woundTarget';

describe('woundTarget', () => {
  it('returns 2+ when S >= 2T', () => {
    expect(woundTarget(8, 4)).toBe(2);
    expect(woundTarget(10, 5)).toBe(2);
  });

  it('returns 3+ when S > T but not double', () => {
    expect(woundTarget(5, 4)).toBe(3);
    expect(woundTarget(9, 8)).toBe(3);
  });

  it('returns 4+ when S === T', () => {
    expect(woundTarget(4, 4)).toBe(4);
    expect(woundTarget(8, 8)).toBe(4);
  });

  it('returns 5+ when S < T but better than half', () => {
    expect(woundTarget(4, 5)).toBe(5);
    expect(woundTarget(5, 8)).toBe(5);
  });

  it('returns 6+ when S <= T/2', () => {
    expect(woundTarget(4, 8)).toBe(6);
    expect(woundTarget(3, 6)).toBe(6);
    expect(woundTarget(4, 9)).toBe(6);
  });
});
