import { useMemo, useState } from 'react';
import { shuffle } from '../lib/srs';
import { Btn } from './ui';

export interface MatchPair { left: string; right: string; itemId?: string }

interface Props {
  pairs: MatchPair[];
  leftLabel?: string;
  rightLabel?: string;
  exam?: boolean;
  onDone: (res: { pair: MatchPair; given: string; correct: boolean }[]) => void;
}

/** Zuordnungs-Aufgabe: links antippen, dann rechts antippen (oder Auswahlliste) */
export default function MatchGame({ pairs, leftLabel = 'Begriff', rightLabel = 'Zuordnung', exam, onDone }: Props) {
  const rights = useMemo(() => shuffle([...new Set(pairs.map((p) => p.right))]), [pairs]);
  const lefts = useMemo(() => shuffle(pairs), [pairs]);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const assign = (left: string, right: string) => {
    if (checked) return;
    setSel((s) => ({ ...s, [left]: right }));
    setActive(null);
  };

  function check() {
    const res = pairs.map((p) => ({ pair: p, given: sel[p.left] ?? '', correct: sel[p.left] === p.right }));
    if (exam) return onDone(res);
    setChecked(true);
  }

  const allSet = pairs.every((p) => sel[p.left]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Tippe links einen {leftLabel} an und dann rechts die passende {rightLabel}. Oder wähle aus der Liste.</p>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          {lefts.map((p) => {
            const g = sel[p.left];
            const ok = checked && g === p.right;
            const bad = checked && g !== p.right;
            return (
              <div key={p.left} className={`rounded-xl border-2 p-2 transition ${active === p.left ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : ok ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : bad ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 animate-shake' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => !checked && setActive(active === p.left ? null : p.left)} className="min-w-[8rem] flex-1 text-left font-bold">{p.left}</button>
                  <span className="text-slate-400">→</span>
                  <select value={g ?? ''} disabled={checked} onChange={(e) => assign(p.left, e.target.value)}
                    className="min-w-[9rem] flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-600 dark:bg-slate-950">
                    <option value="">– wählen –</option>
                    {rights.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {bad && <p className="mt-1 text-sm font-semibold text-rose-600">richtig: {p.right}</p>}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap content-start gap-2 sm:w-48 sm:flex-col">
          {rights.map((r) => {
            const used = Object.values(sel).includes(r);
            return (
              <button key={r} disabled={!active || checked} onClick={() => active && assign(active, r)}
                className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition ${active ? 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-700'} ${used ? 'opacity-50' : ''}`}>
                {r}
              </button>
            );
          })}
        </div>
      </div>
      {!checked ? (
        <Btn size="lg" disabled={!allSet && !exam} onClick={check}>{exam ? 'Antwort speichern' : 'Prüfen'}</Btn>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-bold">{pairs.filter((p) => sel[p.left] === p.right).length} von {pairs.length} richtig</p>
          <Btn size="lg" onClick={() => onDone(pairs.map((p) => ({ pair: p, given: sel[p.left] ?? '', correct: sel[p.left] === p.right })))}>Weiter</Btn>
        </div>
      )}
    </div>
  );
}
