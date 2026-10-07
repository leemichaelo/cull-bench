import { describe, expect, it } from 'vitest';
import { parseArmyList } from './listParse';

/** Synthetic fixtures only — not real tournament lists. */
const SYNTHETIC_FREE_TEXT = `=== SYNTHETIC FIXTURE: free-text-minimal ===
Synthetic Host Alpha
Synthetic Detachment One
Strike Force (1000 points)

Synthetic Captain Alpha (100 points)
• 1x Synthetic blade
• Warlord

10x Synthetic Infantry Squad (150 points)
• 10x Synthetic bolt tool

Synthetic Transport Beta (100 points)
`;

const SYNTHETIC_NR_STYLE = `=== SYNTHETIC FIXTURE: nr-export-shape ===
Exported with New Recruit (synthetic)

SYNTHETIC FACTION KEYWORD: Imperium - Synthetic Legion

DETACHMENT: Synthetic Detachment One (1 Detachment Points)

TOTAL ARMY POINTS: 350 pts

CHARACTERS

Char1: Synthetic Captain Alpha (100 points)
• 1x Synthetic blade
  Warlord

BATTLELINE

10x Synthetic Infantry Squad (150 points)
• 10x Synthetic bolt tool

OTHER DATASHEETS

Synthetic Transport Beta (100 points)
`;

const SYNTHETIC_BCP_LOOSE = `=== SYNTHETIC FIXTURE: bcp-loose ===
Synthetic Legion
Synthetic Detachment One

Synthetic Captain Alpha - 100
Synthetic Infantry Squad - 150
`;

describe('parseArmyList', () => {
  it('returns empty roster for blank input', () => {
    const list = parseArmyList('   ');
    expect(list.units).toEqual([]);
    expect(list.name).toBe('Empty roster');
    expect(list.points).toBe(0);
  });

  it('parses free-text synthetic roster with points and weapon hints', () => {
    const list = parseArmyList(SYNTHETIC_FREE_TEXT);
    expect(list.units.length).toBeGreaterThanOrEqual(2);
    expect(list.units.some((u) => /Synthetic Captain Alpha/i.test(u.name))).toBe(
      true,
    );
    const infantry = list.units.find((u) => /Infantry Squad/i.test(u.name));
    expect(infantry?.points).toBe(150);
    expect(infantry?.weaponHints.some((w) => /bolt/i.test(w))).toBe(true);
    expect(list.points === 1000 || list.points >= 300).toBe(true);
  });

  it('parses NR-shaped synthetic export', () => {
    const list = parseArmyList(SYNTHETIC_NR_STYLE);
    expect(list.units.length).toBeGreaterThanOrEqual(2);
    expect(list.detachment).toMatch(/Synthetic Detachment/i);
    expect(list.points).toBe(350);
    expect(list.faction).toMatch(/Synthetic Legion/i);
  });

  it('parses loose BCP-style synthetic lines', () => {
    const list = parseArmyList(SYNTHETIC_BCP_LOOSE);
    expect(list.units.length).toBeGreaterThanOrEqual(2);
    expect(list.units.every((u) => u.points > 0)).toBe(true);
  });
});
