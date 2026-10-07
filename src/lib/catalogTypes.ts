/** Bundled Wahapedia-derived catalog types (community reference — not GW official). */

export interface CatalogWeapon {
  n: string;
  a: string;
  sk: number;
  s: number;
  ap: number;
  d: string;
  k: string;
}

export interface CatalogSheet {
  n: string;
  f: string;
  p: number | null;
  rng: CatalogWeapon[];
  mel: CatalogWeapon[];
}

export interface CatalogFile {
  source: string;
  generated: string;
  sheetCount: number;
  sheets: CatalogSheet[];
}

export interface MatchResult {
  sheet: CatalogSheet;
  score: number;
}

export interface EnrichmentMeta {
  matched: number;
  unmatched: number;
  unmatchedNames: string[];
  catalogLoaded: boolean;
  catalogError?: string;
}
