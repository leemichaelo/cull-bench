import { describe, expect, it } from 'vitest';
import { expectedDice, rollProbs } from './dice';
import { expectedDamageWeapon } from './expectedDamage';
import type { Modifiers, TargetBand, WeaponProfile } from './types';
import { DEFAULT_MODIFIERS } from './types';

const mods = (over: Partial<Modifiers> = {}): Modifiers => ({
  ...DEFAULT_MODIFIERS,
  ...over,
});

const band = (over: Partial<TargetBand> = {}): TargetBand => ({
  id: 'b',
  label: 'test',
  toughness: 4,
  woundsPerModel: 1,
  models: 10,
  save: 7, // no save (always fail unless invuln)
  points: 100,
  ...over,
});

const weapon = (over: Partial<WeaponProfile> = {}): WeaponProfile => ({
  id: 'w',
  name: 'test',
  attacks: 6,
  skill: 3,
  strength: 4,
  ap: 0,
  damage: 1,
  keywords: [],
  ...over,
});

describe('expectedDice', () => {
  it('parses flat and dice expressions', () => {
    expect(expectedDice(4)).toBe(4);
    expect(expectedDice('D6')).toBe(3.5);
    expect(expectedDice('2D6')).toBe(7);
    expect(expectedDice('D3+3')).toBe(5);
  });
});

describe('rollProbs', () => {
  it('3+ without reroll is 4/6 success and 1/6 crit', () => {
    const { pSuccess, pCrit } = rollProbs(3, 'none', 6);
    expect(pSuccess).toBeCloseTo(4 / 6, 5);
    expect(pCrit).toBeCloseTo(1 / 6, 5);
  });

  it('reroll ones improves 3+ hits', () => {
    const base = rollProbs(3, 'none', 6);
    const rr = rollProbs(3, 'ones', 6);
    expect(rr.pSuccess).toBeGreaterThan(base.pSuccess);
  });
});

describe('expectedDamageWeapon', () => {
  it('Torrent auto-hits and wounds on 4+ vs equal T with no save', () => {
    const r = expectedDamageWeapon(
      weapon({
        attacks: 6,
        strength: 4,
        damage: 1,
        keywords: ['Torrent'],
      }),
      band({ toughness: 4, save: 7, woundsPerModel: 1, models: 10 }),
      mods(),
    );
    // 6 hits, wound 4+ = 0.5 → 3 unsaved (save 7+ always fails), D1 → 3 wounds / 3 models
    expect(r.expectedUnsaved).toBeCloseTo(3, 5);
    expect(r.expectedModelsKilled).toBeCloseTo(3, 5);
    expect(r.expectedWoundsDealt).toBeCloseTo(3, 5);
  });

  it('Lethal Hits auto-wounds on crits', () => {
    const without = expectedDamageWeapon(
      weapon({ attacks: 6, skill: 3, strength: 4, keywords: [] }),
      band({ save: 7 }),
      mods(),
    );
    const withLethal = expectedDamageWeapon(
      weapon({
        attacks: 6,
        skill: 3,
        strength: 4,
        keywords: ['Lethal Hits'],
      }),
      band({ save: 7 }),
      mods(),
    );
    expect(withLethal.expectedUnsaved).toBeGreaterThan(without.expectedUnsaved);
  });

  it('no spillover: D6 into 2W model kills at most one model per unsaved when D avg applies via ceil', () => {
    // D=3 into 2W → one unsaved kills one model (ceil(2/3)=1)
    const r = expectedDamageWeapon(
      weapon({
        attacks: 1,
        skill: 2,
        strength: 8,
        damage: 3,
        keywords: ['Torrent'],
      }),
      band({
        toughness: 4,
        woundsPerModel: 2,
        models: 5,
        save: 7,
      }),
      mods(),
    );
    // 1 hit, wound 2+ = 5/6, all unsaved → models killed = (5/6)/1
    expect(r.expectedModelsKilled).toBeCloseTo(5 / 6, 5);
    // wounds dealt capped per allocation at min(3,2)=2
    expect(r.expectedWoundsDealt).toBeCloseTo((5 / 6) * 2, 5);
  });

  it('Blast adds floor(models/5) attacks', () => {
    const r = expectedDamageWeapon(
      weapon({
        attacks: 0,
        keywords: ['Torrent', 'Blast'],
        strength: 4,
        damage: 1,
      }),
      band({ models: 10, toughness: 4, save: 7, woundsPerModel: 1 }),
      mods(),
    );
    // 2 blast attacks, wound 4+ → 1 unsaved
    expect(r.expectedUnsaved).toBeCloseTo(1, 5);
  });

  it('invuln caps save when better than modified armor', () => {
    const noInv = expectedDamageWeapon(
      weapon({ attacks: 6, skill: 2, strength: 8, ap: -3, keywords: ['Torrent'] }),
      band({ toughness: 4, save: 3, woundsPerModel: 1 }),
      mods(),
    );
    const withInv = expectedDamageWeapon(
      weapon({ attacks: 6, skill: 2, strength: 8, ap: -3, keywords: ['Torrent'] }),
      band({ toughness: 4, save: 3, invuln: 4, woundsPerModel: 1 }),
      mods(),
    );
    // With invuln 4++, more saves succeed → fewer unsaved
    expect(withInv.expectedUnsaved).toBeLessThan(noInv.expectedUnsaved);
  });
});
