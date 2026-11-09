import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { orderedPlan, planStatus, type PlanBlockStatus } from '../lib/plan';
import { weakItems } from '../lib/stats';
import { Bar, Btn, Card, PageTitle, Tag } from '../components/ui';

export default function PlanPage() {
  const { p, content, update } = useStore();
  const { go, startSession } = useNav();
  const st = orderedPlan(planStatus(content.items, p.states, p.planSpent, p.planDone));
  const next = st.find((s) => !s.done);
  const totalSpent = st.reduce((x, s) => x + Math.min(s.spentMin, s.block.to - s.block.from), 0);

  function start(s: PlanBlockStatus) {
    const b = s.block;
    if (b.kind === 'exam') return go('klausur');
    if (b.kind === 'errors') {
      const w = weakItems(content.items, p.states);
      return startSession({ title: `${b.icon} ${b.title}`, items: w.length ? w : content.items, count: 30, planBlock: b.id });
    }
    startSession({ title: `${b.icon} ${b.title}`, items: content.items.filter(b.filter), count: 25, planBlock: b.id, mode: 'varied' });
  }
  const toggle = (id: string) => update((x) => ({ ...x, planDone: { ...x.planDone, [id]: !x.planDone[id] } }));

  return (
    <div className="space-y-4 animate-fadein">
      <PageTitle icon="⏰" title="Notfall-Lernplan: Klausur morgen" sub="Ca. 120 Minuten. Die Reihenfolge passt sich an deine Fehler an – schwache Themen rutschen nach vorne." />
      <Card>
        <div className="mb-1 flex justify-between text-sm font-semibold"><span>Plan-Fortschritt (Zeit)</span><span>{Math.round(totalSpent)} / 120 min</span></div>
        <Bar value={totalSpent / 120} />
        {next ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-900/30">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Jetzt dran</div>
              <div className="text-xl font-extrabold">{next.block.icon} {next.block.title}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{next.block.desc} · ca. {next.block.to - next.block.from} Minuten</div>
            </div>
            <Btn size="lg" onClick={() => start(next)}>▶ Starten</Btn>
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">🎉 Plan komplett! Mach zum Schluss noch eine Klausur-Simulation oder trainiere deine Fehler.</p>
        )}
      </Card>

      <div className="space-y-3">
        {st.map((s, i) => {
          const dur = s.block.to - s.block.from;
          const timeOk = s.spentMin >= dur;
          return (
            <Card key={s.block.id} className={`${s.done ? 'opacity-60' : ''} ${next?.block.id === s.block.id ? 'ring-2 ring-indigo-500' : ''}`}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">{s.done ? '✅' : s.block.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Schritt {i + 1} · {s.block.from}–{s.block.to} min</span>
                    {s.weak && !s.done && <Tag color="rose">⚠️ viele Fehler – vorgezogen</Tag>}
                    {timeOk && !s.done && <Tag color="emerald">Zeit erreicht</Tag>}
                  </div>
                  <div className="text-lg font-extrabold">{s.block.title}</div>
                  <div className="text-sm text-slate-500">{s.block.desc}</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <div className="flex justify-between text-xs text-slate-500"><span>Zeit</span><span>{Math.round(s.spentMin)} / {dur} min</span></div>
                      <Bar value={s.spentMin / dur} color="bg-sky-500" />
                    </div>
                    {s.block.kind === 'quiz' && (
                      <div>
                        <div className="flex justify-between text-xs text-slate-500"><span>Beherrscht</span><span>{Math.round(s.mastery * 100)} %</span></div>
                        <Bar value={s.mastery} color="bg-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex w-full gap-2 sm:w-auto sm:flex-col">
                  <Btn onClick={() => start(s)}>{s.block.kind === 'exam' ? 'Zur Prüfung' : 'Lernen'}</Btn>
                  <Btn variant="secondary" onClick={() => toggle(s.block.id)}>{s.done ? 'Wieder öffnen' : 'Erledigt ✓'}</Btn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Btn variant="ghost" onClick={() => update((x) => ({ ...x, planDone: {}, planSpent: {} }))}>Plan zurücksetzen</Btn>
    </div>
  );
}
