import type { AttackResult, Attacker, TargetBand } from '../engine/types';

interface Props {
  attackers: Attacker[];
  bands: TargetBand[];
  results: AttackResult[];
  threshold: number;
}

function cellKey(a: string, b: string) {
  return `${a}::${b}`;
}

export function Heatmap({ attackers, bands, results, threshold }: Props) {
  const map = new Map<string, AttackResult>();
  for (const r of results) {
    map.set(cellKey(r.attackerId, r.bandId), r);
  }

  if (attackers.length === 0 || bands.length === 0) {
    return (
      <section className="panel">
        <h2>Heatmap</h2>
        <p className="muted">Add at least one attacker and one target band.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Heatmap</h2>
      <p className="hint">
        Green = expected points removed ≥ {threshold}. Cell shows pts removed,
        models killed, and pts-efficiency %. UNDERKILL if below threshold.
      </p>
      <div className="table-wrap">
        <table className="heatmap">
          <thead>
            <tr>
              <th>Attacker</th>
              {bands.map((b) => (
                <th key={b.id}>
                  <div>{b.label}</div>
                  <div className="sub">
                    T{b.toughness} · {b.models}×{b.woundsPerModel}W · {b.points}pts
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attackers.map((a) => (
              <tr key={a.id}>
                <th>
                  <div>{a.name}</div>
                  <div className="sub">{a.points} pts</div>
                </th>
                {bands.map((b) => {
                  const r = map.get(cellKey(a.id, b.id));
                  if (!r) {
                    return <td key={b.id}>—</td>;
                  }
                  const pct = (r.efficiencyRatio * 100).toFixed(0);
                  const cls = r.passThreshold ? 'pass' : 'fail';
                  return (
                    <td key={b.id} className={cls}>
                      <div className="pts">
                        {r.expectedPointsRemoved.toFixed(1)} pts
                      </div>
                      <div className="sub">
                        {r.expectedModelsKilled.toFixed(2)} models ·{' '}
                        {r.expectedWoundsDealt.toFixed(1)} W
                      </div>
                      <div className="sub">
                        {pct}% eff
                        {r.underkill ? (
                          <span className="underkill"> · UNDERKILL</span>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
