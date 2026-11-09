import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { STECKBRIEFE } from '../data/religionen';
import { aggregate } from '../lib/stats';
import { Bar, Btn, Card, PageTitle } from '../components/ui';

export default function ReligionenPage() {
  const { p, content } = useStore();
  const { startSession } = useNav();
  const [key, setKey] = useState<'judentum' | 'christentum' | 'islam'>('judentum');
  const [cover, setCover] = useState(false);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const sb = STECKBRIEFE.find((s) => s.key === key)!;
  const items = content.items.filter((i) => i.topic === key);
  const subs = [...new Set(items.map((i) => i.sub))];
  const all3 = content.items.filter((i) => ['judentum', 'christentum', 'islam'].includes(i.topic));
  const ag = aggregate(items, p.states);

  return (
    <div className="space-y-5 animate-fadein">
      <PageTitle icon="📋" title="Religionen-Trainer" sub="Die drei Steckbriefe – erst lesen, dann aktiv abfragen lassen." />

      <div className="grid grid-cols-3 gap-2">
        {STECKBRIEFE.map((s) => {
          const a = aggregate(content.items.filter((i) => i.topic === s.key), p.states);
          return (
            <button key={s.key} onClick={() => { setKey(s.key); setShown({}); }}
              className={`rounded-2xl border-2 p-3 text-center transition ${key === s.key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
              <div className="text-3xl">{s.icon}</div>
              <div className="font-extrabold">{s.name}</div>
              <Bar value={a.score} className="mt-2" color="bg-emerald-500" />
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">{sb.icon} {sb.name}: aktiv abfragen</h2>
            <p className="text-sm text-slate-500">{ag.mastered} von {ag.total} Fragen sicher · {Math.round(ag.score * 100)} %</p>
          </div>
          <Btn size="lg" onClick={() => startSession({ title: `Steckbrief ${sb.name}`, items, count: 25, mode: 'varied' })}>▶ Ganzen Steckbrief abfragen</Btn>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {subs.map((s) => {
            const its = items.filter((i) => i.sub === s);
            const a = aggregate(its, p.states);
            return (
              <button key={s} onClick={() => startSession({ title: `${sb.name}: ${s}`, items: its, count: its.length })}
                className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-semibold transition hover:border-indigo-400 dark:border-slate-700">
                {s} <span className="ml-1 text-xs text-slate-500">{Math.round(a.score * 100)} %</span>
              </button>
            );
          })}
        </div>
        <Btn variant="secondary" className="mt-4" onClick={() => startSession({ title: 'Alle drei Steckbriefe gemischt', items: all3, count: 30, mode: 'varied' })}>🔀 Alle drei Steckbriefe gemischt</Btn>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold">{sb.icon} Steckbrief {sb.name}</h2>
          <Btn size="sm" variant={cover ? 'primary' : 'secondary'} onClick={() => { setCover((c) => !c); setShown({}); }}>{cover ? '🙈 Abdeck-Modus an' : '👁️ Abdeck-Modus'}</Btn>
        </div>
        {cover && <p className="mb-3 text-sm text-slate-500">Sag zuerst laut, was in dem Feld steht. Dann tippe darauf zum Aufdecken.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {sb.sections.map((sec) => {
            const hidden = cover && !shown[sec.title];
            return (
              <div key={sec.title} className={`rounded-xl border border-slate-200 p-3 dark:border-slate-700 ${sec.lines.length > 3 ? 'sm:col-span-2' : ''}`}>
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">{sec.title}</div>
                {hidden ? (
                  <button onClick={() => setShown((s) => ({ ...s, [sec.title]: true }))} className="w-full rounded-lg bg-slate-100 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-800">❓ Aufdecken</button>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {sec.lines.map((l) => <li key={l} className="flex gap-2"><span className="text-slate-400">•</span><span>{l}</span></li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-extrabold">💡 Eselsbrücken {sb.name}</h2>
        <ul className="space-y-2 text-sm">
          {[...new Map(items.filter((i) => i.mnemonic).map((i) => [i.mnemonic, i])).values()].map((i) => (
            <li key={i.id} className="rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"><b>{i.sub}:</b> {i.mnemonic}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
