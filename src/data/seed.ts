import type { Attacker, TargetBand } from '../engine/types';

/**
 * EXAMPLE seed data — invented numbers for UI demos only.
 * Not Games Workshop / Munitorum Field Manual gospel. Type your own stats.
 */
export const SEED_ATTACKERS: Attacker[] = [
  {
    id: 'atk-example-intercessors',
    name: 'Example Intercessor Squad',
    points: 80,
    weapons: [
      {
        id: 'wpn-bolt-rifle',
        name: 'EXAMPLE Bolt Rifle (×10)',
        attacks: 20,
        skill: 3,
        strength: 4,
        ap: -1,
        damage: 1,
        keywords: ['Lethal Hits'],
      },
    ],
  },
  {
    id: 'atk-example-eradicators',
    name: 'Example Eradicator Cell',
    points: 95,
    weapons: [
      {
        id: 'wpn-melta',
        name: 'EXAMPLE Melta Rifle (×3)',
        attacks: 3,
        skill: 3,
        strength: 9,
        ap: -4,
        damage: 'D6',
        keywords: [],
      },
    ],
  },
  {
    id: 'atk-example-hellblaster',
    name: 'Example Hellblaster Pack',
    points: 110,
    weapons: [
      {
        id: 'wpn-plasma',
        name: 'EXAMPLE Plasma Incinerator (×5)',
        attacks: 10,
        skill: 3,
        strength: 8,
        ap: -3,
        damage: 2,
        keywords: [{ kind: 'Sustained Hits', n: 1 }],
      },
    ],
  },
];

export const SEED_BANDS: TargetBand[] = [
  {
    id: 'band-t3-4',
    label: 'T3–T4 infantry',
    toughness: 4,
    woundsPerModel: 2,
    models: 10,
    save: 3,
    points: 160,
    notes: 'EXAMPLE mid-armor MEQ-ish brick',
  },
  {
    id: 'band-t5',
    label: 'T5 elite',
    toughness: 5,
    woundsPerModel: 3,
    models: 5,
    save: 3,
    invuln: 4,
    points: 175,
    notes: 'EXAMPLE elite with invuln',
  },
  {
    id: 'band-t6',
    label: 'T6 light vehicle / monster',
    toughness: 6,
    woundsPerModel: 10,
    models: 1,
    save: 3,
    points: 150,
    notes: 'EXAMPLE single mid-T profile',
  },
  {
    id: 'band-t7-8',
    label: 'T7–T8 vehicle',
    toughness: 8,
    woundsPerModel: 12,
    models: 1,
    save: 2,
    points: 200,
    notes: 'EXAMPLE heavy armor',
  },
  {
    id: 'band-t9-10',
    label: 'T9–T10 heavy',
    toughness: 10,
    woundsPerModel: 16,
    models: 1,
    save: 2,
    invuln: 5,
    points: 280,
    notes: 'EXAMPLE super-heavy / knight-ish',
  },
  {
    id: 'band-t11-12',
    label: 'T11–T12+',
    toughness: 12,
    woundsPerModel: 24,
    models: 1,
    save: 2,
    invuln: 4,
    fnp: 5,
    points: 400,
    notes: 'EXAMPLE titan-adjacent brick',
  },
];
