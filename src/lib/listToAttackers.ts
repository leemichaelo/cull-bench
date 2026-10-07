import type { Attacker, WeaponProfile } from '../engine/types';
import type { ParsedList, ParsedUnit } from './listParse';

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'unit'
  );
}

function newId(prefix: string, name: string, index: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${slug(name)}-${index}`;
}

/** Placeholder stats — used when catalog miss or before enrichment. */
function placeholderWeapon(name: string, index: number): WeaponProfile {
  return {
    id: newId('wpn', name, index),
    name,
    attacks: 1,
    skill: 3,
    strength: 4,
    ap: 0,
    damage: 1,
    keywords: [],
  };
}

export function unitToAttacker(unit: ParsedUnit, index: number): Attacker {
  const hints = unit.weaponHints.filter(Boolean);
  const weapons =
    hints.length > 0
      ? hints.map((h, i) => placeholderWeapon(h, i))
      : [placeholderWeapon('(add weapon — type stats)', 0)];

  return {
    id: newId('atk', unit.name, index),
    name: unit.name,
    points: unit.points,
    weapons,
  };
}

/** Sync fallback without catalog (tests / offline). Prefer listToEnrichedAttackers. */
export function listToAttackers(list: ParsedList): Attacker[] {
  return list.units.map((u, i) => unitToAttacker(u, i));
}
