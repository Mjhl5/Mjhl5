import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { LAENDER, LAENDER_GRUPPEN_MERK } from '../data/laender';
import { aggregate } from '../lib/stats';
import WorldMap from '../components/WorldMap';
import { Bar, Btn, Card, ModeButton, PageTitle } from '../components/ui';
import type { Item } from '../types';

const MODES: { key: string; t: string; d: string; icon: string; suffix: string[]; mode?: 'auto' }[] = [
  { key: 'A', t: 'A: Land → Hauptstadt', d: 'Hauptstadt eintippen', icon: '🏙️', suffix: ['hs'] },
  { key: 'B', t: 'B: Hauptstadt → Land', d: 'Land eintippen', icon: '🗺️', suffix: ['land'] },
  { key: 'C', t: 'C: Land → Kontinent', d: 'Kontinent auswählen', icon: '🌐', suffix: ['kont'] },
  { key: 'D', t: 'D: Land → Religion', d: 'Vorherrschende Religion eintippen', icon: '🕌', suffix: ['rel'] },
  { key: 'E', t: 'E: Komplette Zuordnung', d: 'Hauptstadt + Kontinent + Religion', icon: '🧩', suffix: ['all'] },
  { key: 'F', t: 'F: Karten-Quiz', d: 'Nummer → Land und Land → Nummer', icon: '📍', suffix: ['map', 'mapclick'] },
];

export default function LaenderPage() {
  const { p, content } = useStore();
  const { startSession } = useNav();
  const [hide, setHide] = useState<Record<string, boolean>>({});
  const [showMapNames, setShowMapNames] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const items = content.items.filter((i) => i.topic === 'laender');
  const bySuffix = (s: string[]) => items.filter((i) => s.some((x) => i.id.endsWith(`-${x}`)));

  const cols: [string, string][] = [['kontinent', 'Kontinent'], ['hauptstadt', 'Hauptstadt'], ['religion', 'Religion']];

  return (
    <div className="space-y-5 animate-fadein">
      <PageTitle icon="🌍" title="Ländertrainer" sub="20 Länder: Kontinent, Hauptstadt und vorherrschende Religion. Immer in zufälliger Reihenfolge." />

      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => {
          const its = bySuffix(m.suffix);
          const ag = aggregate(its, p.states);
          return (
            <ModeButton key={m.key} icon={m.icon} title={m.t} desc={`${m.d} · ${Math.round(ag.score * 100)} % sicher`}
              onClick={() => startSession({ title: `Länder ${m.t}`, items: its as Item[], count: m.key === 'F' ? 20 : 20 })} />
          );
        })}
        <ModeButton icon="🔀" title="Alles gemischt" desc="Alle Modi durcheinander (Interleaving)"
          onClick={() => startSession({ title: 'Länder – alles gemischt', items, count: 30, mode: 'varied' })} />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">📋 Lerntabelle</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="self-center text-slate-500">Spalte abdecken:</span>
            {cols.map(([k, l]) => (
              <button key={k} onClick={() => setHide((h) => ({ ...h, [k]: !h[k] }))}
                className={`rounded-full px-3 py-1 font-semibold ${hide[k] ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{hide[k] ? '🙈' : '👁️'} {l}</button>
            ))}
          </div>
        </div>
        <p className="mb-2 text-xs text-slate-500">Tipp: Deck eine Spalte ab, sag die Antwort laut und tippe dann auf das Feld, um sie aufzudecken.</p>
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700">
                <th className="px-2 py-2">Nr.</th><th className="px-2">Land</th><th className="px-2">Kontinent</th><th className="px-2">Hauptstadt</th><th className="px-2">Religion</th><th className="px-2">Sicher</th>
              </tr>
            </thead>
            <tbody>
              {LAENDER.map((L) => {
                const ag = aggregate(items.filter((i) => i.id.startsWith(`l-${L.nr}-`)), p.states);
                return (
                  <tr key={L.nr} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-2 py-2 font-bold text-slate-400">{L.nr}</td>
                    <td className="px-2 font-bold" title={L.merk}>{L.land}</td>
                    {cols.map(([k]) => {
                      const id = `${L.nr}-${k}`;
                      const hidden = hide[k] && !reveal[id];
                      return (
                        <td key={k} className="px-2">
                          {hidden ? (
                            <button onClick={() => setReveal((r) => ({ ...r, [id]: true }))} className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700">aufdecken</button>
                          ) : (L as unknown as Record<string, string>)[k]}
                        </td>
                      );
                    })}
                    <td className="w-24 px-2"><Bar value={ag.score} color="bg-emerald-500" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {Object.keys(reveal).length > 0 && <Btn variant="ghost" size="sm" className="mt-2" onClick={() => setReveal({})}>Wieder alles abdecken</Btn>}
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">💡 {LAENDER_GRUPPEN_MERK}</p>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">🗺️ Karte mit Nummern 1–20</h2>
          <Btn size="sm" variant="secondary" onClick={() => setShowMapNames((s) => !s)}>{showMapNames ? 'Namen ausblenden' : 'Namen zeigen'}</Btn>
        </div>
        <WorldMap showNames={showMapNames} />
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-extrabold">💡 Eselsbrücken zu jedem Land</h2>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {LAENDER.map((L) => (
            <li key={L.nr} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"><b>{L.land} – {L.hauptstadt}:</b> {L.merk}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
