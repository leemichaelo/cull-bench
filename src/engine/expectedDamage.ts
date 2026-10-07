import { expectedDice, rollProbs } from './dice';
import { woundTarget } from './woundTarget';
import type {
  Attacker,
  AttackResult,
  Modifiers,
  TargetBand,
  WeaponKeyword,
  WeaponProfile,
} from './types';

function hasKeyword(keywords: WeaponKeyword[], name: string): boolean {
  return keywords.some((k) => typeof k === 'string' && k === name);
}

function sustainedN(keywords: WeaponKeyword[]): number | null {
  for (const k of keywords) {
    if (typeof k === 'object' && k.kind === 'Sustained Hits') return k.n;
  }
  return null;
}

function antiN(keywords: WeaponKeyword[]): number | null {
  for (const k of keywords) {
    if (typeof k === 'object' && k.kind === 'Anti') return k.n;
  }
  return null;
}

export interface WeaponBandResult {
  expectedWoundsDealt: number;
  expectedModelsKilled: number;
  expectedUnsaved: number;
}

/**
 * Expected-value resolve for one weapon profile vs one target band.
 * Pipeline: attacks → hit → wound → save → damage (no spillover between models).
 */
export function expectedDamageWeapon(
  weapon: WeaponProfile,
  band: TargetBand,
  mods: Modifiers,
): WeaponBandResult {
  const torrent = hasKeyword(weapon.keywords, 'Torrent');
  const blast = hasKeyword(weapon.keywords, 'Blast');
  const lethal =
    mods.lethalHits || hasKeyword(weapon.keywords, 'Lethal Hits');
  const devWounds =
    mods.devastatingWounds ||
    hasKeyword(weapon.keywords, 'Devastating Wounds');

  let sustain: number | null = mods.sustainedHits;
  if (sustain === null) sustain = sustainedN(weapon.keywords);

  let critWoundOn = mods.antiCritOn;
  if (critWoundOn === null) critWoundOn = antiN(weapon.keywords);
  if (critWoundOn === null) critWoundOn = 6;

  let attacks = expectedDice(weapon.attacks);
  if (blast) {
    attacks += Math.floor(band.models / 5);
  }

  // --- Hit ---
  let expectedLethalHits = 0;
  let expectedNormalHits: number;

  if (torrent) {
    expectedNormalHits = attacks;
    expectedLethalHits = 0;
  } else {
    const hitTarget =
      weapon.skill + mods.hitMod + (mods.cover ? 1 : 0);
    const { pSuccess, pCrit } = rollProbs(
      hitTarget,
      mods.rerollHits,
      6,
    );

    const baseHits = attacks * pSuccess;
    const critHits = attacks * pCrit;
    const extraFromSustain =
      sustain && sustain > 0 ? critHits * sustain : 0;
    const expectedHits = baseHits + extraFromSustain;

    if (lethal) {
      expectedLethalHits = critHits;
      expectedNormalHits = expectedHits - expectedLethalHits;
    } else {
      expectedLethalHits = 0;
      expectedNormalHits = expectedHits;
    }
  }

  // --- Wound ---
  const baseWoundTarget = woundTarget(weapon.strength, band.toughness);
  const woundT = baseWoundTarget + mods.woundMod;
  const { pSuccess: pWound, pCrit: pWoundCrit } = rollProbs(
    woundT,
    mods.rerollWounds,
    critWoundOn,
  );

  const woundsFromNormal = expectedNormalHits * pWound;
  const critWoundsFromNormal = expectedNormalHits * pWoundCrit;
  const nonCritWoundsFromNormal = woundsFromNormal - critWoundsFromNormal;
  const autoWounds = expectedLethalHits;

  const mortalWounds = devWounds ? critWoundsFromNormal : 0;
  const savableWounds = devWounds
    ? nonCritWoundsFromNormal + autoWounds
    : nonCritWoundsFromNormal + critWoundsFromNormal + autoWounds;

  // --- Save ---
  // AP is negative (e.g. -1). Save worsens by |AP|.
  // apMod: +1 makes AP one step worse for the attacker (less penetration).
  const effectiveAp = weapon.ap - mods.apMod;
  let saveTarget = band.save - effectiveAp;
  if (band.invuln != null && band.invuln > 0) {
    saveTarget = Math.min(saveTarget, band.invuln);
  }
  const pSave = (() => {
    if (saveTarget <= 1) return 5 / 6;
    if (saveTarget > 6) return 0;
    return (7 - saveTarget) / 6;
  })();
  const pFailSave = 1 - pSave;

  let unsavedTotal = savableWounds * pFailSave + mortalWounds;

  // FNP: chance to ignore each unsaved wound allocation (MVP approximation)
  if (band.fnp != null && band.fnp >= 2 && band.fnp <= 6) {
    unsavedTotal *= (band.fnp - 1) / 6;
  }

  const dmgPer = expectedDice(weapon.damage);
  const wpm = Math.max(1, band.woundsPerModel);

  // No spillover: each unsaved removes min(D, W) wounds from one model
  const damagePerUnsaved = Math.min(dmgPer, wpm);
  let woundsDealt = unsavedTotal * damagePerUnsaved;

  const woundsToKill = Math.max(1, Math.ceil(wpm / Math.max(dmgPer, 1e-9)));
  let modelsKilled = unsavedTotal / woundsToKill;
  modelsKilled = Math.min(band.models, modelsKilled);

  const totalW = band.models * wpm;
  woundsDealt = Math.min(woundsDealt, totalW);

  return {
    expectedWoundsDealt: woundsDealt,
    expectedModelsKilled: modelsKilled,
    expectedUnsaved: unsavedTotal,
  };
}

export function expectedDamageAttacker(
  attacker: Attacker,
  band: TargetBand,
  mods: Modifiers,
  threshold: number,
): AttackResult {
  let wounds = 0;
  let modelsKilled = 0;

  for (const weapon of attacker.weapons) {
    const r = expectedDamageWeapon(weapon, band, mods);
    wounds += r.expectedWoundsDealt;
    modelsKilled += r.expectedModelsKilled;
  }

  modelsKilled = Math.min(band.models, modelsKilled);
  const totalW = band.models * Math.max(1, band.woundsPerModel);
  wounds = Math.min(wounds, totalW);

  const ptsRemoved =
    band.models > 0 ? (modelsKilled / band.models) * band.points : 0;
  const ratio = attacker.points > 0 ? ptsRemoved / attacker.points : 0;
  const pass = ptsRemoved >= threshold;

  return {
    attackerId: attacker.id,
    attackerName: attacker.name,
    attackerPoints: attacker.points,
    bandId: band.id,
    bandLabel: band.label,
    expectedWoundsDealt: wounds,
    expectedModelsKilled: modelsKilled,
    expectedPointsRemoved: ptsRemoved,
    efficiencyRatio: ratio,
    passThreshold: pass,
    underkill: !pass,
  };
}

export function computeMatrix(
  attackers: Attacker[],
  bands: TargetBand[],
  mods: Modifiers,
  threshold: number,
): AttackResult[] {
  const out: AttackResult[] = [];
  for (const a of attackers) {
    for (const b of bands) {
      out.push(expectedDamageAttacker(a, b, mods, threshold));
    }
  }
  return out;
}
