import type { Item, ItemState } from '../types';

/** Wiederhol-Abstände je Box (in Minuten) – auf „Klausur morgen“ abgestimmt */
export const INTERVAL_MIN = [0, 1, 8, 30, 120, 480, 1440];
export const MASTERED_BOX = 3;

export const emptyState = (): ItemState => ({ box: 0, due: 0, right: 0, wrong: 0, streak: 0, last: 0 });

export function applyAnswer(s: ItemState | undefined, correct: boolean, helped = false, now = Date.now()): ItemState {
  const st = { ...(s ?? emptyState()) };
  st.last = now;
  if (correct) {
    st.right++;
    st.streak++;
    // mit Hilfe (Tipp) richtig: Box bleibt, kommt bald wieder
    st.box = helped ? Math.max(1, st.box) : Math.min(INTERVAL_MIN.length - 1, st.box + 1);
    st.due = now + INTERVAL_MIN[helped ? 1 : st.box] * 60_000;
  } else {
    st.wrong++;
    st.streak = 0;
    st.box = 1;
    st.due = now + INTERVAL_MIN[1] * 60_000;
  }
  return st;
}

/** 0..1 – wie gut ein Item sitzt */
export const itemScore = (s?: ItemState) => (s ? Math.min(s.box, 4) / 4 : 0);

/** Priorität: kleiner = früher abfragen */
export function priority(s: ItemState | undefined, now = Date.now()): number {
  if (!s || s.box === 0) return 2 + Math.random(); // neu
  const overdue = s.due <= now;
  if (overdue && s.box <= 2) return 0 + Math.random() * 0.5 + (s.box - 1) * 0.2; // schwach & fällig
  if (overdue) return 1 + Math.random();
  // nicht fällig: je früher fällig, desto eher
  return 3 + Math.min(5, (s.due - now) / 3_600_000) + Math.random();
}

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/**
 * Wählt n Items für eine Lernrunde (fällige Fehler zuerst, dann neue, dann Rest)
 * und mischt sie so, dass nie zwei Fragen aus derselben Unterkategorie direkt hintereinander kommen.
 */
export function pickSession(items: Item[], states: Record<string, ItemState>, n: number, interleave = true): Item[] {
  const now = Date.now();
  const sorted = [...items].sort((a, b) => priority(states[a.id], now) - priority(states[b.id], now));
  const chosen = sorted.slice(0, n);
  const mixed = shuffle(chosen);
  return interleave ? interleaveItems(mixed) : mixed;
}

/** verteilt Items so, dass gleiche Themen/Unterthemen nicht aufeinander folgen */
export function interleaveItems(items: Item[]): Item[] {
  const rest = [...items];
  const out: Item[] = [];
  while (rest.length) {
    const prev = out[out.length - 1];
    const prevBase = prev ? baseKey(prev) : '';
    let idx = rest.findIndex((it) => !prev || (it.topic !== prev.topic && baseKey(it) !== prevBase));
    if (idx < 0) idx = rest.findIndex((it) => !prev || (it.sub !== prev.sub && baseKey(it) !== prevBase));
    if (idx < 0) idx = rest.findIndex((it) => !prev || baseKey(it) !== prevBase);
    if (idx < 0) idx = 0;
    out.push(rest.splice(idx, 1)[0]);
  }
  return out;
}

/** gleiche „Sache“ (z. B. dasselbe Land) */
export function baseKey(it: Item): string {
  const m = it.id.match(/^(l-\d+|p-[a-z0-9-]+?)-(hs|land|kont|rel|all|map|mapclick|fl|lf|job|who)$/);
  return m ? m[1] : it.id;
}
