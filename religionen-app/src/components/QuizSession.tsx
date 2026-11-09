import { useEffect, useMemo, useRef, useState } from 'react';
import type { Item } from '../types';
import { useStore } from '../lib/store';
import { pickSession } from '../lib/srs';
import QuestionCard, { type QMode, type QResult } from './QuestionCard';
import { Bar, Btn, Card } from './ui';

interface Entry { item: Item; retry: boolean; key: number; mode: QMode }

export interface SessionProps {
  title: string;
  items: Item[];
  count?: number;
  mode?: QMode | 'varied';
  /** true = Reihenfolge nach Wiederholungs-Priorität, false = alle in Zufallsreihenfolge */
  prioritize?: boolean;
  interleave?: boolean;
  planBlock?: string;
  onExit: () => void;
}

let keyCounter = 1;

function chooseMode(item: Item, mode: SessionProps['mode']): QMode {
  if (mode !== 'varied') return (mode ?? 'auto') as QMode;
  const r = Math.random();
  if (item.cloze && r < 0.2) return 'cloze';
  if (item.tf && r > 0.85) return 'tf';
  return 'auto';
}

export default function QuizSession({ title, items, count = 20, mode = 'auto', prioritize = true, interleave = true, planBlock, onExit }: SessionProps) {
  const { p, answer, addStudyTime } = useStore();
  const build = () => {
    const chosen = prioritize ? pickSession(items, p.states, count, interleave) : pickSession(items, {}, Math.min(count, items.length), interleave);
    return chosen.map((item) => ({ item, retry: false, key: keyCounter++, mode: chooseMode(item, mode) }));
  };
  const [queue, setQueue] = useState<Entry[]>(build);
  const [total, setTotal] = useState(queue.length);
  const [done, setDone] = useState(0);
  const [firstRight, setFirstRight] = useState(0);
  const [firstWrong, setFirstWrong] = useState<Map<string, Item>>(new Map());
  const retryOk = useRef(new Map<string, number>());
  const lastAct = useRef(Date.now());

  // Lernzeit messen (nur wenn Tab sichtbar und in den letzten 2 Minuten aktiv)
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastAct.current < 120_000) addStudyTime(5000, planBlock);
    }, 5000);
    const act = () => (lastAct.current = Date.now());
    window.addEventListener('keydown', act);
    window.addEventListener('pointerdown', act);
    return () => { clearInterval(t); window.removeEventListener('keydown', act); window.removeEventListener('pointerdown', act); };
  }, [addStudyTime, planBlock]);

  const cur = queue[0];

  function onDone(r: QResult) {
    const e = cur;
    answer({ itemId: e.item.id, correct: r.correct, given: r.given, expected: r.expected, helped: r.helped, confusedWith: r.confusedWith });
    let rest = queue.slice(1);
    if (!e.retry) {
      if (r.correct) setFirstRight((x) => x + 1);
      else setFirstWrong((m) => new Map(m).set(e.item.id, e.item));
    }
    setDone((d) => d + 1);
    if (!r.correct) {
      // nach drei anderen Fragen erneut abfragen
      const pos = Math.min(3, rest.length);
      rest = [...rest.slice(0, pos), { item: e.item, retry: true, key: keyCounter++, mode: 'auto' }, ...rest.slice(pos)];
      setTotal((t) => t + 1);
    } else if (e.retry) {
      // nach richtiger Wiederholung: später (am Ende der Runde) noch einmal testen
      const n = retryOk.current.get(e.item.id) ?? 0;
      retryOk.current.set(e.item.id, n + 1);
      if (n === 0 && rest.length >= 2) {
        rest = [...rest, { item: e.item, retry: true, key: keyCounter++, mode: 'auto' }];
        setTotal((t) => t + 1);
      }
    }
    setQueue(rest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const wrongList = useMemo(() => [...firstWrong.values()], [firstWrong]);

  function restart(only?: Item[]) {
    const src = only ?? items;
    const chosen = pickSession(src, p.states, only ? only.length : count, interleave);
    const q = chosen.map((item) => ({ item, retry: false, key: keyCounter++, mode: chooseMode(item, mode) }));
    setQueue(q); setTotal(q.length); setDone(0); setFirstRight(0); setFirstWrong(new Map()); retryOk.current.clear();
  }

  if (!items.length) {
    return (
      <Card>
        <p className="font-semibold">Keine Fragen vorhanden.</p>
        <Btn className="mt-3" onClick={onExit}>Zurück</Btn>
      </Card>
    );
  }

  if (!cur) {
    const firstTotal = firstRight + wrongList.length;
    const pct = firstTotal ? Math.round((firstRight / firstTotal) * 100) : 0;
    return (
      <div className="mx-auto max-w-2xl space-y-4 animate-fadein">
        <Card className="text-center">
          <div className="text-5xl">{pct >= 90 ? '🏆' : pct >= 70 ? '💪' : '📚'}</div>
          <h2 className="mt-2 text-2xl font-extrabold">Runde geschafft!</h2>
          <p className="mt-1 text-slate-500">{title}</p>
          <p className="mt-4 text-4xl font-black text-indigo-600 dark:text-indigo-400">{pct} %</p>
          <p className="text-sm text-slate-500">beim ersten Versuch richtig ({firstRight} von {firstTotal})</p>
          <p className="mt-2 text-sm">Alle falschen Fragen wurden wiederholt, bis sie richtig waren. ✅</p>
        </Card>
        {wrongList.length > 0 && (
          <Card>
            <h3 className="mb-2 font-bold">Das solltest du dir nochmal anschauen:</h3>
            <ul className="space-y-1 text-sm">
              {wrongList.map((it) => (
                <li key={it.id} className="flex justify-between gap-3 border-b border-slate-100 py-1 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">{it.prompts[0]}</span>
                  <b className="text-right">{it.answer}</b>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <div className="flex flex-wrap gap-2">
          <Btn size="lg" onClick={() => restart()}>Neue Runde</Btn>
          {wrongList.length > 0 && <Btn size="lg" variant="danger" onClick={() => restart(wrongList)}>Nur diese Fehler nochmal</Btn>}
          <Btn size="lg" variant="secondary" onClick={onExit}>Fertig</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center gap-3">
        <Btn variant="ghost" size="sm" onClick={onExit} aria-label="Beenden">✕</Btn>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
            <span className="truncate">{title}</span>
            <span>{done} / {total} · <span className="text-emerald-600">✓ {firstRight}</span> · <span className="text-rose-600">✗ {wrongList.length}</span></span>
          </div>
          <Bar value={total ? done / total : 0} />
        </div>
      </div>
      <QuestionCard key={cur.key} item={cur.item} mode={cur.mode} retry={cur.retry} onDone={onDone} />
      <p className="mt-3 text-center text-xs text-slate-400">Enter = prüfen / weiter · 1–4 = Antwort wählen</p>
    </div>
  );
}
