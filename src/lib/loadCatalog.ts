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

async function gunzipBytes(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream unavailable');
  }
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const stream = new Blob([ab])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function loadGzipB64(): Promise<CatalogSheet[]> {
  let b64 = '';
  const whole = await fetch(`${dataRoot()}wahapedia-sheets.json.gz.b64`);
  if (whole.ok) {
    b64 = (await whole.text()).replace(/\s+/g, '');
  } else {
    const parts: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = await fetch(`${dataRoot()}wahapedia-sheets.json.gz.b64.part${i}`);
      if (!r.ok) throw new Error(`Catalog gz.b64 part${i} HTTP ${r.status}`);
      parts.push((await r.text()).replace(/\s+/g, ''));
    }
    b64 = parts.join('');
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const raw = await gunzipBytes(bytes);
  const data = JSON.parse(new TextDecoder().decode(raw)) as CatalogFile;
  return applyCatalog(data);
}

async function loadMonolithic(): Promise<CatalogSheet[]> {
  const res = await fetch(`${dataRoot()}wahapedia-sheets.json`);
  if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
  return applyCatalog((await res.json()) as CatalogFile);
}

type PartsIndex = {
  source: string;
  generated: string;
  sheetCount: number;
  parts: { i: number; file: string; n: number }[];
};

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
  return applyCatalog({
    source: index.source,
    generated: index.generated,
    sheetCount: index.sheetCount || chunks.flat().length,
    sheets: chunks.flat(),
  });
}

type FactionIndex = {
  source: string;
  generated: string;
  sheetCount: number;
  factions: { f: string; file: string; n: number }[];
};

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
  return applyCatalog({
    source: index.source,
    generated: index.generated,
    sheetCount: index.sheetCount || parts.flat().length,
    sheets: parts.flat(),
  });
}

/**
 * Lazy-load bundled Wahapedia community catalog (no live scrape).
 * Order: gzip+base64 → plain JSON → numbered parts → faction shards.
 */
export function loadCatalog(): Promise<CatalogSheet[]> {
  if (cached) return Promise.resolve(cached);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const errors: string[] = [];
    for (const [label, fn] of [
      ['gz.b64', loadGzipB64],
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
