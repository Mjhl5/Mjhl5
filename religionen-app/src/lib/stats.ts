import type { Item, ItemState, MistakeEntry, Topic } from '../types';
import { MASTERED_BOX, itemScore } from './srs';

export interface Agg { total: number; mastered: number; seen: number; wrong: number; right: number; score: number }

export function aggregate(items: Item[], states: Record<string, ItemState>): Agg {
  let mastered = 0, seen = 0, wrong = 0, right = 0, score = 0;
  for (const it of items) {
    const s = states[it.id];
    score += itemScore(s);
    if (s && s.box > 0) seen++;
    if (s && s.box >= MASTERED_BOX) mastered++;
    wrong += s?.wrong ?? 0;
    right += s?.right ?? 0;
  }
  return { total: items.length, mastered, seen, wrong, right, score: items.length ? score / items.length : 0 };
}

export interface Weakness { key: string; topic: Topic; sub: string; wrong: number; weakItems: number; ratio: number }

/** Unterkategorien mit den meisten noch nicht sicheren Fehlern */
export function weaknesses(items: Item[], states: Record<string, ItemState>): Weakness[] {
  const m = new Map<string, Weakness>();
  for (const it of items) {
    const s = states[it.id];
    if (!s || s.wrong === 0) continue;
    const key = `${it.topic}|${it.sub}`;
    const w = m.get(key) ?? { key, topic: it.topic, sub: it.sub, wrong: 0, weakItems: 0, ratio: 0 };
    w.wrong += s.wrong;
    if (s.box < MASTERED_BOX) w.weakItems++;
    m.set(key, w);
  }
  const arr = [...m.values()].filter((w) => w.weakItems > 0);
  arr.forEach((w) => (w.ratio = w.weakItems));
  return arr.sort((a, b) => b.weakItems - a.weakItems || b.wrong - a.wrong);
}

/** Items, die zur Fehlerliste gehören (mind. 1 Fehler und noch nicht sicher bzw. letzte Antwort falsch) */
export function weakItems(items: Item[], states: Record<string, ItemState>): Item[] {
  return items.filter((it) => {
    const s = states[it.id];
    return s && s.wrong > 0 && (s.box < MASTERED_BOX + 1 || s.streak < 2);
  });
}

export function confusions(mistakes: MistakeEntry[], byId: Map<string, Item>) {
  const m = new Map<string, { a: string; b: string; n: number; sub: string }>();
  for (const x of mistakes) {
    if (!x.confusedWith) continue;
    const it = byId.get(x.id);
    const k = `${x.expected}⇄${x.confusedWith}`;
    const e = m.get(k) ?? { a: x.expected, b: x.confusedWith, n: 0, sub: it?.sub ?? '' };
    e.n++;
    m.set(k, e);
  }
  return [...m.values()].sort((a, b) => b.n - a.n);
}

export function fmtTime(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}
