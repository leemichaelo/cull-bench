import type { DiceExpr } from './types';

/**
 * Parse a damage/attacks dice string into expected value.
 * Supports: plain number, D3, D6, 2D6, D3+3, 2D6+2, etc.
 */
export function expectedDice(expr: DiceExpr): number {
  if (typeof expr === 'number') {
    if (!Number.isFinite(expr) || expr < 0) return 0;
    return expr;
  }
  const s = String(expr).trim().toUpperCase().replace(/\s+/g, '');
  if (!s) return 0;
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);

  const m = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (!m) return 0;
  const n = m[1] === '' ? 1 : Number(m[1]);
  const faces = Number(m[2]);
  const bonus = m[3] ? Number(m[3]) : 0;
  if (n < 1 || faces < 1) return 0;
  const avgOne = (faces + 1) / 2;
  return n * avgOne + bonus;
}

/** Probability a fair d6 is >= target, with target clamped to [1,7]. */
export function pD6AtLeast(target: number): number {
  const t = Math.max(1, Math.min(7, Math.ceil(target)));
  if (t <= 1) return 1;
  if (t > 6) return 0;
  return (7 - t) / 6;
}

function faceSucceeds(face: number, modifiedTarget: number): boolean {
  // Unmodified 1 always fails; unmodified 6 always succeeds.
  if (face === 1) return false;
  if (face === 6) return true;
  return face >= modifiedTarget;
}

/**
 * Success / crit probabilities on a d6 with optional single reroll.
 * - modifiedTarget: characteristic after modifiers (may be <2 or >6)
 * - critOn: unmodified face that counts as a critical (6 default; Anti-X may be lower)
 * - Crits are a subset of successes (a crit always succeeds).
 */
export function rollProbs(
  modifiedTarget: number,
  reroll: 'none' | 'ones' | 'all',
  critOn = 6,
): { pSuccess: number; pCrit: number } {
  const target = Math.ceil(modifiedTarget);
  const critFace = Math.max(2, Math.min(6, Math.ceil(critOn)));

  const single = (): { pSuccess: number; pCrit: number } => {
    let pSuccess = 0;
    let pCrit = 0;
    for (let face = 1; face <= 6; face++) {
      const ok = faceSucceeds(face, target);
      if (!ok) continue;
      pSuccess += 1 / 6;
      if (face >= critFace) pCrit += 1 / 6;
    }
    return { pSuccess, pCrit };
  };

  if (reroll === 'none') return single();

  let pSuccess = 0;
  let pCrit = 0;
  const base = single();

  for (let face = 1; face <= 6; face++) {
    const ok = faceSucceeds(face, target);
    const shouldReroll =
      reroll === 'all' ? !ok : face === 1;

    if (!shouldReroll) {
      if (ok) {
        pSuccess += 1 / 6;
        if (face >= critFace) pCrit += 1 / 6;
      }
      continue;
    }

    // Reroll once — use base distribution
    pSuccess += (1 / 6) * base.pSuccess;
    pCrit += (1 / 6) * base.pCrit;
  }

  return { pSuccess, pCrit };
}
