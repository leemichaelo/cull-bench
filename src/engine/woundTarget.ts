/**
 * Wound roll target from Strength vs Toughness (classic 40k chart).
 * Returns the minimum d6 result needed (2–6).
 */
export function woundTarget(strength: number, toughness: number): number {
  if (strength <= 0 || toughness <= 0) return 6;
  if (strength >= toughness * 2) return 2;
  if (strength > toughness) return 3;
  if (strength === toughness) return 4;
  if (strength * 2 <= toughness) return 6;
  return 5; // strength < toughness but not half or less
}
