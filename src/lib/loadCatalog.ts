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

type PartsIndex = {
  source: string;
  generated: string;
  sheetCount: number;
  parts: { i: number; file: string; n: number }[];
};

async function loadMonolithic(): Promise<CatalogSheet[]> {
  const res = await fetch(`${dataRoot()}wahapedia-sheets.json`);
  if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
  return applyCatalog((await res.json()) as CatalogFile);
}

async function loadParts(): Promise<CatalogSheet[]> {
  const res = await fetch(`${dataRoot()}wahapedia-parts.json`);
  if (!res.ok) throw new Error(`Parts index HTTP ${res.status}`);
  const index = (await res.json()) as PartsIndex;
  if (!index?.parts?.length) throw new Error('Parts index empty');
  const chunks = await Promise.all(
    index.parts.map(async (entry) => {
      const r = await fetch(`${dataRoot()}parts/${entry.file}`);
      if (!r.ok) throw new Error(`Part ${entry.file} HTTP ${r.status}`);
      const body = (await r.json()) as { sheets: CatalogSheet[] };
      return body.sheets || [];
    }),
  );
  const sheets = chunks.flat();
  return applyCatalog({
    source: index.source,
    generated: index.generated,
    sheetCount: index.sheetCount || sheets.length,
    sheets,
  });
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
 * Lazy-load bundled Wahapedia community catalog (no live scrape).
 * Order: monolith → numbered parts → faction shards.
 */
export function loadCatalog(): Promise<CatalogSheet[]> {
  if (cached) return Promise.resolve(cached);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const errors: string[] = [];
    for (const [label, fn] of [
      ['monolith', loadMonolithic],
      ['parts', loadParts],
      ['shards', loadFactionShards],
    ] as const) {
      try {
        cached = await fn();
        lastError = null;
        return cached;
      } catch (err) {
        errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    lastError = errors.join('; ');
    cached = [];
    return cached;
  })();

  return loadPromise;
}

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
