import { useState } from 'react';
import type { Attacker } from '../engine/types';
import { parseArmyList } from '../lib/listParse';
import { listToAttackers } from '../lib/listToAttackers';

interface Props {
  attackers: Attacker[];
  onChange: (attackers: Attacker[]) => void;
}

interface Summary {
  name: string;
  faction: string;
  detachment: string;
  points: number;
  unitCount: number;
  mode: 'replace' | 'append';
}

export function ListPaste({ attackers, onChange }: Props) {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = (mode: 'replace' | 'append') => {
    setError(null);
    setSummary(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Paste a list export first (New Recruit / app / BCP-style plain text).');
      return;
    }
    const list = parseArmyList(trimmed);
    if (list.units.length === 0) {
      setError(
        'No units found. Try lines like "Unit Name (100 points)" or "10x Unit Name (150 points)".',
      );
      return;
    }
    const next = listToAttackers(list);
    onChange(mode === 'replace' ? next : [...attackers, ...next]);
    setSummary({
      name: list.name,
      faction: list.faction,
      detachment: list.detachment,
      points: list.points,
      unitCount: list.units.length,
      mode,
    });
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>List paste</h2>
      </div>
      <p className="hint">
        Paste a Warhammer 40k army list export (New Recruit, app, WTC/BCP-style
        plain text). Creates attacker rows from unit names + points. Weapon
        profiles are <strong>placeholder shells only</strong> — type real A /
        skill / S / AP / D from your own books or app. No official datasheets
        are shipped or scraped.
      </p>
      <textarea
        className="list-paste-area"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        placeholder={`Example:\nMy Synthetic Host\nSynthetic Legion\n\nSynthetic Captain (100 points)\n• 1x Synthetic blade\n\n10x Synthetic Infantry (150 points)\n• 10x Synthetic bolt rifle`}
        spellCheck={false}
        aria-label="Army list paste"
      />
      <div className="list-paste-actions">
        <button type="button" onClick={() => apply('replace')}>
          Load list
        </button>
        <button type="button" className="secondary" onClick={() => apply('append')}>
          Append to attackers
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setText('');
            setSummary(null);
            setError(null);
          }}
        >
          Clear paste
        </button>
      </div>
      {error && <p className="list-paste-error">{error}</p>}
      {summary && (
        <div className="list-paste-summary">
          <div>
            <strong>{summary.name}</strong>
            {summary.faction !== 'Unknown' ? ` · ${summary.faction}` : ''}
            {summary.detachment ? ` · ${summary.detachment}` : ''}
          </div>
          <div>
            {summary.points} pts · {summary.unitCount} unit
            {summary.unitCount === 1 ? '' : 's'} ·{' '}
            {summary.mode === 'replace' ? 'replaced' : 'appended to'} attackers
          </div>
          <p className="list-paste-warn">
            Weapon stats are placeholders — edit below from your datasheets.
          </p>
        </div>
      )}
    </section>
  );
}
