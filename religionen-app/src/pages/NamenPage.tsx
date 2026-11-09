import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { NAMENSLISTE_JUDENTUM, PERSONEN_HINWEIS, PERSONEN_STANDARD } from '../data/personen';
import { aggregate } from '../lib/stats';
import { shuffle } from '../lib/srs';
import MatchTrainer from '../components/MatchTrainer';
import { Btn, Card, ModeButton, PageTitle, Tag } from '../components/ui';
import type { Person } from '../types';

type Group = Person['group'];
const GROUPS: { g: Group; label: string; icon: string }[] = [
  { g: 'judentum', label: 'Jüdische', icon: '✡️' },
  { g: 'christentum', label: 'Christliche', icon: '✝️' },
  { g: 'islam', label: 'Muslimische', icon: '☪️' },
];

export default function NamenPage() {
  const { p, content, persons } = useStore();
  const { startSession } = useNav();
  const [group, setGroup] = useState<Group | 'alle'>('alle');
  const [match, setMatch] = useState<'name' | 'job' | null>(null);
  const [edit, setEdit] = useState(false);

  const ps = group === 'alle' ? persons : persons.filter((x) => x.group === group);
  const ids = new Set(ps.map((x) => x.id));
  const items = content.items.filter((i) => i.topic === 'namen' && ids.has(i.id.replace(/^p-/, '').replace(/-(fl|lf|job|who)$/, '')));
  const suf = (s: string) => items.filter((i) => i.id.endsWith(`-${s}`));
  const ag = aggregate(items, p.states);

  if (match) {
    const make = () => shuffle(ps).slice(0, Math.min(6, ps.length)).map((x) => match === 'name'
      ? { left: x.first, right: x.last, itemId: `p-${x.id}-fl` }
      : { left: `${x.first} ${x.last}`, right: x.job, itemId: `p-${x.id}-job` });
    return <MatchTrainer title={match === 'name' ? 'Vor- und Nachname verbinden' : 'Namen und Berufe zuordnen'} makePairs={make}
      leftLabel={match === 'name' ? 'Vornamen' : 'Namen'} rightLabel={match === 'name' ? 'Nachnamen' : 'Berufe'} onExit={() => setMatch(null)} />;
  }

  if (edit) return <PersonEditor onClose={() => setEdit(false)} />;

  const title = (t: string) => `Namen${group === 'alle' ? '' : ` (${GROUPS.find((g) => g.g === group)?.label})`}: ${t}`;
  const empty = ps.length === 0;

  return (
    <div className="space-y-5 animate-fadein">
      <PageTitle icon="👤" title="Namen-Trainer" sub="Persönlichkeiten mit Vor- und Nachnamen und Beruf." />
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">⚠️ {PERSONEN_HINWEIS}</p>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setGroup('alle')} className={`rounded-full px-4 py-2 text-sm font-semibold ${group === 'alle' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Alle ({persons.length})</button>
        {GROUPS.map((g) => (
          <button key={g.g} onClick={() => setGroup(g.g)} className={`rounded-full px-4 py-2 text-sm font-semibold ${group === g.g ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {g.icon} {g.label} ({persons.filter((x) => x.group === g.g).length})
          </button>
        ))}
        <Btn variant="secondary" size="sm" onClick={() => setEdit(true)}>✏️ Bearbeiten / ergänzen</Btn>
      </div>

      {empty ? (
        <Card>
          <p className="font-bold">❗ Für diese Gruppe fehlt die Namensliste noch.</p>
          <p className="mt-1 text-sm text-slate-500">Sobald du sie hast: Tippe auf „Bearbeiten / ergänzen“ und trage die Personen ein. Es wird nichts erfunden.</p>
          <Btn className="mt-3" onClick={() => setEdit(true)}>Personen ergänzen</Btn>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-500">{ps.length} Personen · {Math.round(ag.score * 100)} % sicher</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeButton icon="🔗" title="1. Vor- und Nachname verbinden" desc="Zuordnungs-Aufgabe" onClick={() => setMatch('name')} />
            <ModeButton icon="💼" title="2. Namen und Berufe zuordnen" desc="Zuordnungs-Aufgabe" onClick={() => setMatch('job')} />
            <ModeButton icon="➡️" title="3. Vorname → Nachname eingeben" desc="Freitext" onClick={() => startSession({ title: title('Vorname → Nachname'), items: suf('fl'), count: 20 })} />
            <ModeButton icon="⬅️" title="4. Nachname → Vorname eingeben" desc="Freitext" onClick={() => startSession({ title: title('Nachname → Vorname'), items: suf('lf'), count: 20 })} />
            <ModeButton icon="🔍" title="5. Beruf → Persönlichkeit erkennen" desc="Wer ist gemeint?" onClick={() => startSession({ title: title('Beruf → Person'), items: suf('who'), count: 20 })} />
            <ModeButton icon="☑️" title="6. Multiple-Choice-Test" desc="Alle Fragen mit Auswahl" onClick={() => startSession({ title: title('Multiple Choice'), items, count: 25, mode: 'choice' })} />
            <ModeButton icon="🎲" title="7. Zufällige Abfrage aller" desc="Alles gemischt, Freitext" onClick={() => startSession({ title: title('Zufällig – alles'), items, count: 30, mode: 'varied' })} />
            <ModeButton icon="💼" title="Berufe eintippen" desc="Name → Beruf (Freitext)" onClick={() => startSession({ title: title('Berufe'), items: suf('job'), count: 20 })} />
          </div>

          <Card>
            <h2 className="mb-2 text-lg font-extrabold">📋 Liste</h2>
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[480px] text-sm">
                <thead><tr className="border-b text-left text-xs uppercase text-slate-500 dark:border-slate-700"><th className="py-2">Vorname</th><th>Nachname</th><th>Beruf</th><th></th></tr></thead>
                <tbody>
                  {[...ps].sort((a, b) => a.first.localeCompare(b.first)).map((x) => (
                    <tr key={x.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 font-bold">{x.first}</td>
                      <td className="font-bold">{x.last}</td>
                      <td>{x.job || <span className="text-rose-500">fehlt</span>}</td>
                      <td className="space-x-1">
                        {x.pairingUncertain && <Tag color="amber">Paarung unsicher</Tag>}
                        {x.jobNote && <Tag color="slate">Beruf prüfen</Tag>}
                        {x.custom && <Tag color="indigo">eigene</Tag>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(group === 'alle' || group === 'judentum') && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold text-slate-500">Original-Namensliste vom Arbeitsblatt (Judentum)</summary>
                <p className="mt-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">{NAMENSLISTE_JUDENTUM}</p>
              </details>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function PersonEditor({ onClose }: { onClose: () => void }) {
  const { persons, update, p } = useStore();
  const [list, setList] = useState<Person[]>(() => persons.map((x) => ({ ...x })));
  const [bulk, setBulk] = useState('');
  const [bulkGroup, setBulkGroup] = useState<Group>('christentum');
  const [msg, setMsg] = useState('');

  const set = (i: number, patch: Partial<Person>) => setList((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const add = (g: Group) => setList((l) => [...l, { id: `c${Date.now().toString(36)}${l.length}`, group: g, first: '', last: '', job: '', custom: true }]);

  function importBulk() {
    // Format pro Zeile: Vorname; Nachname; Beruf
    const rows = bulk.split('\n').map((r) => r.split(/[;\t|]/).map((x) => x.trim())).filter((r) => r[0] && r[1]);
    const neu = rows.map((r, i) => ({ id: `c${Date.now().toString(36)}${i}`, group: bulkGroup, first: r[0], last: r[1], job: r[2] ?? '', custom: true }) as Person);
    setList((l) => [...l, ...neu]);
    setMsg(`${neu.length} Personen hinzugefügt – „Speichern“ nicht vergessen.`);
    setBulk('');
  }

  function save() {
    const clean = list.filter((x) => x.first.trim() && x.last.trim()).map((x) => {
      const orig = PERSONEN_STANDARD.find((o) => o.id === x.id);
      // Beruf geändert → eigene Schreibweise als akzeptierte Antwort verwenden
      const jobChanged = !orig || orig.job !== x.job;
      return jobChanged ? { ...x, jobAccept: x.job ? x.job.split(/[\/,(]/).map((s) => s.replace(/\)/g, '').trim()).filter(Boolean) : [], jobNote: orig && jobChanged ? undefined : x.jobNote } : x;
    });
    update((prev) => ({ ...prev, persons: clean }));
    onClose();
  }

  const inp = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950';
  return (
    <div className="space-y-4 animate-fadein">
      <PageTitle icon="✏️" title="Persönlichkeiten bearbeiten" sub="Fehlende Namen ergänzen, Berufe nach deinen Notizen korrigieren. Alles wird lokal gespeichert." />
      <Card>
        <h2 className="mb-2 font-extrabold">Schnell einfügen (z. B. Christentum- oder Islam-Liste)</h2>
        <p className="mb-2 text-xs text-slate-500">Eine Person pro Zeile: <code>Vorname; Nachname; Beruf</code></p>
        <div className="mb-2 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button key={g.g} onClick={() => setBulkGroup(g.g)} className={`rounded-full px-3 py-1 text-sm font-semibold ${bulkGroup === g.g ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{g.icon} {g.label}</button>
          ))}
        </div>
        <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={4} className={inp} placeholder={'Martin; Luther; Reformator\n…'} />
        <Btn className="mt-2" variant="secondary" onClick={importBulk} disabled={!bulk.trim()}>Hinzufügen</Btn>
        {msg && <p className="mt-2 text-sm font-semibold text-emerald-600">{msg}</p>}
      </Card>

      {GROUPS.map((g) => (
        <Card key={g.g}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-extrabold">{g.icon} {g.label} Persönlichkeiten ({list.filter((x) => x.group === g.g).length})</h2>
            <Btn size="sm" variant="secondary" onClick={() => add(g.g)}>+ Person</Btn>
          </div>
          <div className="space-y-2">
            {list.map((x, i) => x.group !== g.g ? null : (
              <div key={x.id} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700 sm:grid-cols-[1fr_1fr_2fr_auto]">
                <input className={inp} value={x.first} placeholder="Vorname" onChange={(e) => set(i, { first: e.target.value })} />
                <input className={inp} value={x.last} placeholder="Nachname" onChange={(e) => set(i, { last: e.target.value })} />
                <input className={`${inp} col-span-2 sm:col-span-1`} value={x.job} placeholder="Beruf" onChange={(e) => set(i, { job: e.target.value })} />
                <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!x.pairingUncertain} onChange={(e) => set(i, { pairingUncertain: e.target.checked })} /> unsicher</label>
                  <Btn size="sm" variant="ghost" onClick={() => setList((l) => l.filter((_, j) => j !== i))} aria-label="Löschen">🗑️</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div className="sticky bottom-3 flex flex-wrap gap-2 rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur dark:bg-slate-900/90">
        <Btn size="lg" onClick={save}>💾 Speichern</Btn>
        <Btn size="lg" variant="secondary" onClick={onClose}>Abbrechen</Btn>
        {p.persons && <Btn size="lg" variant="ghost" onClick={() => { if (confirm('Wirklich alle Änderungen an den Personen löschen und die Standardliste wiederherstellen?')) { update((prev) => ({ ...prev, persons: null })); onClose(); } }}>Standardliste wiederherstellen</Btn>}
      </div>
    </div>
  );
}
