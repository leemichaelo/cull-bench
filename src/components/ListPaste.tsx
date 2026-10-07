import { useState } from 'react';
import type { Attacker } from '../engine/types';
import { parseArmyList } from '../lib/listParse';
import { listToEnrichedAttackers } from '../lib/enrichAttackers';

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
  matched: number;
  unmatched: number;
  unmatchedNames: string[];
  catalogLoaded: boolean;
  catalogError?: string;
}

export function ListPaste({ attackers, onChange }: Props) {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = async (mode: 'replace' | 'append') => {
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
    setBusy(true);
    try {
      const { attackers: next, meta } = await listToEnrichedAttackers(list);
      onChange(mode === 'replace' ? next : [...attackers, ...next]);
      setSummary({
        name: list.name,
        faction: list.faction,
        detachment: list.detachment,
        points: list.points,
        unitCount: list.units.length,
        mode,
        matched: meta.matched,
        unmatched: meta.unmatched,
        unmatchedNames: meta.unmatchedNames,
        catalogLoaded: meta.catalogLoaded,
        catalogError: meta.catalogError,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>List paste</h2>
      </div>
      <p className="hint">
        Paste a Warhammer 40k army list export (New Recruit, app, WTC/BCP-style
        plain text). Unit names + points become attackers; weapon profiles are
        filled from a <strong>bundled Wahapedia community reference</strong>{' '}
        when a sheet matches (not Games Workshop official data — may be stale or
        wrong). Unmatched units keep editable placeholder shells. Always
        double-check against your books / app.
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
        disabled={busy}
      />
      <div className="list-paste-actions">
        <button type="button" onClick={() => void apply('replace')} disabled={busy}>
          {busy ? 'Matching…' : 'Load list'}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => void apply('append')}
          disabled={busy}
        >
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
          disabled={busy}
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
          <div className="list-paste-match">
            Catalog match: <strong>{summary.matched}</strong> filled
            {summary.unmatched > 0 ? (
              <>
                {' '}
                · <strong>{summary.unmatched}</strong> unmatched (placeholders)
              </>
            ) : null}
            {!summary.catalogLoaded ? ' · catalog unavailable' : null}
          </div>
          {summary.unmatchedNames.length > 0 && (
            <p className="list-paste-unmatched">
              Unmatched: {summary.unmatchedNames.slice(0, 12).join(', ')}
              {summary.unmatchedNames.length > 12
                ? ` (+${summary.unmatchedNames.length - 12} more)`
                : ''}
            </p>
          )}
          {summary.catalogError && (
            <p className="list-paste-error">Catalog: {summary.catalogError}</p>
          )}
          <p className="list-paste-warn">
            Profiles from Wahapedia community reference — verify A / skill / S /
            AP / D before trusting the heatmap.
          </p>
        </div>
      )}
    </section>
  );
}
