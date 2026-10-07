import type { Attacker, WeaponKeyword, WeaponProfile } from '../engine/types';

interface Props {
  attackers: Attacker[];
  onChange: (attackers: Attacker[]) => void;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyWeapon(): WeaponProfile {
  return {
    id: uid('wpn'),
    name: 'New weapon',
    attacks: 1,
    skill: 3,
    strength: 4,
    ap: 0,
    damage: 1,
    keywords: [],
  };
}

function emptyAttacker(): Attacker {
  return {
    id: uid('atk'),
    name: 'New attacker',
    points: 100,
    weapons: [emptyWeapon()],
  };
}

function keywordLabels(kws: WeaponKeyword[]): string {
  return kws
    .map((k) => {
      if (typeof k === 'string') return k;
      if (k.kind === 'Sustained Hits') return `Sustained Hits ${k.n}`;
      return `Anti ${k.n}+`;
    })
    .join(', ');
}

function parseKeywords(text: string): WeaponKeyword[] {
  const parts = text
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: WeaponKeyword[] = [];
  for (const p of parts) {
    const low = p.toLowerCase();
    if (low === 'lethal hits' || low === 'lethal') {
      out.push('Lethal Hits');
      continue;
    }
    if (low === 'devastating wounds' || low === 'dev wounds' || low === 'dev') {
      out.push('Devastating Wounds');
      continue;
    }
    if (low === 'torrent') {
      out.push('Torrent');
      continue;
    }
    if (low === 'blast') {
      out.push('Blast');
      continue;
    }
    const sus = p.match(/sustained\s*hits?\s*(\d+)/i);
    if (sus) {
      out.push({ kind: 'Sustained Hits', n: Number(sus[1]) });
      continue;
    }
    const anti = p.match(/anti(?:-\w+)?\s*(\d+)\+?/i);
    if (anti) {
      out.push({ kind: 'Anti', n: Number(anti[1]) });
      continue;
    }
  }
  return out;
}

function parseDiceOrNum(raw: string): number | string {
  const t = raw.trim();
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  return t.toUpperCase();
}

export function AttackerEditor({ attackers, onChange }: Props) {
  const update = (id: string, patch: Partial<Attacker>) => {
    onChange(attackers.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const updateWeapon = (
    atkId: string,
    wpnId: string,
    patch: Partial<WeaponProfile>,
  ) => {
    onChange(
      attackers.map((a) => {
        if (a.id !== atkId) return a;
        return {
          ...a,
          weapons: a.weapons.map((w) =>
            w.id === wpnId ? { ...w, ...patch } : w,
          ),
        };
      }),
    );
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Attackers</h2>
        <button type="button" onClick={() => onChange([...attackers, emptyAttacker()])}>
          Add attacker
        </button>
      </div>
      {attackers.map((a) => (
        <div key={a.id} className="card">
          <div className="row">
            <label>
              Name
              <input
                value={a.name}
                onChange={(e) => update(a.id, { name: e.target.value })}
              />
            </label>
            <label>
              Points
              <input
                type="number"
                min={0}
                value={a.points}
                onChange={(e) =>
                  update(a.id, { points: Number(e.target.value) || 0 })
                }
              />
            </label>
            <button
              type="button"
              className="danger"
              onClick={() => onChange(attackers.filter((x) => x.id !== a.id))}
            >
              Remove
            </button>
          </div>

          {a.weapons.map((w) => (
            <div key={w.id} className="weapon">
              <div className="row">
                <label>
                  Weapon
                  <input
                    value={w.name}
                    onChange={(e) =>
                      updateWeapon(a.id, w.id, { name: e.target.value })
                    }
                  />
                </label>
                <label>
                  A
                  <input
                    value={String(w.attacks)}
                    onChange={(e) =>
                      updateWeapon(a.id, w.id, {
                        attacks: parseDiceOrNum(e.target.value),
                      })
                    }
                    placeholder="20 or 2D6"
                  />
                </label>
                <label>
                  Skill
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={w.skill}
                    onChange={(e) =>
                      updateWeapon(a.id, w.id, {
                        skill: Number(e.target.value) || 3,
                      })
                    }
                  />
                </label>
                <label>
                  S
                  <input
                    type="number"
                    min={1}
                    value={w.strength}
                    onChange={(e) =>
                      updateWeapon(a.id, w.id, {
                        strength: Number(e.target.value) || 1,
                      })
                    }
                  />
                </label>
                <label>
                  AP
                  <input
                    type="number"
                    value={w.ap}
                    onChange={(e) =>
                      updateWeapon(a.id, w.id, {
                        ap: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
                <label>
                  D
                  <input
                    value={String(w.damage)}
                    onChange={(e) =>
                      updateWeapon(a.id, w.id, {
                        damage: parseDiceOrNum(e.target.value),
                      })
                    }
                    placeholder="1 or D6"
                  />
                </label>
                <button
                  type="button"
                  className="danger"
                  disabled={a.weapons.length <= 1}
                  onClick={() =>
                    update(a.id, {
                      weapons: a.weapons.filter((x) => x.id !== w.id),
                    })
                  }
                >
                  −
                </button>
              </div>
              <label className="full">
                Keywords (comma-separated)
                <input
                  value={keywordLabels(w.keywords)}
                  onChange={(e) =>
                    updateWeapon(a.id, w.id, {
                      keywords: parseKeywords(e.target.value),
                    })
                  }
                  placeholder="Lethal Hits, Sustained Hits 1, Devastating Wounds, Anti 4+, Torrent, Blast"
                />
              </label>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              update(a.id, { weapons: [...a.weapons, emptyWeapon()] })
            }
          >
            Add weapon profile
          </button>
        </div>
      ))}
    </section>
  );
}
