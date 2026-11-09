import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { shuffle } from '../lib/srs';
import { LAENDER } from '../data/laender';
import { EVANGELIEN } from '../data/evangelien';
import QuestionCard, { type QMode, type QResult } from '../components/QuestionCard';
import MatchGame, { type MatchPair } from '../components/MatchGame';
import { Bar, Btn, Card, ConfirmBtn, PageTitle, Tag } from '../components/ui';
import type { Item } from '../types';

type Section = 'Länder & Hauptstädte' | 'Religionen der Länder' | 'Steckbriefe' | 'Vergleich' | 'Evangelien' | 'Persönlichkeiten' | 'Berufe';
type Task =
  | { kind: 'q'; item: Item; mode: QMode; section: Section; typ: string }
  | { kind: 'match'; pairs: MatchPair[]; section: Section; title: string; typ: string; left: string; right: string };

interface Answer { task: Task; points: number; max: number; lines: { q: string; given: string; expected: string; ok: boolean }[] }

export function gradeFor(pct: number): string {
  if (pct >= 92) return '1';
  if (pct >= 81) return '2';
  if (pct >= 67) return '3';
  if (pct >= 50) return '4';
  if (pct >= 30) return '5';
  return '6';
}

function buildExam(items: Item[], long: boolean, persons: { id: string; first: string; last: string; job: string }[]): Task[] {
  const f = (pred: (i: Item) => boolean, n: number) => shuffle(items.filter(pred)).slice(0, n);
  const m = long ? 1 : 0.6;
  const n = (x: number) => Math.max(1, Math.round(x * m));
  const t: Task[] = [];
  const steck = (i: Item) => ['judentum', 'christentum', 'islam'].includes(i.topic);
  // Länder
  f((i) => i.id.endsWith('-hs'), n(4)).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Länder & Hauptstädte', typ: 'Freitext' }));
  f((i) => i.id.endsWith('-land'), n(2)).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Länder & Hauptstädte', typ: 'Freitext' }));
  f((i) => i.id.endsWith('-kont'), n(2)).forEach((item) => t.push({ kind: 'q', item, mode: 'choice', section: 'Länder & Hauptstädte', typ: 'Multiple Choice' }));
  f((i) => i.id.endsWith('-map'), n(2)).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Länder & Hauptstädte', typ: 'Karte' }));
  t.push({ kind: 'match', section: 'Länder & Hauptstädte', title: 'Ordne den Ländern die Hauptstädte zu.', typ: 'Zuordnung', left: 'Land', right: 'Hauptstadt',
    pairs: shuffle(LAENDER).slice(0, 5).map((L) => ({ left: L.land, right: L.hauptstadt, itemId: `l-${L.nr}-hs` })) });
  f((i) => i.id.endsWith('-rel'), n(3)).forEach((item, k) => t.push({ kind: 'q', item, mode: k % 2 ? 'tf' : 'auto', section: 'Religionen der Länder', typ: k % 2 ? 'Richtig/Falsch' : 'Freitext' }));
  // Steckbriefe
  f((i) => steck(i) && !!i.cloze, n(5)).forEach((item) => t.push({ kind: 'q', item, mode: 'cloze', section: 'Steckbriefe', typ: 'Lückentext' }));
  f((i) => steck(i) && i.kind === 'input' && !i.cloze, n(4)).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Steckbriefe', typ: 'Freitext' }));
  f((i) => steck(i) && i.kind === 'list', n(3)).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Steckbriefe', typ: 'Freitext (Aufzählung)' }));
  f((i) => steck(i) && !!i.tf && i.kind === 'input', n(2)).forEach((item) => t.push({ kind: 'q', item, mode: 'tf', section: 'Steckbriefe', typ: 'Richtig/Falsch' }));
  f((i) => steck(i) && i.kind === 'choice', n(1)).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Steckbriefe', typ: 'Multiple Choice' }));
  // Vergleich
  f((i) => i.topic === 'vergleich' && i.kind === 'input', n(6)).forEach((item, k) => t.push({ kind: 'q', item, mode: k === 2 ? 'tf' : k === 4 ? 'choice' : 'auto', section: 'Vergleich', typ: k === 2 ? 'Richtig/Falsch' : k === 4 ? 'Multiple Choice' : 'Freitext' }));
  // Evangelien
  t.push({ kind: 'match', section: 'Evangelien', title: 'Ordne den Evangelisten ihre Symbole zu.', typ: 'Zuordnung', left: 'Evangelist', right: 'Symbol',
    pairs: EVANGELIEN.map((e) => ({ left: e.name, right: e.symbol, itemId: `e-${e.abk}-sym` })) });
  f((i) => i.topic === 'evangelien' && i.sub === 'Abkürzungen', n(2)).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Evangelien', typ: 'Freitext' }));
  f((i) => i.topic === 'evangelien' && i.id.endsWith('-name'), 1).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Evangelien', typ: 'Freitext' }));
  // Persönlichkeiten
  if (persons.length >= 4) {
    t.push({ kind: 'match', section: 'Persönlichkeiten', title: 'Verbinde Vor- und Nachnamen.', typ: 'Zuordnung', left: 'Vorname', right: 'Nachname',
      pairs: shuffle(persons).slice(0, 5).map((x) => ({ left: x.first, right: x.last, itemId: `p-${x.id}-fl` })) });
    t.push({ kind: 'match', section: 'Berufe', title: 'Ordne den Personen ihre Berufe zu.', typ: 'Zuordnung', left: 'Person', right: 'Beruf',
      pairs: shuffle(persons.filter((x) => x.job)).slice(0, 4).map((x) => ({ left: `${x.first} ${x.last}`, right: x.job, itemId: `p-${x.id}-job` })) });
  }
  f((i) => i.topic === 'namen' && (i.id.endsWith('-fl') || i.id.endsWith('-lf')), n(4)).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Persönlichkeiten', typ: 'Freitext' }));
  f((i) => i.topic === 'namen' && i.id.endsWith('-job'), n(2)).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Berufe', typ: 'Freitext' }));
  f((i) => i.topic === 'namen' && i.id.endsWith('-who'), n(2)).forEach((item) => t.push({ kind: 'q', item, mode: 'auto', section: 'Berufe', typ: 'Multiple Choice' }));
  // Durchmischen, aber Zuordnungen verteilt lassen
  return shuffle(t);
}

const SECTION_ROUTE: Record<Section, string> = {
  'Länder & Hauptstädte': 'laender', 'Religionen der Länder': 'laender', Steckbriefe: 'religionen', Vergleich: 'vergleich', Evangelien: 'evangelien', Persönlichkeiten: 'namen', Berufe: 'namen',
};

export default function KlausurPage() {
  const { p, content, persons, answer, update, addStudyTime } = useStore();
  const { go } = useNav();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);
  const lastAct = useRef(Date.now());

  useEffect(() => {
    if (!tasks || finished) return;
    const t = setInterval(() => { if (document.visibilityState === 'visible' && Date.now() - lastAct.current < 120_000) addStudyTime(5000, 'pruefung'); }, 5000);
    const act = () => (lastAct.current = Date.now());
    window.addEventListener('keydown', act); window.addEventListener('pointerdown', act);
    return () => { clearInterval(t); window.removeEventListener('keydown', act); window.removeEventListener('pointerdown', act); };
  }, [tasks, finished, addStudyTime]);

  function start(long: boolean) {
    setTasks(buildExam(content.items, long, persons));
    setIdx(0); setAnswers([]); setFinished(false);
  }

  function record(a: Answer) {
    const next = [...answers, a];
    setAnswers(next);
    window.scrollTo({ top: 0 });
    if (idx + 1 >= (tasks?.length ?? 0)) {
      const pts = next.reduce((x, y) => x + y.points, 0);
      const max = next.reduce((x, y) => x + y.max, 0);
      const pct = Math.round((pts / max) * 100);
      update((prev) => ({ ...prev, exams: [{ at: Date.now(), pct, grade: gradeFor(pct), total: max, right: pts }, ...prev.exams].slice(0, 30) }));
      setFinished(true);
    } else setIdx(idx + 1);
  }

  function onQ(task: Extract<Task, { kind: 'q' }>, r: QResult) {
    answer({ itemId: task.item.id, correct: r.correct, given: r.given, expected: r.expected, confusedWith: r.confusedWith });
    record({ task, points: r.correct ? 1 : 0, max: 1, lines: [{ q: r.prompt ?? task.item.prompts[0], given: r.given || '–', expected: task.mode === 'tf' ? r.expected : task.item.answer, ok: r.correct }] });
  }

  function onMatch(task: Extract<Task, { kind: 'match' }>, res: { pair: MatchPair; given: string; correct: boolean }[]) {
    res.forEach((r) => r.pair.itemId && answer({ itemId: r.pair.itemId, correct: r.correct, given: r.given, expected: r.pair.right, confusedWith: r.correct ? undefined : r.given || undefined }));
    record({ task, points: res.filter((r) => r.correct).length, max: res.length,
      lines: res.map((r) => ({ q: `${task.title} – ${r.pair.left}`, given: r.given || '–', expected: r.pair.right, ok: r.correct })) });
  }

  // ── Startbildschirm
  if (!tasks) {
    return (
      <div className="space-y-5 animate-fadein">
        <PageTitle icon="📝" title="Klausur-Simulator" sub="Wie eine echte Prüfung: keine Hilfe, keine Rückmeldung bis zum Ende. Danach Note, Musterlösung und Lern-Empfehlung." />
        <Card>
          <h2 className="font-extrabold">Was drankommt</h2>
          <p className="mt-1 text-sm text-slate-500">Länder & Hauptstädte · Kontinente · Religionen · Steckbriefe · Vergleich · Evangelien · Persönlichkeiten · Berufe</p>
          <p className="mt-1 text-sm text-slate-500">Aufgabentypen: Freitext · Multiple Choice · Zuordnung · Lückentext · Richtig/Falsch · Karte</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn size="lg" onClick={() => start(false)}>Kurze Klausur (ca. 25 Aufgaben)</Btn>
            <Btn size="lg" variant="secondary" onClick={() => start(true)}>Lange Klausur (ca. 45 Aufgaben)</Btn>
          </div>
        </Card>
        {p.exams.length > 0 && (
          <Card>
            <h2 className="mb-2 font-extrabold">Bisherige Ergebnisse</h2>
            <ul className="space-y-1 text-sm">
              {p.exams.slice(0, 10).map((e) => (
                <li key={e.at} className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                  <span>{new Date(e.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span className="font-bold">{e.pct} % · Note {e.grade} ({e.right}/{e.total})</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  // ── Ergebnis
  if (finished) {
    const pts = answers.reduce((x, y) => x + y.points, 0);
    const max = answers.reduce((x, y) => x + y.max, 0);
    const pct = Math.round((pts / max) * 100);
    const grade = gradeFor(pct);
    const bySec = new Map<Section, { pts: number; max: number }>();
    answers.forEach((a) => {
      const s = bySec.get(a.task.section) ?? { pts: 0, max: 0 };
      s.pts += a.points; s.max += a.max;
      bySec.set(a.task.section, s);
    });
    const secs = [...bySec.entries()].map(([s, v]) => ({ s, ...v, pct: v.pts / v.max })).sort((a, b) => a.pct - b.pct);
    const lines = answers.flatMap((a) => a.lines);
    const wrong = lines.filter((l) => !l.ok);
    return (
      <div className="space-y-5 animate-fadein">
        <Card className="text-center">
          <div className="text-5xl">{pct >= 81 ? '🏆' : pct >= 67 ? '👍' : '📚'}</div>
          <h1 className="mt-2 text-2xl font-black">Klausur-Ergebnis</h1>
          <div className="mt-3 flex flex-wrap justify-center gap-6">
            <div><div className="text-5xl font-black text-indigo-600 dark:text-indigo-400">{pct} %</div><div className="text-sm text-slate-500">Punkte {pts} / {max}</div></div>
            <div><div className="text-5xl font-black">Note {grade}</div><div className="text-sm text-slate-500">(ungefährer Notenschlüssel)</div></div>
          </div>
          <div className="mt-3 flex justify-center gap-4 text-sm font-semibold">
            <span className="text-emerald-600">✓ {lines.length - wrong.length} richtig</span>
            <span className="text-rose-600">✗ {wrong.length} falsch</span>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-extrabold">🎯 Konkrete Empfehlung: Das musst du noch lernen</h2>
          <div className="space-y-2">
            {secs.map((s) => (
              <div key={s.s} className="flex flex-wrap items-center gap-3">
                <span className="w-44 text-sm font-semibold">{s.s}</span>
                <Bar value={s.pct} className="flex-1" color={s.pct >= 0.8 ? 'bg-emerald-500' : s.pct >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'} />
                <span className="w-12 text-right text-sm font-bold">{Math.round(s.pct * 100)} %</span>
                {s.pct < 0.8 && <Btn size="sm" variant="secondary" onClick={() => go(SECTION_ROUTE[s.s] as never)}>Üben</Btn>}
              </div>
            ))}
          </div>
          {secs.filter((s) => s.pct < 0.8).length > 0 ? (
            <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm dark:bg-rose-900/20">Wiederhole zuerst: <b>{secs.filter((s) => s.pct < 0.8).map((s) => s.s).join(', ')}</b>. Danach unter „Meine Fehler“ alle falschen Antworten trainieren – sie sind schon gespeichert.</p>
          ) : (
            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">Alle Bereiche über 80 %! Trainiere zur Sicherheit noch einmal „Meine Fehler“.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn variant="danger" onClick={() => go('fehler')}>🎯 Meine Fehler trainieren</Btn>
            <Btn onClick={() => setTasks(null)}>Neue Klausur</Btn>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-extrabold">📄 Musterlösung</h2>
          <ol className="space-y-2 text-sm">
            {lines.map((l, i) => (
              <li key={i} className={`rounded-xl p-3 ${l.ok ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                <div className="font-semibold">{i + 1}. {l.q}</div>
                <div className="mt-1">{l.ok ? '✓' : '✗'} Deine Antwort: <span className={l.ok ? '' : 'line-through opacity-80'}>{l.given}</span></div>
                {!l.ok && <div>Richtig: <b>{l.expected}</b></div>}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    );
  }

  // ── Aufgabe
  const task = tasks[idx];
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center gap-3">
        <ConfirmBtn variant="ghost" size="sm" label="✕" confirmLabel="Abbrechen?" onConfirm={() => setTasks(null)} />
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500"><span>Aufgabe {idx + 1} von {tasks.length}</span><span>{task.section}</span></div>
          <Bar value={idx / tasks.length} />
        </div>
      </div>
      <div className="mb-2"><Tag color="indigo">{task.typ}</Tag></div>
      {task.kind === 'q' ? (
        <QuestionCard key={idx} item={task.item} mode={task.mode} exam onDone={(r) => onQ(task, r)} />
      ) : (
        <Card className="animate-fadein">
          <h2 className="mb-3 text-xl font-bold">{task.title}</h2>
          <MatchGame key={idx} pairs={task.pairs} exam leftLabel={task.left} rightLabel={task.right} onDone={(res) => onMatch(task, res)} />
        </Card>
      )}
    </div>
  );
}
