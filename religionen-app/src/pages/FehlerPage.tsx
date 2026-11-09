import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { confusions, weakItems } from '../lib/stats';
import { TOPIC_ICON, TOPIC_LABEL } from '../lib/content';
import { MASTERED_BOX } from '../lib/srs';
import { Btn, Card, PageTitle, Tag } from '../components/ui';

const CATS: { label: string; test: (sub: string, topic: string) => boolean }[] = [
  { label: '🏙️ Falsche Hauptstädte', test: (s) => s === 'Hauptstädte' || s === 'Komplette Zuordnung' },
  { label: '🗺️ Verwechselte Länder', test: (s) => s === 'Länder zu Hauptstädten' || s === 'Karte' || s === 'Kontinente' || s === 'Religionen der Länder' },
  { label: '👤 Vergessene Namen', test: (_s, t) => t === 'namen' },
  { label: '✡️ Falsche Symbole', test: (s) => s.startsWith('Symbol') },
  { label: '🎉 Verwechselte Feiertage', test: (s) => s === 'Feiertage' || s === 'Wochenfeiertag' || s === 'Wichtiges Fest' },
];

export default function FehlerPage() {
  const { p, content, update } = useStore();
  const { startSession } = useNav();
  const [showAll, setShowAll] = useState(false);
  const weak = weakItems(content.items, p.states).sort((a, b) => (p.states[b.id].wrong - p.states[a.id].wrong) || (p.states[a.id].box - p.states[b.id].box));
  const conf = confusions(p.mistakes, content.byId);
  const lastGiven = new Map<string, string>();
  for (const m of p.mistakes) if (!lastGiven.has(m.id)) lastGiven.set(m.id, m.given);

  return (
    <div className="space-y-5 animate-fadein">
      <PageTitle icon="🎯" title="Meine Fehler" sub="Alle falschen Antworten werden automatisch gesammelt. Hier trainierst du nur deine Schwächen – so lange, bis sie sitzen." />

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-3xl font-black">{weak.length}</div>
          <div className="text-sm text-slate-500">Fragen sitzen noch nicht sicher · {p.wrongTotal} Fehler insgesamt</div>
        </div>
        <Btn size="lg" variant="danger" disabled={!weak.length} onClick={() => startSession({ title: '🎯 Meine Schwächen', items: weak, count: 30 })}>▶ Meine Schwächen trainieren</Btn>
      </Card>

      {weak.length === 0 && (
        <Card><p className="text-center text-slate-500">🎉 Keine offenen Fehler! Lerne weiter oder mach eine Klausur-Simulation – neue Fehler landen automatisch hier.</p></Card>
      )}

      {weak.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATS.map((c) => {
            const its = weak.filter((i) => c.test(i.sub, i.topic));
            return (
              <Card key={c.label} className="!p-4">
                <div className="font-bold">{c.label}</div>
                <div className="text-sm text-slate-500">{its.length} offen</div>
                <Btn size="sm" className="mt-2" variant="secondary" disabled={!its.length} onClick={() => startSession({ title: c.label, items: its, count: its.length })}>Trainieren</Btn>
              </Card>
            );
          })}
        </div>
      )}

      {conf.length > 0 && (
        <Card>
          <h2 className="mb-2 text-lg font-extrabold">🔀 Häufige Verwechslungen</h2>
          <ul className="space-y-1 text-sm">
            {conf.slice(0, 15).map((c) => (
              <li key={c.a + c.b} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-1.5 dark:border-slate-800">
                <span>Richtig <b className="text-emerald-600">{c.a}</b> – du hast <b className="text-rose-600">{c.b}</b> gesagt</span>
                <Tag color="rose">{c.n}×</Tag>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {weak.length > 0 && (
        <Card>
          <h2 className="mb-2 text-lg font-extrabold">📋 Fehlerliste</h2>
          <ul className="space-y-2 text-sm">
            {(showAll ? weak : weak.slice(0, 25)).map((it) => {
              const s = p.states[it.id];
              return (
                <li key={it.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag color="indigo">{TOPIC_ICON[it.topic]} {TOPIC_LABEL[it.topic]}</Tag>
                    <Tag>{it.sub}</Tag>
                    <Tag color="rose">{s.wrong}× falsch</Tag>
                    {s.box >= MASTERED_BOX && <Tag color="emerald">wird besser</Tag>}
                  </div>
                  <div className="mt-1 font-semibold">{it.prompts[0]}</div>
                  <div>Richtig: <b className="text-emerald-700 dark:text-emerald-400">{it.answer}</b>{lastGiven.get(it.id) && <span className="text-slate-500"> · zuletzt: <span className="line-through">{lastGiven.get(it.id)}</span></span>}</div>
                  {it.mnemonic && <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">💡 {it.mnemonic.split('\n')[0]}</div>}
                </li>
              );
            })}
          </ul>
          {weak.length > 25 && <Btn variant="ghost" className="mt-2" onClick={() => setShowAll((x) => !x)}>{showAll ? 'Weniger zeigen' : `Alle ${weak.length} zeigen`}</Btn>}
        </Card>
      )}

      {p.mistakes.length > 0 && (
        <Btn variant="ghost" onClick={() => { if (confirm('Fehlerliste wirklich leeren? (Der Lernstand der Fragen bleibt erhalten.)')) update((x) => ({ ...x, mistakes: [], states: Object.fromEntries(Object.entries(x.states).map(([k, v]) => [k, { ...v, wrong: 0 }])) })); }}>Fehlerliste leeren</Btn>
      )}
    </div>
  );
}
