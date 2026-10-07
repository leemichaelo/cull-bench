# Cull Bench

Personal local scratchpad for Warhammer 40,000 damage-efficiency checks (expected-value math). Compare attacker profiles against toughness bands and see expected wounds, models killed, and **points removed** vs a configurable efficient-kill threshold (default **80**).

This is a personal-use tool inspired by the *workflow* of list-culling helpers — **not** a clone of any commercial app, and it does **not** ship official datasheets.

## Run

```bash
cd cull-bench
npm install
npm run dev
```

Open the URL Vite prints (default [http://localhost:5173](http://localhost:5173)).

```bash
npm run test    # unit tests (wound chart + EV core)
npm run build   # production build
```

## What it does

- **Attackers** — name, points, one or more weapon profiles (A / skill / S / AP / D, keywords).
- **Target bands** — editable T / W / models / save / invuln / FNP / unit points presets.
- **EV engine** — hit → wound → save → damage with no spillover between models; modifiers for hit/wound/AP, cover (BS+1), Lethal, Sustained, Dev Wounds, Anti crit-on, rerolls.
- **Heatmap** — attackers × bands: points removed, models killed, efficiency %; green if ≥ threshold, else UNDERKILL.
- **Persistence** — attackers, bands, threshold, and modifiers in `localStorage`.

## What it does **not** include

- No official Games Workshop / Munitorum Field Manual datasheet database — **type your own stats** from your books or app.
- No list paste parser, opponent full-list matrix, or external list-tool integrations.
- Seed units are labeled **EXAMPLE** with invented numbers for UI demos only.

## Disclaimer

Fan-made personal utility. Not affiliated with Games Workshop. Warhammer 40,000 is a trademark of Games Workshop Limited. Use at your own table; double-check rules and points against current publications.
