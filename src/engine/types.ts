/** Cull Bench domain types — EXAMPLE stats only; type your own from your books/app. */

export type DiceExpr = number | string; // number or "D6" | "2D6" | "D3" | "D3+3" etc.

export type WeaponKeyword =
  | 'Lethal Hits'
  | 'Devastating Wounds'
  | 'Torrent'
  | 'Blast'
  | { kind: 'Sustained Hits'; n: number }
  | { kind: 'Anti'; n: number }; // Anti-X N+ → crit wound on N+

export interface WeaponProfile {
  id: string;
  name: string;
  attacks: DiceExpr;
  skill: number; // 2–6; ignored if Torrent
  strength: number;
  ap: number; // typically 0, -1, -2, …
  damage: DiceExpr;
  keywords: WeaponKeyword[];
}

export interface Attacker {
  id: string;
  name: string;
  points: number;
  weapons: WeaponProfile[];
}

export interface TargetBand {
  id: string;
  label: string;
  toughness: number;
  woundsPerModel: number;
  models: number;
  save: number; // e.g. 3 for 3+
  invuln?: number; // e.g. 4 for 4++
  fnp?: number; // e.g. 5 for 5+
  points: number; // whole unit/profile points
  notes?: string;
}

export interface Modifiers {
  hitMod: number; // -1 | 0 | 1 (and beyond)
  woundMod: number;
  apMod: number; // applied to weapon AP (e.g. +1 makes AP less negative / worse for attacker)
  cover: boolean; // 11e-style: BS+1 (harder to hit)
  lethalHits: boolean; // force on even if weapon lacks keyword
  sustainedHits: number | null; // null = use weapon keyword only; number overrides/adds
  devastatingWounds: boolean;
  antiCritOn: number | null; // e.g. 4 for Anti 4+; null = weapon keyword or 6
  rerollHits: 'none' | 'ones' | 'all';
  rerollWounds: 'none' | 'ones' | 'all';
}

export interface AttackResult {
  attackerId: string;
  attackerName: string;
  attackerPoints: number;
  bandId: string;
  bandLabel: string;
  expectedWoundsDealt: number;
  expectedModelsKilled: number;
  expectedPointsRemoved: number;
  efficiencyRatio: number; // ptsRemoved / attacker.points
  passThreshold: boolean;
  underkill: boolean;
}

export const DEFAULT_MODIFIERS: Modifiers = {
  hitMod: 0,
  woundMod: 0,
  apMod: 0,
  cover: false,
  lethalHits: false,
  sustainedHits: null,
  devastatingWounds: false,
  antiCritOn: null,
  rerollHits: 'none',
  rerollWounds: 'none',
};

export const DEFAULT_THRESHOLD = 80;
