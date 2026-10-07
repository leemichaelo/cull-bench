import type { Attacker, DiceExpr, WeaponProfile } from '../engine/types';
import type { CatalogSheet, CatalogWeapon, EnrichmentMeta } from './catalogTypes';
import { loadCatalog, getCatalogLoadError } from './loadCatalog';
import { matchSheet, normalizeName } from './matchSheet';
import type { ParsedList, ParsedUnit } from './listParse';
import { parseDiceExpr, parseWeaponKeywords } from './weaponKeywords';

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

function catalogWeaponToProfile(w: CatalogWeapon, index: number): WeaponProfile {
  const attacks = parseDiceExpr(w.a) as DiceExpr;
  const damage = parseDiceExpr(w.d) as DiceExpr;
  return {
    id: newId('wpn', w.n, index),
    name: w.n.replace(/^\u27a4\s*/, '').trim() || w.n,
    attacks,
    skill: typeof w.sk === 'number' && w.sk > 0 ? w.sk : 4,
    strength: typeof w.s === 'number' && w.s > 0 ? w.s : 4,
    ap: typeof w.ap === 'number' ? w.ap : 0,
    damage,
    keywords: parseWeaponKeywords(w.k),
  };
}

/** Prefer list weapon hints when they match catalog names; else all rng+mel (capped). */
export function pickWeaponsFromSheet(
  sheet: CatalogSheet,
  hints: string[],
): WeaponProfile[] {
  const all = [...(sheet.rng || []), ...(sheet.mel || [])];
  if (!all.length) return [];

  if (hints.length) {
    const picked = all.filter((w) =>
      hints.some((h) => {
        const hn = normalizeName(h);
        const wn = normalizeName(w.n);
        return hn && wn && (wn.includes(hn) || hn.includes(wn));
      }),
    );
    if (picked.length) {
      return picked.map((w, i) => catalogWeaponToProfile(w, i));
    }
  }

  // Cap to keep UI manageable (prefer a few ranged + a few melee)
  const rng = (sheet.rng || []).slice(0, 4);
  const mel = (sheet.mel || []).slice(0, 4);
  const chosen = [...rng, ...mel];
  return chosen.map((w, i) => catalogWeaponToProfile(w, i));
}

export function unitToAttackerFromSheet(
  unit: ParsedUnit,
  sheet: CatalogSheet | null,
  index: number,
): Attacker {
  let weapons: WeaponProfile[];
  if (sheet) {
    weapons = pickWeaponsFromSheet(sheet, unit.weaponHints);
  } else {
    weapons = [];
  }
  if (!weapons.length) {
    const hints = unit.weaponHints.filter(Boolean);
    weapons =
      hints.length > 0
        ? hints.map((h, i) => placeholderWeapon(h, i))
        : [placeholderWeapon('(add weapon \u2014 type stats)', 0)];
  }

  // Prefer list points when present; fall back to catalog points
  const points =
    unit.points > 0 ? unit.points : typeof sheet?.p === 'number' ? sheet.p : 0;

  return {
    id: newId('atk', unit.name, index),
    name: unit.name,
    points,
    weapons,
  };
}

export interface EnrichResult {
  attackers: Attacker[];
  meta: EnrichmentMeta;
}

/**
 * After parse: match each unit to the bundled catalog and fill real weapon profiles.
 * Unmatched units keep placeholder weapons and are listed in meta.unmatchedNames.
 */
export function enrichAttackersFromCatalog(
  list: ParsedList,
  catalog: CatalogSheet[],
): EnrichResult {
  const unmatchedNames: string[] = [];
  let matched = 0;

  const attackers = list.units.map((unit, i) => {
    const hit =
      catalog.length > 0
        ? matchSheet(unit.name, list.faction, catalog)
        : null;
    if (hit) {
      matched += 1;
      return unitToAttackerFromSheet(unit, hit.sheet, i);
    }
    unmatchedNames.push(unit.name);
    return unitToAttackerFromSheet(unit, null, i);
  });

  return {
    attackers,
    meta: {
      matched,
      unmatched: unmatchedNames.length,
      unmatchedNames,
      catalogLoaded: catalog.length > 0,
    },
  };
}

/** Async helper: load catalog then enrich. */
export async function listToEnrichedAttackers(
  list: ParsedList,
): Promise<EnrichResult> {
  const catalog = await loadCatalog();
  const result = enrichAttackersFromCatalog(list, catalog);
  const err = getCatalogLoadError();
  if (err) {
    result.meta.catalogError = err;
    result.meta.catalogLoaded = false;
  }
  return result;
}
