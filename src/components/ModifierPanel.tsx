import type { Modifiers } from '../engine/types';

interface Props {
  modifiers: Modifiers;
  threshold: number;
  onModifiers: (m: Modifiers) => void;
  onThreshold: (t: number) => void;
}

export function ModifierPanel({
  modifiers,
  threshold,
  onModifiers,
  onThreshold,
}: Props) {
  const set = <K extends keyof Modifiers>(key: K, value: Modifiers[K]) => {
    onModifiers({ ...modifiers, [key]: value });
  };

  return (
    <section className="panel">
      <h2>Modifiers & threshold</h2>
      <div className="mod-grid">
        <label>
          Hit mod
          <select
            value={modifiers.hitMod}
            onChange={(e) => set('hitMod', Number(e.target.value))}
          >
            <option value={-1}>−1</option>
            <option value={0}>0</option>
            <option value={1}>+1</option>
          </select>
        </label>
        <label>
          Wound mod
          <select
            value={modifiers.woundMod}
            onChange={(e) => set('woundMod', Number(e.target.value))}
          >
            <option value={-1}>−1</option>
            <option value={0}>0</option>
            <option value={1}>+1</option>
          </select>
        </label>
        <label>
          AP mod
          <select
            value={modifiers.apMod}
            onChange={(e) => set('apMod', Number(e.target.value))}
          >
            <option value={-1}>−1 (better pen)</option>
            <option value={0}>0</option>
            <option value={1}>+1 (worse pen)</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={modifiers.cover}
            onChange={(e) => set('cover', e.target.checked)}
          />
          Cover (BS+1)
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={modifiers.lethalHits}
            onChange={(e) => set('lethalHits', e.target.checked)}
          />
          Force Lethal Hits
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={modifiers.devastatingWounds}
            onChange={(e) => set('devastatingWounds', e.target.checked)}
          />
          Force Dev Wounds
        </label>
        <label>
          Sustained Hits override
          <select
            value={
              modifiers.sustainedHits === null
                ? 'weapon'
                : String(modifiers.sustainedHits)
            }
            onChange={(e) => {
              const v = e.target.value;
              set(
                'sustainedHits',
                v === 'weapon' ? null : Number(v),
              );
            }}
          >
            <option value="weapon">Use weapon</option>
            <option value="0">Off (0)</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </label>
        <label>
          Anti crit-on override
          <select
            value={
              modifiers.antiCritOn === null
                ? 'weapon'
                : String(modifiers.antiCritOn)
            }
            onChange={(e) => {
              const v = e.target.value;
              set('antiCritOn', v === 'weapon' ? null : Number(v));
            }}
          >
            <option value="weapon">Use weapon / 6+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
            <option value="6">6+</option>
          </select>
        </label>
        <label>
          Reroll hits
          <select
            value={modifiers.rerollHits}
            onChange={(e) =>
              set(
                'rerollHits',
                e.target.value as Modifiers['rerollHits'],
              )
            }
          >
            <option value="none">None</option>
            <option value="ones">1s</option>
            <option value="all">All misses</option>
          </select>
        </label>
        <label>
          Reroll wounds
          <select
            value={modifiers.rerollWounds}
            onChange={(e) =>
              set(
                'rerollWounds',
                e.target.value as Modifiers['rerollWounds'],
              )
            }
          >
            <option value="none">None</option>
            <option value="ones">1s</option>
            <option value="all">All fails</option>
          </select>
        </label>
        <label>
          Efficient kill threshold (pts removed)
          <input
            type="number"
            min={0}
            step={5}
            value={threshold}
            onChange={(e) => onThreshold(Number(e.target.value) || 0)}
          />
        </label>
      </div>
    </section>
  );
}
