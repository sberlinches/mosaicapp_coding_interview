import { startTransition, useEffect, useState } from 'react';
import {
  fetchDiff,
  fetchPlan,
  fetchVersions,
  saveVersion,
} from './modules/plan/plan.service.ts';
import type {
  ChangedField,
  EditablePlanRow,
  PlanDiff,
  PlanVersion,
} from './modules/plan/plan.types.ts';

const fields = [
  ['personName', 'Person'],
  ['role', 'Role'],
  ['team', 'Team'],
  ['allocationPct', 'Allocation %'],
  ['startDate', 'Start date'],
  ['endDate', 'End date'],
] as const;

const emptyRow: EditablePlanRow = {
  personName: '',
  role: '',
  team: '',
  allocationPct: 0,
  startDate: '',
  endDate: '',
};

export function App() {
  const [rows, setRows] = useState<EditablePlanRow[]>([]);
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [earlierId, setEarlierId] = useState('');
  const [laterId, setLaterId] = useState('');
  const [diff, setDiff] = useState<PlanDiff | null>(null);
  const [versionName, setVersionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    Promise.all([fetchPlan(), fetchVersions()])
      .then(([plan, savedVersions]) => {
        setRows(plan);
        setVersions(savedVersions);
        if (savedVersions.length >= 2) {
          setEarlierId(savedVersions[1].id);
          setLaterId(savedVersions[0].id);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load plan');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!earlierId || !laterId || earlierId === laterId) {
      return;
    }
    startTransition(() => setDiffLoading(true));
    fetchDiff(earlierId, laterId)
      .then(setDiff)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load diff');
      })
      .finally(() => setDiffLoading(false));
  }, [earlierId, laterId]);

  const displayedDiff =
    earlierId && laterId && earlierId !== laterId ? diff : null;

  function updateRow(
    rowIndex: number,
    field: keyof EditablePlanRow,
    value: string | number,
  ) {
    setRows((currentRows) =>
      currentRows.map((row, index) =>
        index === rowIndex ? { ...row, [field]: value } : row,
      ),
    );
  }

  function addRow() {
    setRows((currentRows) => [
      ...currentRows,
      { ...emptyRow, id: crypto.randomUUID() },
    ]);
  }

  function removeRow(rowIndex: number) {
    setRows((currentRows) =>
      currentRows.filter((_, index) => index !== rowIndex),
    );
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!versionName.trim()) {
      setError('Enter a name before saving a version.');
      return;
    }
    setSaving(true);
    setError('');
    setSaveMessage('');
    saveVersion(versionName.trim(), rows)
      .then((version) => {
        setVersions((currentVersions) => [version, ...currentVersions]);
        setVersionName('');
        setSaveMessage(`Saved "${version.name}".`);
        if (!laterId) {
          setEarlierId(versions[0]?.id ?? '');
          setLaterId(version.id);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to save version');
      })
      .finally(() => setSaving(false));
  }

  return (
    <main className="workspace">
      <header className="page-header">
        <div>
          <p className="eyebrow">Workforce planning</p>
          <h1>Plan versions</h1>
          <p className="intro">
            Edit the working plan, save a named snapshot, and inspect what
            changed between versions.
          </p>
        </div>
        <div className="version-count">
          <strong>{versions.length}</strong>
          <span>saved versions</span>
        </div>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {saveMessage && (
        <p className="success" role="status">
          {saveMessage}
        </p>
      )}

      {loading ? (
        <p className="status">Loading plan...</p>
      ) : (
        <>
          <section
            className="panel editor-panel"
            aria-labelledby="editor-heading"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Current workspace</p>
                <h2 id="editor-heading">Edit plan</h2>
              </div>
              <button type="button" onClick={addRow}>
                Add row
              </button>
            </div>
            {rows.length === 0 ? (
              <p className="status">No plan rows yet. Add the first row.</p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {fields.map(([, label]) => (
                        <th key={label} scope="col">
                          {label}
                        </th>
                      ))}
                      <th scope="col">
                        <span className="visually-hidden">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={row.id ?? rowIndex}>
                        {fields.map(([field, label]) => (
                          <td key={field}>
                            <label
                              className="visually-hidden"
                              htmlFor={`${field}-${rowIndex}`}
                            >
                              {label} for row {rowIndex + 1}
                            </label>
                            <input
                              id={`${field}-${rowIndex}`}
                              type={
                                field === 'allocationPct'
                                  ? 'number'
                                  : field.includes('Date')
                                    ? 'date'
                                    : 'text'
                              }
                              min={field === 'allocationPct' ? 0 : undefined}
                              max={field === 'allocationPct' ? 100 : undefined}
                              value={row[field]}
                              onChange={(event) =>
                                updateRow(
                                  rowIndex,
                                  field,
                                  field === 'allocationPct'
                                    ? Number(event.target.value)
                                    : event.target.value,
                                )
                              }
                            />
                          </td>
                        ))}
                        <td>
                          <button
                            className="quiet-button"
                            type="button"
                            onClick={() => removeRow(rowIndex)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <form className="save-form" onSubmit={handleSave}>
              <label htmlFor="version-name">Version name</label>
              <input
                id="version-name"
                value={versionName}
                onChange={(event) => setVersionName(event.target.value)}
                maxLength={100}
                required
              />
              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save version'}
              </button>
            </form>
          </section>

          <section
            className="panel comparison-panel"
            aria-labelledby="comparison-heading"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">History</p>
                <h2 id="comparison-heading">Compare versions</h2>
              </div>
            </div>
            {versions.length < 2 ? (
              <p className="status">
                Save at least two versions to compare them.
              </p>
            ) : (
              <>
                <div className="selectors">
                  <label htmlFor="earlier-version">
                    Earlier version
                    <select
                      id="earlier-version"
                      value={earlierId}
                      onChange={(event) => setEarlierId(event.target.value)}
                    >
                      {versions.map((version) => (
                        <option key={version.id} value={version.id}>
                          {version.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="arrow" aria-hidden="true">
                    -&gt;
                  </span>
                  <label htmlFor="later-version">
                    Later version
                    <select
                      id="later-version"
                      value={laterId}
                      onChange={(event) => setLaterId(event.target.value)}
                    >
                      {versions.map((version) => (
                        <option key={version.id} value={version.id}>
                          {version.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {diffLoading && <p className="status">Loading comparison...</p>}
                {displayedDiff && <DiffView diff={displayedDiff} />}
              </>
            )}
          </section>

          <section
            className="panel versions-panel"
            aria-labelledby="versions-heading"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Snapshots</p>
                <h2 id="versions-heading">Saved versions</h2>
              </div>
            </div>
            {versions.length === 0 ? (
              <p className="status">No saved versions yet.</p>
            ) : (
              <ul className="version-list">
                {versions.map((version) => (
                  <li key={version.id}>
                    <strong>{version.name}</strong>
                    <span>
                      {version.rowCount} rows -{' '}
                      {formatTimestamp(version.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function DiffView({ diff }: { diff: PlanDiff }) {
  const hasChanges =
    diff.added.length + diff.removed.length + diff.changed.length > 0;
  return (
    <div className="diff-view">
      {!hasChanges && <p className="status">These versions are identical.</p>}
      <DiffRows heading="Rows added" rows={diff.added} tone="added" />
      <DiffRows heading="Rows removed" rows={diff.removed} tone="removed" />
      {diff.changed.length > 0 && (
        <div className="diff-group">
          <h3>
            Rows changed <span>{diff.changed.length}</span>
          </h3>
          <ul className="change-list">
            {diff.changed.map(({ row, changes }) => (
              <li key={row.id}>
                <strong>{row.personName}</strong>
                {changes.map((change) => (
                  <ChangeLine key={change.field} change={change} />
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DiffRows({
  heading,
  rows,
  tone,
}: {
  heading: string;
  rows: Array<EditablePlanRow & { id: string }>;
  tone: 'added' | 'removed';
}) {
  return rows.length > 0 ? (
    <div className={`diff-group ${tone}`}>
      <h3>
        {heading} <span>{rows.length}</span>
      </h3>
      <ul className="change-list">
        {rows.map((row) => (
          <li key={row.id}>
            <strong>{row.personName}</strong>
            <span>
              {row.role} - {row.team} - {row.allocationPct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;
}

function ChangeLine({ change }: { change: ChangedField }) {
  const label =
    change.field === 'allocationPct'
      ? 'Allocation %'
      : change.field.replace(/([A-Z])/g, ' $1');
  return (
    <span className="field-change">
      <b>{label}</b> {String(change.oldValue)}{' '}
      <span aria-hidden="true">-&gt;</span> {String(change.newValue)}
    </span>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default App;
