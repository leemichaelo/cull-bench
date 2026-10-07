import type { CatalogSheet, MatchResult } from './catalogTypes';

/** Normalize names for fuzzy matching (apostrophes, punctuation → spaces). */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/['\u2019`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Light faction aliasing so list "Chaos Daemons" boosts catalog "Daemons". */
export function canonicalFaction(faction: string): string {
  const n = normalizeName(faction);
  if (!n || n === 'unknown') return '';
  if (n === 'chaos daemons' || n === 'daemons of chaos') return 'daemons';
  if (n === 'tau empire') return 'tau empire';
  if (n === 'adeptus astartes') return 'space marines';
  return n;
}

/**
 * Score how well a query unit name matches a catalog sheet name.
 * Exact = 100; prefix = 86; substring = 74; all words = 70+; some words = 40+.
 */
export function scoreName(query: string, candidate: string): number {
  const q = normalizeName(query);
  const c = normalizeName(candidate);
  if (!q || !c) return 0;
  if (q === c) return 100;
  if (c.startsWith(q) || q.startsWith(c)) return 86;
  if (c.includes(q) || q.includes(c)) return 74;
  const qw = q.split(' ').filter(Boolean);
  const cw = new Set(c.split(' ').filter(Boolean));
  let hit = 0;
  for (const w of qw) if (cw.has(w)) hit += 1;
  if (hit === qw.length && qw.length > 0) return 70 + hit;
  if (hit > 0) return 40 + hit * 8;
  return 0;
}

const MATCH_THRESHOLD = 48;

/**
 * Best catalog sheet for a unit name, with optional faction boost.
 * Returns null when no candidate clears the score threshold.
 */
export function matchSheet(
  name: string,
  faction: string | undefined,
  catalog: CatalogSheet[],
): MatchResult | null {
  const want = faction ? canonicalFaction(faction) : '';
  let best: CatalogSheet | null = null;
  let bestScore = 0;
  for (const s of catalog) {
    let sc = scoreName(name, s.n);
    if (sc <= 0) continue;
    if (want) {
      const sf = canonicalFaction(s.f);
      if (sf && sf === want) sc += 12;
      else if (sf) {
        const wantHead = want.split(' ')[0] ?? '';
        if (wantHead && !sf.includes(wantHead)) sc -= 6;
      }
    }
    if (sc > bestScore) {
      bestScore = sc;
      best = s;
    }
  }
  if (!best || bestScore < MATCH_THRESHOLD) return null;
  return { sheet: best, score: bestScore };
}

export { MATCH_THRESHOLD };
