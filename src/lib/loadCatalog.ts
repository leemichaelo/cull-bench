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

function dataRoot(): string {
  const base =
    typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? String(import.meta.env.BASE_URL)
      : '/';
  const root = base.endsWith('/') ? base : `${base}/`;
  return `${root}data/`;
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

type FactionIndex = {
  source: string;
  generated: string;
  sheetCount: number;
  factions: { f: string; file: string; n: number }[];
};

async function loadMonolithic(): Promise<CatalogSheet[]> {
  const res = await fetch(`${dataRoot()}wahapedia-sheets.json`);
  if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
  const data = (await res.json()) as CatalogFile;
  return applyCatalog(data);
}

async function loadFactionShards(): Promise<CatalogSheet[]> {
  const res = await fetch(`${dataRoot()}wahapedia-index.json`);
  if (!res.ok) throw new Error(`Catalog index HTTP ${res.status}`);
  const index = (await res.json()) as FactionIndex;
  if (!index?.factions?.length) throw new Error('Catalog index empty');
  const parts = await Promise.all(
    index.factions.map(async (entry) => {
      const r = await fetch(`${dataRoot()}factions/${entry.file}`);
      if (!r.ok) throw new Error(`Faction ${entry.file} HTTP ${r.status}`);
      const body = (await r.json()) as { sheets: CatalogSheet[] };
      return body.sheets || [];
    }),
  );
  const sheets = parts.flat();
  return applyCatalog({
    source: index.source,
    generated: index.generated,
    sheetCount: index.sheetCount || sheets.length,
    sheets,
  });
}

/**
 * Lazy-load the bundled Wahapedia-derived sheet catalog once.
 * Tries monolithic public/data/wahapedia-sheets.json, then faction shards
 * (wahapedia-index.json + public/data/factions/*.json). No live scrape.
 */
export function loadCatalog(): Promise<CatalogSheet[]> {
  if (cached) return Promise.resolve(cached);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      cached = await loadMonolithic();
      lastError = null;
      return cached;
    } catch (monoErr) {
      try {
        cached = await loadFactionShards();
        lastError = null;
        return cached;
      } catch (shardErr) {
        const a = monoErr instanceof Error ? monoErr.message : String(monoErr);
        const b = shardErr instanceof Error ? shardErr.message : String(shardErr);
        lastError = `monolith: ${a}; shards: ${b}`;
        cached = [];
        return cached;
      }
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
