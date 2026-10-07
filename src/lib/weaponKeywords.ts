import type { WeaponKeyword } from '../engine/types';

/**
 * Parse Wahapedia-style keyword strings into Cull Bench WeaponKeyword values.
 * Handles: Lethal Hits, Devastating Wounds, Torrent, Blast, Sustained Hits N, Anti-X N+.
 */
export function parseWeaponKeywords(raw: string | string[] | undefined): WeaponKeyword[] {
  if (!raw) return [];
  const text = Array.isArray(raw) ? raw.join(', ') : raw;
  const parts = text
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const out: WeaponKeyword[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const lower = part.toLowerCase();

    if (/lethal\s*hits?/i.test(part)) {
      if (!seen.has('lethal')) {
        seen.add('lethal');
        out.push('Lethal Hits');
      }
      continue;
    }
    if (/devastating\s*wounds?/i.test(part)) {
      if (!seen.has('dev')) {
        seen.add('dev');
        out.push('Devastating Wounds');
      }
      continue;
    }
    if (/\btorrent\b/i.test(part)) {
      if (!seen.has('torrent')) {
        seen.add('torrent');
        out.push('Torrent');
      }
      continue;
    }
    if (/\bblast\b/i.test(part)) {
      if (!seen.has('blast')) {
        seen.add('blast');
        out.push('Blast');
      }
      continue;
    }

    const sust = part.match(/sustained\s*hits?\s*(\d+)/i);
    if (sust) {
      const n = Number(sust[1]);
      const key = `sustained:${n}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ kind: 'Sustained Hits', n });
      }
      continue;
    }
    // bare "Sustained Hits" → 1
    if (/sustained\s*hits?/i.test(part)) {
      if (!seen.has('sustained:1')) {
        seen.add('sustained:1');
        out.push({ kind: 'Sustained Hits', n: 1 });
      }
      continue;
    }

    // Anti-Infantry 4+, Anti-Vehicle 3+, Anti X 4+, etc.
    const anti = part.match(/anti[-\s]?[\w'\u2019\- ]+?\s+(\d+)\+/i) || part.match(/anti[-\s]?(\d+)\+/i);
    if (anti || /^anti\b/i.test(lower)) {
      const n = anti ? Number(anti[1]) : 4;
      const key = `anti:${n}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ kind: 'Anti', n });
      }
      continue;
    }
  }

  return out;
}

/** Parse attacks / damage dice expressions into Cull Bench DiceExpr. */
export function parseDiceExpr(raw: string | number | null | undefined): number | string {
  if (raw == null || raw === '') return 1;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (/^\d+$/.test(s)) return Number(s);
  // Keep D6 / 2D6 / D3+1 etc. as strings the EV engine already understands
  if (/^\d*D\d/i.test(s) || /^D\d/i.test(s)) return s.toUpperCase().replace(/D/g, 'D');
  const n = Number(s);
  return Number.isFinite(n) ? n : s;
}
