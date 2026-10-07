/**
 * Self-contained free-text army list parser for Cull Bench.
 * Port of the Topaz list-paste idea — no faction catalog, no game engine deps.
 * Parses names + points (+ weapon name hints). Does NOT ship datasheet stats.
 */

export interface ParsedUnit {
  name: string;
  points: number;
  models: number;
  weaponHints: string[];
}

export interface ParsedList {
  name: string;
  faction: string;
  detachment: string;
  points: number;
  units: ParsedUnit[];
}

const SECTION_SKIP =
  /^(attached units?|other datasheets|characters?|battleline|dedicated transports?|allied units?|end of roster!?|warlord|enhancements?|detachments?|configuration|stratagems?)$/i;

const META_SKIP =
  /^(exported with|created with|app version|data version|faction keyword|total army points|number of units|secondary:|warlord:|enhancement: on |force disposition|\+\+|https?:\/\/|#|===)/i;

const BS_SLOT =
  /^\+\s*(hq|elites?|troops?|fast attack|heavy support|flyer|dedicated transport|lord of war|no force org|agents|allied|fortification).*\+$/i;

const KNOWN_FACTIONS = [
  "Adeptus Custodes",
  "Emperor's Children",
  "Dark Angels",
  "Space Wolves",
  "Blood Angels",
  "Black Templars",
  "Death Guard",
  "World Eaters",
  "Thousand Sons",
  "Chaos Space Marines",
  "Chaos Daemons",
  "Imperial Knights",
  "Chaos Knights",
  "Astra Militarum",
  "Adepta Sororitas",
  "Adeptus Mechanicus",
  "Leagues of Votann",
  "Grey Knights",
  "Genestealer Cults",
  "T'au Empire",
  "Tau Empire",
  "Space Marines",
  "Necrons",
  "Tyranids",
  "Aeldari",
  "Drukhari",
  "Orks",
];

export function parseArmyList(text: string): ParsedList {
  const stripped = stripWrappers(text);
  const raw = stripped.replace(/\r/g, "").trim();
  if (!raw) {
    return {
      name: "Empty roster",
      faction: "Unknown",
      detachment: "",
      points: 0,
      units: [],
    };
  }

  const json = tryJson(raw);
  if (json) return json;

  const lines = raw.split("\n");
  const name = guessListName(lines);
  const faction = guessFaction(raw, lines);
  const detachment = guessDetachment(raw);
  const points = guessPoints(raw);
  const units = extractUnits(lines);

  return {
    name,
    faction,
    detachment,
    points: points || units.reduce((s, u) => s + u.points, 0),
    units,
  };
}

function stripWrappers(text: string): string {
  let t = text.trim();
  if (/<[a-z][\s\S]*>/i.test(t) && /<\/[a-z]+>/i.test(t)) {
    t = t
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/</g, "<")
      .replace(/>/g, ">");
  }
  if (/<roster[\s>]|<selection[\s>]/i.test(text)) {
    const names = [
      ...text.matchAll(
        /<selection\b[^>]*\bname="([^"]+)"[^>]*\b(?:type|entryId)=/gi,
      ),
    ];
    if (names.length) {
      const pts = [
        ...text.matchAll(/name="pts?"[^>]*value="([\d.]+)"/gi),
      ].map((m) => Number(m[1]));
      const rebuilt = names.map(
        (m, i) => `${decodeXml(m[1])} (${Math.round(pts[i] || 0)} points)`,
      );
      return rebuilt.join("\n");
    }
  }
  return t;
}

function decodeXml(s: string): string {
  return s
    .replace(/&/g, "&")
    .replace(/'/g, "'")
    .replace(/"/g, '"');
}

function tryJson(raw: string): ParsedList | null {
  if (!(raw.startsWith("{") || raw.startsWith("["))) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    const units = jsonUnits(data);
    if (!units.length) return null;
    const obj = Array.isArray(data) ? {} : (data as Record<string, unknown>);
    const faction = String(
      obj.faction ?? obj.catalogue ?? guessFaction(raw, raw.split("\n")),
    );
    return {
      name: String(obj.name ?? obj.listName ?? "Imported roster"),
      faction,
      detachment: String(obj.detachment ?? ""),
      points:
        Number(obj.points ?? obj.pts ?? 0) ||
        units.reduce((s, u) => s + u.points, 0),
      units,
    };
  } catch {
    return null;
  }
}

function jsonUnits(data: unknown): ParsedUnit[] {
  const rows = collectJsonUnits(data);
  return rows
    .map((r) => {
      const name = String(r.name ?? r.n ?? r.unit ?? "").trim();
      const points = Number(r.points ?? r.pts ?? r.cost ?? 0);
      const models = Number(r.models ?? r.count ?? r.number ?? r.size ?? 0);
      if (!name || name.length > 80) return null;
      const weaponHints = Array.isArray(r.weapons)
        ? r.weapons.map(String)
        : Array.isArray(r.weaponHints)
          ? r.weaponHints.map(String)
          : [];
      return { name, points, models, weaponHints };
    })
    .filter((u): u is ParsedUnit => Boolean(u));
}

function collectJsonUnits(
  data: unknown,
  acc: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  if (!data) return acc;
  if (Array.isArray(data)) {
    for (const item of data) collectJsonUnits(item, acc);
    return acc;
  }
  if (typeof data !== "object") return acc;
  const o = data as Record<string, unknown>;
  const hasNestedUnits =
    Array.isArray(o.units) ||
    Array.isArray(o.forces) ||
    Array.isArray(o.roster) ||
    Array.isArray(o.selections);
  if (
    !hasNestedUnits &&
    typeof o.name === "string" &&
    (o.points != null || o.pts != null || o.models != null || o.cost != null)
  ) {
    acc.push(o);
  }
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") collectJsonUnits(v, acc);
  }
  return acc;
}

function guessListName(lines: string[]): string {
  for (const line of lines.slice(0, 8)) {
    let t = line.trim().replace(/^\++\s*|\s*\++$/g, "").trim();
    if (!t) continue;
    if (SECTION_SKIP.test(t) || META_SKIP.test(t) || BS_SLOT.test(t)) continue;
    t = t
      .replace(/\s*[\(\[]\s*[\d,]+\s*(?:pts?|points?)\s*[\)\]]\s*$/i, "")
      .trim();
    if (!t) continue;
    if (
      /strike force|incursion|combat patrol|detachment|take and hold|purge the foe|disruption|reconnaissance|priority assets|faction keyword/i.test(
        t,
      )
    ) {
      continue;
    }
    if (t.length < 48) return t.replace(/!+$/, "").trim();
  }
  return "Unnamed host";
}

function guessFaction(raw: string, lines: string[]): string {
  const kw = raw.match(
    /FACTION KEYWORD:\s*[^\n]*-\s*([A-Za-z][A-Za-z'’ \-]+)/i,
  );
  if (kw) return kw[1].trim();
  const head = lines.slice(0, 16).join("\n");
  for (const f of KNOWN_FACTIONS) {
    const re = new RegExp(`\\b${f.replace(/[()]/g, "\\$&")}\\b`, "i");
    if (re.test(head) || re.test(raw)) return f === "Tau Empire" ? "T'au Empire" : f;
  }
  if (/astartes/i.test(head)) return "Space Marines";
  return "Unknown";
}

function guessDetachment(raw: string): string {
  const tagged = raw.match(/DETACHMENT:\s*([^\n]+)/i);
  if (tagged)
    return tagged[1]
      .replace(/\(.*?\)/g, "")
      .replace(/\u00a0/g, " ")
      .trim();
  const m =
    raw.match(/([A-Z][A-Za-z'’\- ]{3,60})\s*\(\s*\d\s*Detachment Points?\)/i) ||
    raw.match(/Detachment[:\s]+([A-Za-z][A-Za-z'’\- |]+)/i);
  return m ? m[1].trim() : "";
}

function guessPoints(raw: string): number {
  const tagged = raw.match(/TOTAL ARMY POINTS:\s*([\d,]+)/i);
  if (tagged) return Number(tagged[1].replace(/,/g, ""));
  const m =
    raw.match(/Strike Force[^\n]*\(?\s*([\d,]+)\s*(?:pts?|points?)\)?/i) ||
    raw.match(/\(([\d,]{3,5})\s*(?:pts?|points?)\)/i) ||
    raw.match(/\[([\d,]+)\s*(?:pts?|points?)\]/i);
  if (!m) return 0;
  return Number(m[1].replace(/,/g, ""));
}

type Draft = {
  header: string;
  points: number;
  body: string[];
  modelsHint?: number;
};

function extractUnits(lines: string[]): ParsedUnit[] {
  const units: ParsedUnit[] = [];
  let current: Draft | null = null;

  const flush = () => {
    if (!current) return;
    units.push(
      parseUnitBlock(
        current.header,
        current.points,
        current.body.join("\n"),
        current.modelsHint,
      ),
    );
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\u00a0/g, " ").trim();
    if (!line) continue;

    if (
      SECTION_SKIP.test(line) ||
      /^(CHARACTERS|BATTLELINE|OTHER DATASHEETS|DEDICATED TRANSPORTS|ALLIED UNITS)$/.test(
        line,
      )
    ) {
      continue;
    }
    if (
      META_SKIP.test(line) ||
      BS_SLOT.test(line) ||
      /^created with|^exported with/i.test(line)
    )
      continue;
    if (
      /^leading\s+/i.test(line) ||
      /^supporting\s+/i.test(line) ||
      /^attached to\s+/i.test(line) ||
      /^attached unit/i.test(line)
    ) {
      if (current) current.body.push(line);
      continue;
    }

    const enh = line.match(
      /^enhancements?:\s*.*?\(\s*\+?\s*([\d,]+)\s*(?:pts?|points?)\s*\)/i,
    );
    if (enh && current) {
      current.points += Number(enh[1].replace(/,/g, ""));
      current.body.push(line);
      continue;
    }

    const header = matchHeader(line);
    if (header) {
      flush();
      current = {
        header: header.name,
        points: header.points,
        body: header.rest ? [header.rest] : [],
        modelsHint: header.models,
      };
      continue;
    }

    if (current) current.body.push(line);
  }
  flush();
  return units;
}

function matchHeader(
  line: string,
): { name: string; points: number; models?: number; rest: string } | null {
  if (/strike force|incursion|combat patrol|detachment points/i.test(line))
    return null;

  const paren = line.match(
    /^(?:Char\d+:\s*)?(?:(\d+)\s*[x×]\s+)?(.+?)\s*\(([\d,]{2,4})\s*(?:pts?|points?)\)\s*:?\s*(.*)$/i,
  );
  if (paren) {
    const pts = Number(paren[3].replace(/,/g, ""));
    if (pts >= 1500) return null;
    const name = cleanName(paren[2]);
    if (!name || name.length > 72) return null;
    return {
      name,
      points: pts,
      models: paren[1] ? Number(paren[1]) : undefined,
      rest: paren[4] ?? "",
    };
  }

  const bracket = line.match(
    /^(?:(\d+)\s*[x×]\s+)?(.+?)\s*\[(?:[\d.]+\s*PL,?\s*)?([\d,]{2,4})\s*(?:pts?|points?)\]\s*:?\s*(.*)$/i,
  );
  if (bracket) {
    const pts = Number(bracket[3].replace(/,/g, ""));
    if (pts >= 1500) return null;
    const name = cleanName(bracket[2]);
    if (!name) return null;
    return {
      name,
      points: pts,
      models: bracket[1] ? Number(bracket[1]) : undefined,
      rest: bracket[4] ?? "",
    };
  }

  const loose = line.match(
    /^(?:(\d+)\s*[x×]?\s+)?([A-Za-z][A-Za-z0-9'’.\- ]{2,60}?)\s+[-–]?\s*([\d]{2,3})\s*(?:pts?|points?)?$/i,
  );
  if (loose) {
    const pts = Number(loose[3]);
    if (pts < 25 || pts > 800) return null;
    const name = cleanName(loose[2]);
    if (!name) return null;
    if (/^(orks|necrons|tyranids|aeldari|drukhari)$/i.test(name)) return null;
    return {
      name,
      points: pts,
      models: loose[1] ? Number(loose[1]) : undefined,
      rest: "",
    };
  }

  return null;
}

function cleanName(raw: string): string {
  return raw
    .replace(/^[•\-\*]+\s*/, "")
    .replace(/^Char\d+:\s*/i, "")
    .replace(/\s+\[.*$/, "")
    .replace(/\s*\(warlord\)/i, "")
    .trim();
}

function parseUnitBlock(
  name: string,
  points: number,
  body: string,
  modelsHint?: number,
): ParsedUnit {
  const weaponHints: string[] = [];
  let models = 0;

  const countRe = /(\d+)\s*[x×]\s*([A-Za-z][A-Za-z0-9'’.\- ]{1,50})/g;
  let m: RegExpExecArray | null;
  while ((m = countRe.exec(body))) {
    const n = Number(m[1]);
    const label = m[2].trim().replace(/[•◦]+$/, "").trim();
    if (isLikelyWeapon(label, name)) weaponHints.push(label);
    else if (!modelsHint) models += n;
  }

  // Also catch bullet lines that are just weapon names without Nx prefix
  for (const bl of body.split("\n")) {
    const bullet = bl.match(/^[•\-\*]\s+(?:\d+\s*[x×]\s+)?(.+)$/i);
    if (!bullet) continue;
    const label = bullet[1].trim().replace(/[•◦]+$/, "").trim();
    if (
      /^(warlord|leader|character|bodyguard|battleline)$/i.test(label)
    )
      continue;
    if (isLikelyWeapon(label, name) && !weaponHints.includes(label)) {
      weaponHints.push(label);
    }
  }

  if (modelsHint) models = modelsHint;
  else {
    const withRe = body.match(/(\d+)\s+with\s+/i);
    if (withRe && !models) models = Number(withRe[1]);
    if (!models) {
      const lone = body.match(/•\s*1x\s+/i);
      if (lone) models = 1;
    }
  }

  return {
    name,
    points,
    models: models || 0,
    weaponHints,
  };
}

function isLikelyWeapon(label: string, unitName: string): boolean {
  const l = label.toLowerCase();
  const n = unitName.toLowerCase();
  const nCore = n.replace(/s$/, "");
  if (n.includes(l) || l.includes(nCore) || l.includes(n)) return false;
  if (
    /(boy|marine|terminators?|guardsmen|gretchin|grots?|nob|runtherd|orderly|squig|custodian|praetor|allarus|intercessor|warrior|immortal|scarab|nurgling|plaguebearer|pink horror|bloodletter|berzerker|jackal|cultist|crusader|sword brethren|scout)/i.test(
      l,
    ) &&
    !/weapon|gun|blasta|shoota/.test(l)
  ) {
    return false;
  }
  return /weapon|wargear|tools?|bolter|boltgun|bolt |shoota|slugga|choppa|klaw|lance|spear|flamer|melta|plasma|cannon|gun|blaster|blasta|claw|fist|sword|axe|hammer|staff|whip|blade|pistol|missile|launcher|gauntlet|talon|jaws?|roar|stabba|stikka|syringe|wrench|dragga|gatler|exhaust|bulk|saddlegit|hurricane|grenade|bolts?|\bfeet\b|rifle|combi|chainsword|power /i.test(
    l,
  );
}
