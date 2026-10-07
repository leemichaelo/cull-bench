import type { Attacker, Modifiers, TargetBand } from '../engine/types';
import { DEFAULT_MODIFIERS, DEFAULT_THRESHOLD } from '../engine/types';
import { SEED_ATTACKERS, SEED_BANDS } from '../data/seed';

const KEY = 'cull-bench:v1';

export interface PersistedState {
  attackers: Attacker[];
  bands: TargetBand[];
  threshold: number;
  modifiers: Modifiers;
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return {
        attackers: structuredClone(SEED_ATTACKERS),
        bands: structuredClone(SEED_BANDS),
        threshold: DEFAULT_THRESHOLD,
        modifiers: { ...DEFAULT_MODIFIERS },
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      attackers: parsed.attackers ?? structuredClone(SEED_ATTACKERS),
      bands: parsed.bands ?? structuredClone(SEED_BANDS),
      threshold:
        typeof parsed.threshold === 'number'
          ? parsed.threshold
          : DEFAULT_THRESHOLD,
      modifiers: { ...DEFAULT_MODIFIERS, ...(parsed.modifiers ?? {}) },
    };
  } catch {
    return {
      attackers: structuredClone(SEED_ATTACKERS),
      bands: structuredClone(SEED_BANDS),
      threshold: DEFAULT_THRESHOLD,
      modifiers: { ...DEFAULT_MODIFIERS },
    };
  }
}

export function saveState(state: PersistedState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetToSeed(): PersistedState {
  const state: PersistedState = {
    attackers: structuredClone(SEED_ATTACKERS),
    bands: structuredClone(SEED_BANDS),
    threshold: DEFAULT_THRESHOLD,
    modifiers: { ...DEFAULT_MODIFIERS },
  };
  saveState(state);
  return state;
}
