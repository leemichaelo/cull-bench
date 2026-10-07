import type { TargetBand } from '../engine/types';

interface Props {
  bands: TargetBand[];
  onChange: (bands: TargetBand[]) => void;
}

function uid() {
  return `band-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyBand(): TargetBand {
  return {
    id: uid(),
    label: 'New band',
    toughness: 4,
    woundsPerModel: 2,
    models: 10,
    save: 3,
    points: 100,
    notes: '',
  };
}

export function BandEditor({ bands, onChange }: Props) {
  const update = (id: string, patch: Partial<TargetBand>) => {
    onChange(bands.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Target bands</h2>
        <button type="button" onClick={() => onChange([...bands, emptyBand()])}>
          Add band
        </button>
      </div>
      <div className="table-wrap">
        <table className="edit-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>T</th>
              <th>W</th>
              <th>Models</th>
              <th>Save</th>
              <th>Invuln</th>
              <th>FNP</th>
              <th>Points</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {bands.map((b) => (
              <tr key={b.id}>
                <td>
                  <input
                    value={b.label}
                    onChange={(e) => update(b.id, { label: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    value={b.toughness}
                    onChange={(e) =>
                      update(b.id, { toughness: Number(e.target.value) || 1 })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    value={b.woundsPerModel}
                    onChange={(e) =>
                      update(b.id, {
                        woundsPerModel: Number(e.target.value) || 1,
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    value={b.models}
                    onChange={(e) =>
                      update(b.id, { models: Number(e.target.value) || 1 })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={2}
                    max={7}
                    value={b.save}
                    onChange={(e) =>
                      update(b.id, { save: Number(e.target.value) || 7 })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    placeholder="—"
                    value={b.invuln ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      update(
                        b.id,
                        v === ''
                          ? { invuln: undefined }
                          : { invuln: Number(v) },
                      );
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    placeholder="—"
                    value={b.fnp ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      update(
                        b.id,
                        v === '' ? { fnp: undefined } : { fnp: Number(v) },
                      );
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={b.points}
                    onChange={(e) =>
                      update(b.id, { points: Number(e.target.value) || 0 })
                    }
                  />
                </td>
                <td>
                  <input
                    value={b.notes ?? ''}
                    onChange={(e) => update(b.id, { notes: e.target.value })}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      onChange(bands.filter((x) => x.id !== b.id))
                    }
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
