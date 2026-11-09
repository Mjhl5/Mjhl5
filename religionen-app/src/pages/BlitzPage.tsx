import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { pickSession } from '../lib/srs';
import { TOPIC_ICON, TOPIC_LABEL } from '../lib/content';
import { weakItems } from '../lib/stats';
import { Bar, Btn, Card, PageTitle, Tag } from '../components/ui';
import type { Item, Topic } from '../types';

const DUR = [3, 5, 10];

export default function BlitzPage() {
  const { p, content, answer, addStudyTime } = useStore();
  const [topic, setTopic] = useState<Topic | 'alle' | 'fehler'>('alle');
  const [min, setMin] = useState(5);
  const [deck, setDeck] = useState<Item[] | null>(null);
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const [left, setLeft] = useState(0);
  const [score, setScore] = useState({ ok: 0, bad: 0 });
  const [prompt, setPrompt] = useState('');
  const endAt = useRef(0);

  const pool = (): Item[] => {
    const base = content.items.filter((x) => x.kind !== 'mapclick' && x.kind !== 'multi');
    if (topic === 'fehler') return weakItems(base, p.states);
    return topic === 'alle' ? base : base.filter((x) => x.topic === topic);
  };

  function start() {
    const its = pool();
    if (!its.length) return;
    const d = pickSession(its, p.states, 400);
    setDeck(d); setI(0); setShow(false); setScore({ ok: 0, bad: 0 });
    endAt.current = Date.now() + min * 60_000;
    setLeft(min * 60);
    setPrompt(d[0].prompts[Math.floor(Math.random() * d[0].prompts.length)]);
  }

  useEffect(() => {
    if (!deck) return;
    const t = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (document.visibilityState === 'visible') addStudyTime(1000);
    }, 1000);
    return () => clearInterval(t);
  }, [deck, addStudyTime]);

  const cur = deck?.[i];
  const over = deck && (left <= 0 || i >= deck.length);

  function rate(ok: boolean) {
    if (!cur || !deck) return;
    answer({ itemId: cur.id, correct: ok, given: ok ? '(gewusst)' : '(nicht gewusst – Blitz)', expected: cur.answer });
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), bad: s.bad + (ok ? 0 : 1) }));
    let d = deck;
    if (!ok) d = [...deck.slice(0, i + 4), cur, ...deck.slice(i + 4)]; // nach 3 Karten wieder
    setDeck(d);
    const n = d[i + 1];
    setI(i + 1); setShow(false);
    if (n) setPrompt(n.prompts[Math.floor(Math.random() * n.prompts.length)]);
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!deck || over) return;
      if (!show && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); setShow(true); }
      else if (show && (e.key === 'j' || e.key === 'ArrowRight' || e.key === '1')) rate(true);
      else if (show && (e.key === 'n' || e.key === 'ArrowLeft' || e.key === '2')) rate(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  if (!deck) {
    const opts: (Topic | 'alle' | 'fehler')[] = ['alle', 'fehler', 'laender', 'judentum', 'christentum', 'islam', 'vergleich', 'evangelien', 'namen'];
    return (
      <div className="space-y-5 animate-fadein">
        <PageTitle icon="⚡" title="Blitzlernen" sub="Kurze Frage – Antwort im Kopf denken – aufdecken – ehrlich bewerten. Ideal für die letzten Minuten vor der Klausur." />
        <Card>
          <h2 className="mb-2 font-extrabold">Thema</h2>
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => (
              <button key={o} onClick={() => setTopic(o)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${topic === o ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {o === 'alle' ? '🔀 Alles' : o === 'fehler' ? '🎯 Nur Fehler' : `${TOPIC_ICON[o]} ${TOPIC_LABEL[o]}`}
              </button>
            ))}
          </div>
          <h2 className="mb-2 mt-4 font-extrabold">Dauer</h2>
          <div className="flex gap-2">
            {DUR.map((d) => <button key={d} onClick={() => setMin(d)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${min === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{d} min</button>)}
          </div>
          <Btn size="lg" className="mt-5" onClick={start} disabled={!pool().length}>⚡ Los geht’s ({pool().length} Karten)</Btn>
          {!pool().length && <p className="mt-2 text-sm text-slate-500">Keine Karten in dieser Auswahl.</p>}
        </Card>
      </div>
    );
  }

  if (over || !cur) {
    const tot = score.ok + score.bad;
    return (
      <Card className="mx-auto max-w-xl text-center animate-fadein">
        <div className="text-5xl">⚡</div>
        <h2 className="mt-2 text-2xl font-black">Zeit um!</h2>
        <p className="mt-2 text-lg">{tot} Karten · <span className="text-emerald-600">✓ {score.ok}</span> · <span className="text-rose-600">✗ {score.bad}</span></p>
        <p className="text-sm text-slate-500">Alles, was du nicht wusstest, steht jetzt in „Meine Fehler“.</p>
        <div className="mt-4 flex justify-center gap-2"><Btn onClick={start}>Nochmal</Btn><Btn variant="secondary" onClick={() => setDeck(null)}>Zurück</Btn></div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex items-center gap-3">
        <Btn variant="ghost" size="sm" onClick={() => setDeck(null)}>✕</Btn>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
            <span>⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>
            <span className="text-emerald-600">✓ {score.ok}</span><span className="text-rose-600">✗ {score.bad}</span>
          </div>
          <Bar value={left / (min * 60)} color="bg-amber-500" />
        </div>
      </div>
      <div key={i} className="animate-fadein rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <Tag color="indigo">{TOPIC_ICON[cur.topic]} {TOPIC_LABEL[cur.topic]}</Tag>
        <h2 className="mt-3 text-2xl font-bold">{cur.kind === 'map' ? `Karte Nr. ${cur.mapNo}: Welches Land?` : prompt}</h2>
        {show ? (
          <>
            <p className="mt-5 text-2xl font-black text-indigo-600 dark:text-indigo-400 animate-pop">{cur.answer}</p>
            {cur.mnemonic && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">💡 {cur.mnemonic.split('\n')[0]}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Btn size="lg" variant="danger" onClick={() => rate(false)}>✗ Nicht gewusst</Btn>
              <Btn size="lg" variant="success" onClick={() => rate(true)}>✓ Gewusst</Btn>
            </div>
            <p className="mt-2 text-xs text-slate-400">← nicht gewusst · → gewusst</p>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm text-slate-500">Antwort im Kopf (oder laut) sagen …</p>
            <Btn size="lg" className="mt-4 w-full" onClick={() => setShow(true)}>Aufdecken (Leertaste)</Btn>
          </>
        )}
      </div>
    </div>
  );
}
