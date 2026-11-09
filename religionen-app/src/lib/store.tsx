import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CustomCard, ItemState, MistakeEntry, Person } from '../types';
import { PERSONEN_STANDARD } from '../data/personen';
import { applyAnswer } from './srs';
import { buildContent, type Content } from './content';

const KEY = 'rk-progress-v1';

export interface ExamResult { at: number; pct: number; grade: string; total: number; right: number }

export interface Progress {
  v: 1;
  states: Record<string, ItemState>;
  mistakes: MistakeEntry[];
  studyMs: number;
  answered: number;
  correctTotal: number;
  wrongTotal: number;
  planSpent: Record<string, number>;
  planDone: Record<string, boolean>;
  exams: ExamResult[];
  persons: Person[] | null;
  cards: CustomCard[];
  created: number;
}

const initial = (): Progress => ({
  v: 1, states: {}, mistakes: [], studyMs: 0, answered: 0, correctTotal: 0, wrongTotal: 0,
  planSpent: {}, planDone: {}, exams: [], persons: null, cards: [], created: Date.now(),
});

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const p = JSON.parse(raw);
    if (!p || p.v !== 1) return initial();
    return { ...initial(), ...p };
  } catch {
    return initial();
  }
}

export interface AnswerInfo {
  itemId: string;
  correct: boolean;
  given: string;
  expected: string;
  helped?: boolean;
  confusedWith?: string;
}

interface Store {
  p: Progress;
  content: Content;
  persons: Person[];
  answer: (a: AnswerInfo) => void;
  addStudyTime: (ms: number, planBlock?: string) => void;
  update: (fn: (p: Progress) => Progress) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Progress>(load);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* Speicher voll/gesperrt */ }
    }, 150);
  }, [p]);
  // beim Schließen sofort speichern
  useEffect(() => {
    const h = () => { try { localStorage.setItem(KEY, JSON.stringify(pRef.current)); } catch { /* */ } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);
  const pRef = useRef(p);
  pRef.current = p;

  const persons = p.persons ?? PERSONEN_STANDARD;
  const content = useMemo(() => buildContent(persons, p.cards), [persons, p.cards]);

  const answer = useCallback((a: AnswerInfo) => {
    setP((prev) => {
      const states = { ...prev.states, [a.itemId]: applyAnswer(prev.states[a.itemId], a.correct, a.helped) };
      const mistakes = a.correct ? prev.mistakes
        : [{ id: a.itemId, given: a.given, expected: a.expected, at: Date.now(), confusedWith: a.confusedWith }, ...prev.mistakes].slice(0, 800);
      return { ...prev, states, mistakes, answered: prev.answered + 1,
        correctTotal: prev.correctTotal + (a.correct ? 1 : 0), wrongTotal: prev.wrongTotal + (a.correct ? 0 : 1) };
    });
  }, []);

  const addStudyTime = useCallback((ms: number, planBlock?: string) => {
    setP((prev) => ({ ...prev, studyMs: prev.studyMs + ms,
      planSpent: planBlock ? { ...prev.planSpent, [planBlock]: (prev.planSpent[planBlock] ?? 0) + ms } : prev.planSpent }));
  }, []);

  const update = useCallback((fn: (p: Progress) => Progress) => setP(fn), []);
  const reset = useCallback(() => setP(initial()), []);

  const value = useMemo(() => ({ p, content, persons, answer, addStudyTime, update, reset }), [p, content, persons, answer, addStudyTime, update, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider fehlt');
  return s;
}

export function exportProgress(p: Progress): string {
  return JSON.stringify(p, null, 1);
}
export function parseProgress(raw: string): Progress | null {
  try {
    const x = JSON.parse(raw);
    if (x && x.v === 1 && typeof x.states === 'object') return { ...initial(), ...x };
  } catch { /* */ }
  return null;
}
