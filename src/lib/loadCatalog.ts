import type { CatalogFile, CatalogSheet } from './catalogTypes';

let cached: CatalogSheet[] | null = null;
let loadPromise: Promise<CatalogSheet[]> | null = null;
let lastError: string | null = null;
let catalogMeta: { source: string; generated: string; sheetCount: number } | null =
  null;

export function getCatalogMeta() {
  return catalogMeta;
}

export function getCatalogLoadError() {
  return lastError;
}

/** Reset cache (tests). */
export function resetCatalogCache() {
  cached = null;
  loadPromise = null;
  lastError = null;
  catalogMeta = null;
}

function catalogUrl(): string {
  const base =
    typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? String(import.meta.env.BASE_URL)
      : '/';
  const root = base.endsWith('/') ? base : `${base}/`;
  return `${root}data/wahapedia-sheets.json`;
}

function applyCatalog(data: CatalogFile): CatalogSheet[] {
  if (!data || !Array.isArray(data.sheets)) {
    throw new Error('Catalog JSON missing sheets[]');
  }
  catalogMeta = {
    source: data.source || 'Wahapedia community reference',
    generated: data.generated || '',
    sheetCount: data.sheetCount ?? data.sheets.length,
  };
  return data.sheets;
}

/**
 * Lazy-load the bundled Wahapedia-derived sheet catalog once from
 * public/data/wahapedia-sheets.json (static Pages hosting — no live scrape).
 */
export function loadCatalog(): Promise<CatalogSheet[]> {
  if (cached) return Promise.resolve(cached);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch(catalogUrl());
      if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
      const data = (await res.json()) as CatalogFile;
      cached = applyCatalog(data);
      lastError = null;
      return cached;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      cached = [];
      return cached;
    }
  })();

  return loadPromise;
}

/** Inject sheets for tests without fetch. */
export function setCatalogForTests(sheets: CatalogSheet[]) {
  cached = sheets;
  loadPromise = Promise.resolve(sheets);
  lastError = null;
  catalogMeta = {
    source: 'test fixture',
    generated: 'test',
    sheetCount: sheets.length,
  };
}
