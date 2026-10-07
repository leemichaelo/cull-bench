import { useEffect, useMemo, useState } from 'react';
import { AttackerEditor } from './components/AttackerEditor';
import { BandEditor } from './components/BandEditor';
import { Heatmap } from './components/Heatmap';
import { ListPaste } from './components/ListPaste';
import { ModifierPanel } from './components/ModifierPanel';
import { computeMatrix } from './engine/expectedDamage';
import type { Attacker, Modifiers, TargetBand } from './engine/types';
import { loadState, resetToSeed, saveState } from './storage/persist';
import './App.css';

export default function App() {
  const initial = useMemo(() => loadState(), []);
  const [attackers, setAttackers] = useState<Attacker[]>(initial.attackers);
  const [bands, setBands] = useState<TargetBand[]>(initial.bands);
  const [threshold, setThreshold] = useState(initial.threshold);
  const [modifiers, setModifiers] = useState<Modifiers>(initial.modifiers);

  useEffect(() => {
    saveState({ attackers, bands, threshold, modifiers });
  }, [attackers, bands, threshold, modifiers]);

  const results = useMemo(
    () => computeMatrix(attackers, bands, modifiers, threshold),
    [attackers, bands, modifiers, threshold],
  );

  const handleReset = () => {
    const s = resetToSeed();
    setAttackers(s.attackers);
    setBands(s.bands);
    setThreshold(s.threshold);
    setModifiers(s.modifiers);
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Cull Bench</h1>
          <p className="tagline">
            Personal 40k damage-efficiency scratchpad (expected value). Seed
            attackers are EXAMPLE data — not official datasheets.
          </p>
        </div>
        <button type="button" className="secondary" onClick={handleReset}>
          Reset to EXAMPLE seed
        </button>
      </header>

      <ModifierPanel
        modifiers={modifiers}
        threshold={threshold}
        onModifiers={setModifiers}
        onThreshold={setThreshold}
      />

      <ListPaste attackers={attackers} onChange={setAttackers} />

      <Heatmap
        attackers={attackers}
        bands={bands}
        results={results}
        threshold={threshold}
      />

      <AttackerEditor attackers={attackers} onChange={setAttackers} />
      <BandEditor bands={bands} onChange={setBands} />

      <footer className="footer">
        Local-only personal tool. Bundled weapon profiles come from a Wahapedia
        community reference cache (not Games Workshop official data; may be
        stale or wrong) — always verify against your books / app. Persists in
        this browser via localStorage.
      </footer>
    </div>
  );
}
