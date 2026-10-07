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
npm run test    # unit tests (wound chart + EV core + list paste parse)
npm run build   # production build
```

## What it does

- **List paste** — paste New Recruit / app / WTC / BCP-style plain text; creates attacker rows from unit names + points (optional weapon name hints). Weapon stats start as **editable placeholders** — type real A / skill / S / AP / D from your own books or app.
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
5. Edit each weapon’s placeholder stats in **Attackers** below — the parser never fills official datasheet numbers.

Recognized shapes include `Unit Name (123 points)`, `10x Unit Name (150 points)`, bullet lines like `• 1x Plasma pistol`, NR-style `TOTAL ARMY POINTS` / `DETACHMENT` headers, and loose `Name - 100` lines. Parsing is best-effort; weak exports still return whatever units it can find.

## What it does **not** include

- No official Games Workshop / Munitorum Field Manual datasheet database — **type your own stats** from your books or app.
- No scraping of other list-culling tools or auto-import of weapon profiles with real S/AP/D.
- Seed units are labeled **EXAMPLE** with invented numbers for UI demos only.

## Disclaimer

Fan-made personal utility. Not affiliated with Games Workshop. Warhammer 40,000 is a trademark of Games Workshop Limited. Use at your own table; double-check rules and points against current publications.
