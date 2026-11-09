import type { Item, ItemState } from '../types';
import { aggregate, weakItems } from './stats';

export interface PlanBlock {
  id: string;
  from: number;
  to: number;
  title: string;
  desc: string;
  icon: string;
  kind: 'quiz' | 'exam' | 'errors';
  filter: (it: Item) => boolean;
}

export const PLAN: PlanBlock[] = [
  { id: 'laender', from: 0, to: 20, title: 'Alle Länder und Hauptstädte', desc: 'Hauptstadt, Kontinent, Religion und Karte', icon: '🌍', kind: 'quiz', filter: (i) => i.topic === 'laender' },
  { id: 'steckbriefe', from: 20, to: 45, title: 'Steckbriefe der drei Religionen', desc: 'Judentum, Christentum und Islam', icon: '📋', kind: 'quiz', filter: (i) => ['judentum', 'christentum', 'islam'].includes(i.topic) },
  { id: 'vergleich', from: 45, to: 60, title: 'Vergleich der drei Religionen', desc: 'Gott, Symbol, Schrift, Stadt, Gotteshaus, Fest', icon: '⚖️', kind: 'quiz', filter: (i) => i.topic === 'vergleich' },
  { id: 'evangelien', from: 60, to: 75, title: 'Evangelien und Symbole', desc: 'Mt–Mk–Lk–Jh = Engel–Löwe–Stier–Adler', icon: '📖', kind: 'quiz', filter: (i) => i.topic === 'evangelien' },
  { id: 'namen', from: 75, to: 95, title: 'Persönlichkeiten und Berufe', desc: 'Vor- und Nachnamen, Berufe', icon: '👤', kind: 'quiz', filter: (i) => i.topic === 'namen' },
  { id: 'pruefung', from: 95, to: 110, title: 'Gemischte Prüfung', desc: 'Klausur-Simulation mit allen Themen', icon: '📝', kind: 'exam', filter: () => true },
  { id: 'fehler', from: 110, to: 120, title: 'Nur noch meine Fehler', desc: 'Alles, was noch nicht sitzt', icon: '🎯', kind: 'errors', filter: () => true },
];

export interface PlanBlockStatus { block: PlanBlock; mastery: number; errRate: number; spentMin: number; done: boolean; weak: boolean }

export function planStatus(items: Item[], states: Record<string, ItemState>, spent: Record<string, number>, doneMap: Record<string, boolean>): PlanBlockStatus[] {
  return PLAN.map((b) => {
    const its = items.filter(b.filter);
    const a = aggregate(its, states);
    const weak = b.kind === 'quiz' ? weakItems(its, states).length : 0;
    const errRate = its.length ? weak / its.length : 0;
    return { block: b, mastery: a.score, errRate, spentMin: (spent[b.id] ?? 0) / 60000, done: !!doneMap[b.id], weak: errRate >= 0.1 };
  });
}

/** Reihenfolge an Schwächen anpassen: schwache Themen (Block 1–5) nach vorne, Prüfung + Fehler bleiben am Ende */
export function orderedPlan(st: PlanBlockStatus[]): PlanBlockStatus[] {
  const core = st.filter((s) => s.block.kind === 'quiz');
  const tail = st.filter((s) => s.block.kind !== 'quiz');
  const open = core.filter((s) => !s.done);
  const done = core.filter((s) => s.done);
  const sorted = [...open].sort((a, b) => {
    // nur umsortieren, wenn deutlich schwächer (gesehen + Fehlerquote)
    if (a.weak !== b.weak) return a.weak ? -1 : 1;
    if (a.weak && b.weak) return b.errRate - a.errRate;
    return a.block.from - b.block.from;
  });
  return [...sorted, ...done, ...tail];
}

export function nextBlock(st: PlanBlockStatus[]): PlanBlockStatus | undefined {
  return orderedPlan(st).find((s) => !s.done);
}
