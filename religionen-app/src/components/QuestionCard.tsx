import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Item } from '../types';
import { useStore } from '../lib/store';
import { compact, matchAnswer, matchList } from '../lib/text';
import { shuffle } from '../lib/srs';
import { KONTINENTE, LAENDER } from '../data/laender';
import { TOPIC_ICON, TOPIC_LABEL } from '../lib/content';
import WorldMap from './WorldMap';
import { Btn, Tag } from './ui';

export interface QResult {
  correct: boolean;
  given: string;
  expected: string;
  typo?: boolean;
  confusedWith?: string;
  helped?: boolean;
  /** für Listen-Fragen: gefunden/benötigt */
  partial?: string;
  /** angezeigte Frage */
  prompt?: string;
}

export type QMode = 'auto' | 'choice' | 'cloze' | 'tf';

interface Props {
  item: Item;
  mode?: QMode;
  exam?: boolean;
  retry?: boolean;
  onDone: (r: QResult) => void;
}

export function buildOptions(item: Item, pools: Map<string, string[]>): string[] {
  if (item.options) {
    if (item.options === KONTINENTE || item.options.length <= 2) return item.options;
    return shuffle(item.options);
  }
  const pool = pools.get(item.pool ?? '') ?? [];
  const bad = new Set([item.answer, ...(item.accept ?? []), ...(item.exclude ?? [])].map(compact));
  const seen = new Set<string>();
  const distractors = shuffle(pool).filter((v) => {
    const c = compact(v);
    if (bad.has(c) || seen.has(c)) return false;
    seen.add(c);
    return true;
  }).slice(0, 3);
  return shuffle([item.answer, ...distractors]);
}

export default function QuestionCard({ item, mode = 'auto', exam, retry, onDone }: Props) {
  const { content } = useStore();
  const pools = content.pools;
  const prompt = useMemo(() => item.prompts[Math.floor(Math.random() * item.prompts.length)], [item]);
  const effMode: QMode = mode === 'cloze' && !item.cloze ? 'auto' : mode;
  const isChoice = effMode === 'choice' || (effMode === 'auto' && item.kind === 'choice');
  const options = useMemo(() => (isChoice ? buildOptions(item, pools) : []), [item, isChoice, pools]);

  // Richtig/Falsch-Aussage
  const tf = useMemo(() => {
    if (effMode !== 'tf') return null;
    const truth = Math.random() < 0.5;
    if (truth) return { shown: item.answer, truth };
    const others = buildOptions({ ...item, options: undefined }, pools).filter((o) => o !== item.answer);
    if (!others.length) return { shown: item.answer, truth: true };
    return { shown: others[0], truth: false };
  }, [item, effMode, pools]);

  const [value, setValue] = useState('');
  const [parts, setParts] = useState<string[]>(() => (item.parts ?? []).map(() => ''));
  const [result, setResult] = useState<QResult | null>(null);
  const [partRes, setPartRes] = useState<boolean[] | null>(null);
  const [hint, setHint] = useState(0);
  const [copy, setCopy] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const weiterRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [item]);

  const accepted = [item.answer, ...(item.accept ?? [])];
  const others = pools.get(item.pool ?? '') ?? [];

  function finish(r0: QResult) {
    const shownPrompt = effMode === 'cloze' && item.cloze ? item.cloze : effMode === 'tf' && tf ? `${prompt} → ${tf.shown} (richtig oder falsch?)` : prompt;
    const r = { ...r0, prompt: shownPrompt };
    if (exam) return onDone(r);
    setResult(r);
    setTimeout(() => weiterRef.current?.focus(), 40);
  }

  function submitText(e?: FormEvent) {
    e?.preventDefault();
    if (result) return;
    const given = value.trim();
    if (item.kind === 'list' && effMode !== 'cloze') {
      const r = matchList(given, item.groups ?? [], item.min);
      return finish({ correct: r.correct, given, expected: item.answer, helped: hint > 0, partial: `${r.found.length} von ${r.needed} Punkten genannt` });
    }
    // Lückentext bei Listen-Items: Stichwort-Prüfung
    if (item.kind === 'list') {
      const r = matchList(given, item.groups ?? [], item.min);
      const ok = r.correct || matchAnswer(given, accepted, []).correct;
      return finish({ correct: ok, given, expected: item.answer, helped: hint > 0 });
    }
    const m = matchAnswer(given, accepted, others);
    // Verwechslung nur melden, wenn es eine echte Lern-Antwort ist (z. B. eine der 20 Hauptstädte)
    const core = content.corePools.get(item.pool ?? '');
    const confusedWith = m.confusedWith && core?.has(m.confusedWith) ? m.confusedWith : undefined;
    finish({ correct: m.correct, given, expected: item.answer, typo: m.typo, confusedWith, helped: hint > 0 });
  }

  function submitChoice(opt: string) {
    if (result) return;
    setPicked(opt);
    const ok = accepted.map(compact).includes(compact(opt));
    finish({ correct: ok, given: opt, expected: item.answer, confusedWith: ok ? undefined : opt });
  }

  function submitTF(saysTrue: boolean) {
    if (result || !tf) return;
    const ok = saysTrue === tf.truth;
    finish({ correct: ok, given: saysTrue ? 'Richtig' : 'Falsch', expected: `${tf.truth ? 'Richtig' : 'Falsch'} – korrekt ist: ${item.answer}` });
  }

  function submitMulti(e?: FormEvent) {
    e?.preventDefault();
    if (result || !item.parts) return;
    const res = item.parts.map((p, i) => {
      const acc = [p.answer, ...(p.accept ?? [])];
      if (p.options) return acc.map(compact).includes(compact(parts[i]));
      return matchAnswer(parts[i], acc, pools.get(p.pool ?? '') ?? []).correct;
    });
    setPartRes(res);
    finish({ correct: res.every(Boolean), given: parts.join(' · '), expected: item.answer, helped: hint > 0, partial: `${res.filter(Boolean).length} von ${res.length} richtig` });
  }

  function submitMapClick(nr: number) {
    if (result) return;
    const L = LAENDER.find((l) => l.nr === nr);
    const ok = nr === item.mapNo;
    setPicked(String(nr));
    finish({ correct: ok, given: `Nr. ${nr}${L ? ` (${L.land})` : ''}`, expected: `Nr. ${item.mapNo}`, confusedWith: ok ? undefined : L?.land });
  }

  function giveUp() {
    if (result) return;
    finish({ correct: false, given: '(nicht gewusst)', expected: item.answer });
  }

  // Tastatur: Zahlen für Auswahl, Enter für „Weiter“
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (result && !exam && e.key === 'Enter' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        onDone(result);
        return;
      }
      if (!result && isChoice && /^[1-9]$/.test(e.key) && tag !== 'INPUT') {
        const o = options[Number(e.key) - 1];
        if (o) submitChoice(o);
      }
      if (!result && effMode === 'tf' && tag !== 'INPUT') {
        if (e.key === 'r' || e.key === 'ArrowLeft') submitTF(true);
        if (e.key === 'f' || e.key === 'ArrowRight') submitTF(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const hintText = hint > 0 ? item.answer.slice(0, Math.min(item.answer.length, hint * 2)) + (hint * 2 < item.answer.length ? '…' : '') : '';
  const copyOk = result && !result.correct && copy && matchAnswer(copy, accepted, []).correct;

  const cardAnim = result ? (result.correct ? 'animate-pop ring-2 ring-emerald-400' : 'animate-shake ring-2 ring-rose-400') : '';

  const inputCls = 'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-lg outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950';
  const isText = !isChoice && effMode !== 'tf' && item.kind !== 'multi' && item.kind !== 'mapclick';

  return (
    <div className={`animate-fadein rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:p-7 ${cardAnim}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tag color="indigo">{TOPIC_ICON[item.topic]} {TOPIC_LABEL[item.topic]}</Tag>
        <Tag>{item.sub}</Tag>
        {retry && <Tag color="amber">🔁 Wiederholung</Tag>}
      </div>

      {(item.kind === 'map' || item.kind === 'mapclick') && effMode !== 'tf' && (
        <div className="mb-4">
          <WorldMap
            highlight={item.kind === 'map' ? item.mapNo : result ? item.mapNo : undefined}
            onPick={item.kind === 'mapclick' ? submitMapClick : undefined}
            disabled={!!result}
            status={item.kind === 'mapclick' && picked && result && !result.correct ? { [Number(picked)]: 'bad' } : undefined}
          />
        </div>
      )}

      {effMode === 'cloze' && item.cloze ? (
        <h2 className="text-xl font-bold leading-snug sm:text-2xl">
          <span className="mb-1 block text-sm font-semibold text-slate-500">Lückentext – fülle die Lücke:</span>
          {item.cloze.split('___').map((s, i, arr) => (
            <span key={i}>{s}{i < arr.length - 1 && <span className="mx-1 inline-block min-w-[4rem] border-b-2 border-indigo-500 text-indigo-500">{result ? item.answer : ' ? '}</span>}</span>
          ))}
        </h2>
      ) : effMode === 'tf' && tf ? (
        <div>
          <span className="mb-1 block text-sm font-semibold text-slate-500">Richtig oder falsch?</span>
          <h2 className="text-xl font-bold leading-snug sm:text-2xl">{prompt.replace(/ Tippe auf die richtige Nummer\.$/, '')}</h2>
          <p className="mt-2 text-xl">→ <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{item.kind === 'mapclick' ? `Nr. ${tf.shown}` : tf.shown}</span></p>
        </div>
      ) : (
        <h2 className="text-xl font-bold leading-snug sm:text-2xl">{prompt}</h2>
      )}

      {item.uncertain && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">{item.uncertain}</p>}

      <div className="mt-5">
        {/* Freitext */}
        {isText && (
          <form onSubmit={submitText} className="space-y-3">
            {item.kind === 'list' && effMode !== 'cloze' ? (
              <textarea
                ref={(el) => (inputRef.current = el)}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={!!result}
                rows={3}
                placeholder="Antwort mit Stichworten eingeben (Komma oder Zeile trennt) …"
                className={inputCls}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitText(); } }}
              />
            ) : (
              <input
                ref={(el) => (inputRef.current = el)}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={!!result}
                placeholder="Antwort eintippen …"
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                className={inputCls}
              />
            )}
            {hint > 0 && !result && <p className="text-sm text-amber-600">💡 Tipp: <b>{hintText}</b></p>}
            {!result && (
              <div className="flex flex-wrap gap-2">
                <Btn type="submit" size="lg">Prüfen ⏎</Btn>
                {!exam && <Btn type="button" variant="secondary" onClick={() => setHint((h) => h + 1)}>💡 Tipp</Btn>}
                {!exam && <Btn type="button" variant="ghost" onClick={giveUp}>Weiß ich nicht</Btn>}
              </div>
            )}
          </form>
        )}

        {/* Auswahl */}
        {isChoice && (
          <div className={`grid gap-2 ${options.length > 4 ? 'grid-cols-2 sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
            {options.map((o, i) => {
              const isAns = accepted.map(compact).includes(compact(o));
              let cls = 'border-slate-200 hover:border-indigo-400 dark:border-slate-700';
              if (result && isAns) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30';
              else if (result && picked === o) cls = 'border-rose-500 bg-rose-50 dark:bg-rose-900/30';
              return (
                <button key={o} disabled={!!result} onClick={() => submitChoice(o)}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left font-semibold transition ${cls}`}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-500 dark:bg-slate-800">{i + 1}</span>{o}
                </button>
              );
            })}
          </div>
        )}

        {/* Richtig / Falsch */}
        {effMode === 'tf' && (
          <div className="grid grid-cols-2 gap-3">
            <Btn size="lg" variant="success" disabled={!!result} onClick={() => submitTF(true)}>✓ Richtig</Btn>
            <Btn size="lg" variant="danger" disabled={!!result} onClick={() => submitTF(false)}>✗ Falsch</Btn>
          </div>
        )}

        {/* Mehrere Felder */}
        {item.kind === 'multi' && effMode !== 'tf' && !isChoice && (
          <form onSubmit={submitMulti} className="space-y-3">
            {item.parts!.map((p, i) => (
              <label key={p.label} className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-500">{p.label}</span>
                {p.options ? (
                  <select value={parts[i]} disabled={!!result} onChange={(e) => setParts((a) => a.map((x, j) => (j === i ? e.target.value : x)))} className={inputCls}>
                    <option value="">– wählen –</option>
                    {p.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input ref={i === 0 ? (el) => (inputRef.current = el) : undefined} value={parts[i]} disabled={!!result}
                    onChange={(e) => setParts((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
                    autoComplete="off" spellCheck={false} className={inputCls} />
                )}
                {partRes && (
                  <span className={`mt-1 block text-sm font-semibold ${partRes[i] ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {partRes[i] ? '✓ richtig' : `✗ richtig wäre: ${p.answer}`}
                  </span>
                )}
              </label>
            ))}
            {!result && (
              <div className="flex flex-wrap gap-2">
                <Btn type="submit" size="lg">Prüfen ⏎</Btn>
                {!exam && <Btn type="button" variant="ghost" onClick={giveUp}>Weiß ich nicht</Btn>}
              </div>
            )}
          </form>
        )}

        {item.kind === 'mapclick' && !result && effMode !== 'tf' && !exam && (
          <Btn variant="ghost" onClick={giveUp}>Weiß ich nicht</Btn>
        )}
      </div>

      {/* Rückmeldung */}
      {result && !exam && (
        <div className="mt-5 space-y-3">
          {result.correct ? (
            <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-900/30">
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">✓ Richtig!{result.helped ? ' (mit Tipp – kommt bald nochmal)' : ''}</p>
              {result.typo && <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">Kleiner Tippfehler – richtig geschrieben: <b>{item.answer}</b></p>}
              {(item.kind === 'list' || item.kind === 'multi') && <p className="mt-1 text-sm">Vollständig: <b>{item.answer}</b></p>}
              {result.partial && <p className="text-xs text-slate-500">{result.partial}</p>}
            </div>
          ) : (
            <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-900/30">
              <p className="text-lg font-extrabold text-rose-700 dark:text-rose-300">✗ Leider falsch</p>
              {result.given && <p className="mt-1 text-sm">Deine Antwort: <span className="line-through opacity-80">{result.given || '–'}</span></p>}
              <p className="mt-1 text-base">Richtig: <b className="text-emerald-700 dark:text-emerald-300">{effMode === 'tf' ? result.expected : item.answer}</b></p>
              {result.partial && <p className="text-xs text-slate-500">{result.partial}</p>}
              {result.confusedWith && <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">⚠️ Verwechslung: Du hast <b>{result.confusedWith}</b> genannt – gemeint war <b>{item.answer}</b>.</p>}
              <p className="mt-2 text-xs text-slate-500">🔁 Diese Frage kommt nach 3 anderen Fragen wieder.</p>
            </div>
          )}
          {item.explain && <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">ℹ️ {item.explain}</p>}
          {item.mnemonic && (!result.correct || result.helped) && (
            <p className="whitespace-pre-line rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">💡 <b>Eselsbrücke:</b> {item.mnemonic}</p>
          )}
          {!result.correct && isText && item.kind !== 'list' && (
            <div className="rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700">
              <p className="mb-1 text-xs font-semibold text-slate-500">Zum Einprägen: Schreib die richtige Antwort einmal ab (freiwillig)</p>
              <input value={copy} onChange={(e) => setCopy(e.target.value)} autoComplete="off" spellCheck={false}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onDone(result); } }}
                className={`${inputCls} py-2 text-base ${copyOk ? 'border-emerald-500' : ''}`} placeholder={item.answer} />
              {copyOk && <p className="mt-1 text-xs font-semibold text-emerald-600">✓ Gut gemacht!</p>}
            </div>
          )}
          <Btn ref={weiterRef} size="lg" className="w-full" onClick={() => onDone(result)}>Weiter ⏎</Btn>
        </div>
      )}
    </div>
  );
}
