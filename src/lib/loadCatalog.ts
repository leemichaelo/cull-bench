import type { CatalogFile, CatalogSheet } from './catalogTypes';
import { WAHAPEDIA_SHEETS_GZ_B64 } from '../data/wahapediaCatalogGz';

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

async function gunzipBase64(b64: string): Promise<Uint8Array> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream unavailable');
  }
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

async function loadEmbedded(): Promise<CatalogSheet[]> {
  const raw = await gunzipBase64(WAHAPEDIA_SHEETS_GZ_B64);
  const text = new TextDecoder().decode(raw);
  const data = JSON.parse(text) as CatalogFile;
  return applyCatalog(data);
}

async function loadFetched(): Promise<CatalogSheet[]> {
  const res = await fetch(catalogUrl());
  if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
  const data = (await res.json()) as CatalogFile;
  return applyCatalog(data);
}

/**
 * Lazy-load the bundled Wahapedia-derived sheet catalog once.
 * Prefers the embedded gzipped community reference (no CORS / no live scrape);
 * falls back to fetching /data/wahapedia-sheets.json when present.
 */
export function loadCatalog(): Promise<CatalogSheet[]> {
  if (cached) return Promise.resolve(cached);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      cached = await loadEmbedded();
      lastError = null;
      return cached;
    } catch (embedErr) {
      try {
        cached = await loadFetched();
        lastError = null;
        return cached;
      } catch (fetchErr) {
        const a = embedErr instanceof Error ? embedErr.message : String(embedErr);
        const b = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        lastError = `embedded: ${a}; fetch: ${b}`;
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
