# Cull Bench

Personal local scratchpad for Warhammer 40,000 damage-efficiency checks (expected-value math). Compare attacker profiles against toughness bands and see expected wounds, models killed, and **points removed** vs a configurable efficient-kill threshold (default **80**).

This is a personal-use tool inspired by the *workflow* of list-culling helpers — **not** a clone of any commercial app.

Live: [https://leemichaelo.github.io/cull-bench/](https://leemichaelo.github.io/cull-bench/)

## Run

```bash
cd cull-bench
npm install
npm run dev
```

Open the URL Vite prints (default [http://localhost:5173](http://localhost:5173)).

```bash
npm run test    # unit tests (wound chart + EV core + list paste + catalog match)
npm run build   # production build
```

## What it does

- **List paste** — paste New Recruit / app / WTC / BCP-style plain text; creates attacker rows from unit names + points.
- **Bundled Wahapedia catalog matching** — after paste, unit names are fuzzy-matched against a **bundled community reference** (faction JSON shards under `public/data/factions/`, indexed by `public/data/wahapedia-index.json`; derived from Wahapedia-style datasheet dumps). Matched units get ranged + melee weapon profiles (A / skill / S / AP / D + keywords). Unmatched units keep editable placeholders. List points win over catalog points when the paste includes points.
- **Attackers** — name, points, one or more weapon profiles (A / skill / S / AP / D, keywords).
- **Target bands** — editable T / W / models / save / invuln / FNP / unit points presets.
- **EV engine** — hit → wound → save → damage with no spillover between models; modifiers for hit/wound/AP, cover (BS+1), Lethal, Sustained, Dev Wounds, Anti crit-on, rerolls.
- **Heatmap** — attackers × bands: points removed, models killed, efficiency %; green if ≥ threshold, else UNDERKILL.
- **Persistence** — attackers, bands, threshold, and modifiers in `localStorage`.

### How to paste a list

1. Export or copy your army list as plain text (New Recruit export, Battlescribe/app paste, WTC/BCP-style lines).
2. Open **List paste** near the top of Cull Bench.
3. Paste into the textarea.
4. Click **Load list** (replaces attackers) or **Append to attackers**.
5. Check the match summary (matched vs unmatched). Edit any wrong or missing weapon stats in **Attackers**.

Recognized shapes include `Unit Name (123 points)`, `10x Unit Name (150 points)`, bullet lines like `• 1x Plasma pistol`, NR-style `TOTAL ARMY POINTS` / `DETACHMENT` headers, and loose `Name - 100` lines. Parsing is best-effort.

### Catalog matching (v1)

- Catalog is **static** (no live scrape from the browser — GitHub Pages / CORS). Lazy-fetched once from faction shards under `/data/factions/` via `/data/wahapedia-index.json` (with fallbacks to numbered parts / monolith / gzip encodings if present).
- Missing shards are skipped so a partial upload still works; paste shows matched vs unmatched counts.
- Name scoring mirrors Topaz-style normalize + score (exact / prefix / substring / word overlap) with an optional faction boost from the parsed list.
- Keyword strings map into Cull Bench keywords: Lethal Hits, Sustained Hits N, Devastating Wounds, Torrent, Blast, Anti-X N+.
- **Not Games Workshop gospel** — community Wahapedia-derived reference for personal use; may be stale, incomplete, or wrong. Always verify against your books / app / Munitorum Field Manual.
- No live refresh yet; bump the JSON shards and redeploy to update.

## What it does **not** include

- No official Games Workshop / Munitorum Field Manual database claim — the bundled file is a **community reference cache**, clearly labeled.
- No scraping of commercial list-culling tools (e.g. Culling Cogitator).
- Seed units in the UI are labeled **EXAMPLE** with invented numbers for demos only.

## Disclaimer

Fan-made personal utility. Not affiliated with Games Workshop. Warhammer 40,000 is a trademark of Games Workshop Limited. Bundled datasheet-like profiles are from a Wahapedia community reference and are **not** official GW data. Use at your own table; double-check rules and points against current publications.
