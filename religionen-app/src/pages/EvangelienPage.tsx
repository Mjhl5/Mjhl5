import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { EVANGELIEN, EVANGELIEN_GESCHICHTE } from '../data/evangelien';
import { aggregate } from '../lib/stats';
import MatchTrainer from '../components/MatchTrainer';
import { Btn, Card, ModeButton, PageTitle } from '../components/ui';

type MatchKind = 'sym' | 'abk' | 'abksym' | null;

export default function EvangelienPage() {
  const { p, content } = useStore();
  const { startSession } = useNav();
  const [flip, setFlip] = useState<Record<string, boolean>>({});
  const [match, setMatch] = useState<MatchKind>(null);
  const items = content.items.filter((i) => i.topic === 'evangelien');
  const ag = aggregate(items, p.states);

  if (match) {
    const make = () => EVANGELIEN.map((e) => match === 'sym'
      ? { left: e.name, right: e.symbol, itemId: `e-${e.abk}-sym` }
      : match === 'abk' ? { left: e.name, right: e.abk, itemId: `e-${e.abk}-abk` }
      : { left: e.abk, right: e.symbol, itemId: `e-${e.abk}-abksym` });
    return <MatchTrainer title={match === 'sym' ? 'Evangelist → Symbol zuordnen' : match === 'abk' ? 'Evangelist → Abkürzung zuordnen' : 'Abkürzung → Symbol zuordnen'}
      makePairs={make} leftLabel="Begriff" rightLabel="Zuordnung" onExit={() => setMatch(null)} />;
  }

  return (
    <div className="space-y-5 animate-fadein">
      <PageTitle icon="📖" title="Evangelien und ihre Symbole" sub="Namen, Abkürzungen und Symbole sicher zuordnen – wird besonders intensiv abgefragt." />

      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
        <h2 className="text-lg font-extrabold">💡 Merk-Geschichte</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{EVANGELIEN_GESCHICHTE}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {EVANGELIEN.map((e) => (
          <button key={e.abk} onClick={() => setFlip((f) => ({ ...f, [e.abk]: !f[e.abk] }))}
            className="min-h-[11rem] rounded-2xl border-2 border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900">
            {flip[e.abk] ? (
              <div className="animate-fadein">
                <div className="text-5xl">{e.icon}</div>
                <div className="mt-1 text-xl font-black">{e.symbol}</div>
                <div className="text-sm text-slate-500">{e.name} = {e.abk}</div>
                <div className="mt-2 text-xs text-slate-500">{e.bild}</div>
              </div>
            ) : (
              <div>
                <div className="text-2xl font-black">{e.name}</div>
                <div className="text-lg font-bold text-indigo-600">{e.abk}</div>
                <div className="mt-3 text-xs text-slate-400">Symbol? Erst überlegen, dann tippen</div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ModeButton icon="🔀" title="Alles abfragen" desc={`Name, Abkürzung, Symbol · ${Math.round(ag.score * 100)} % sicher`} onClick={() => startSession({ title: 'Evangelien – alles', items, count: items.length, mode: 'varied' })} />
        <ModeButton icon="🦁" title="Nur Symbole" desc="Evangelist ↔ Symbol" onClick={() => startSession({ title: 'Evangelien – Symbole', items: items.filter((i) => i.sub === 'Symbole'), count: 20 })} />
        <ModeButton icon="🔤" title="Nur Abkürzungen" desc="Mt, Mk, Lk, Jh" onClick={() => startSession({ title: 'Evangelien – Abkürzungen', items: items.filter((i) => i.sub === 'Abkürzungen'), count: 16 })} />
        <ModeButton icon="🧩" title="Zuordnen: Name → Symbol" desc="Zuordnungs-Aufgabe wie in der Klausur" onClick={() => setMatch('sym')} />
        <ModeButton icon="🧩" title="Zuordnen: Name → Abkürzung" onClick={() => setMatch('abk')} />
        <ModeButton icon="🧩" title="Zuordnen: Abkürzung → Symbol" onClick={() => setMatch('abksym')} />
      </div>

      <Card>
        <h2 className="mb-2 text-lg font-extrabold">Übersicht</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs uppercase text-slate-500 dark:border-slate-700"><th className="py-2">Evangelium</th><th>Abkürzung</th><th>Symbol</th></tr></thead>
          <tbody>
            {[EVANGELIEN[1], EVANGELIEN[0], EVANGELIEN[2], EVANGELIEN[3]].map((e) => (
              <tr key={e.abk} className="border-b border-slate-100 dark:border-slate-800"><td className="py-2 font-bold">{e.name}</td><td>{e.abk}</td><td>{e.icon} {e.symbol}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">Reihenfolge wie auf deinem Blatt (Markus zuerst). In der Bibel: Mt – Mk – Lk – Jh. Hinweis: „Jh“ wie im Unterricht; üblich ist auch „Joh“ – beides wird akzeptiert.</p>
        <Btn variant="ghost" size="sm" className="mt-2" onClick={() => setFlip({})}>Karten wieder umdrehen</Btn>
      </Card>
    </div>
  );
}
