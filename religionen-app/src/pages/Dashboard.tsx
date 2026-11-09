import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { aggregate, fmtTime, weakItems, weaknesses } from '../lib/stats';
import { TOPIC_ICON, TOPIC_LABEL } from '../lib/content';
import { nextBlock, planStatus } from '../lib/plan';
import { Bar, Btn, Card } from '../components/ui';
import type { Topic } from '../types';

const TOPICS: Topic[] = ['laender', 'judentum', 'christentum', 'islam', 'vergleich', 'evangelien', 'namen'];
const TOPIC_ROUTE: Record<Topic, string> = { laender: 'laender', judentum: 'religionen', christentum: 'religionen', islam: 'religionen', vergleich: 'vergleich', evangelien: 'evangelien', namen: 'namen', zusatz: 'daten' };

export default function Dashboard() {
  const { p, content } = useStore();
  const { go, startSession } = useNav();
  const all = content.items;
  const a = aggregate(all, p.states);
  const weak = weaknesses(all, p.states).slice(0, 5);
  const weakIts = weakItems(all, p.states);
  const next = nextBlock(planStatus(all, p.states, p.planSpent, p.planDone));
  const open = a.total - a.seen;
  const lastExam = p.exams[0];

  const stats = [
    { label: 'Gesamtfortschritt', value: `${Math.round(a.score * 100)} %`, icon: '📈' },
    { label: 'Sicher gelernt', value: `${a.mastered} / ${a.total}`, icon: '✅' },
    { label: 'Falsche Antworten', value: String(p.wrongTotal), icon: '❌' },
    { label: 'Noch offen', value: String(open), icon: '🆕' },
    { label: 'Lernzeit', value: fmtTime(p.studyMs), icon: '⏱️' },
    { label: 'Letzte Klausur', value: lastExam ? `${lastExam.pct} % (${lastExam.grade})` : '–', icon: '📝' },
  ];

  return (
    <div className="space-y-5 animate-fadein">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Klausur: Die Weltreligionen</p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">Du schaffst das! 💪</h1>
        <p className="mt-2 max-w-xl text-sm opacity-90">Aktiv abfragen, Fehler wiederholen, mischen. Die App merkt sich alles, was du falsch machst, und fragt es so lange, bis es sitzt.</p>
        <div className="mt-5">
          <div className="mb-1 flex justify-between text-sm font-semibold"><span>Gesamtfortschritt</span><span>{Math.round(a.score * 100)} %</span></div>
          <Bar value={a.score} color="bg-white" className="bg-white/25" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Btn size="lg" className="!bg-white !text-indigo-700 hover:!bg-indigo-50"
            onClick={() => startSession({ title: 'Gemischt lernen (alle Themen)', items: all, count: 25, mode: 'varied' })}>▶ Gemischt lernen</Btn>
          <Btn size="lg" variant="secondary" className="!bg-white/15 !text-white hover:!bg-white/25" disabled={!weakIts.length}
            onClick={() => startSession({ title: 'Meine Schwächen', items: weakIts, count: 30 })}>🎯 Meine Schwächen ({weakIts.length})</Btn>
        </div>
      </div>

      {next && (
        <button onClick={() => go('plan')} className="flex w-full items-center gap-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-left transition hover:shadow-md dark:border-amber-700 dark:bg-amber-900/20">
          <span className="text-3xl">⏰</span>
          <span className="flex-1">
            <span className="block text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Als Nächstes lernen (Plan „Klausur morgen“)</span>
            <span className="block text-lg font-extrabold">{next.block.icon} {next.block.title}</span>
            <span className="block text-sm text-slate-600 dark:text-slate-400">{next.block.desc}{next.weak ? ' · ⚠️ hier hast du viele Fehler' : ''}</span>
          </span>
          <span className="text-xl">→</span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="!p-4">
            <div className="text-xs font-semibold text-slate-500">{s.icon} {s.label}</div>
            <div className="mt-1 text-2xl font-black">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-extrabold">Fortschritt nach Thema</h2>
          <div className="space-y-3">
            {TOPICS.map((t) => {
              const its = all.filter((i) => i.topic === t);
              const ag = aggregate(its, p.states);
              return (
                <button key={t} onClick={() => go(TOPIC_ROUTE[t] as never)} className="block w-full text-left">
                  <div className="mb-1 flex justify-between text-sm font-semibold">
                    <span>{TOPIC_ICON[t]} {TOPIC_LABEL[t]}</span>
                    <span className="text-slate-500">{ag.mastered}/{ag.total} sicher · {Math.round(ag.score * 100)} %</span>
                  </div>
                  <Bar value={ag.score} color={ag.score > 0.75 ? 'bg-emerald-500' : ag.score > 0.4 ? 'bg-indigo-500' : 'bg-amber-500'} />
                </button>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-extrabold">🔥 Größte Schwächen</h2>
          {weak.length === 0 ? (
            <p className="text-sm text-slate-500">Noch keine Fehler gespeichert. Leg los – deine Schwächen erscheinen hier automatisch.</p>
          ) : (
            <ul className="space-y-2">
              {weak.map((w) => (
                <li key={w.key} className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-900/20">
                  <span className="text-sm font-semibold">{TOPIC_ICON[w.topic]} {TOPIC_LABEL[w.topic]} – {w.sub}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-rose-600">{w.weakItems} offen · {w.wrong}× falsch</span>
                    <Btn size="sm" variant="danger" onClick={() => startSession({ title: `Schwäche: ${w.sub}`, items: all.filter((i) => i.topic === w.topic && i.sub === w.sub), count: 20 })}>Üben</Btn>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Btn variant="secondary" className="mt-3" onClick={() => go('fehler')}>Alle Fehler ansehen →</Btn>
        </Card>
      </div>
    </div>
  );
}
