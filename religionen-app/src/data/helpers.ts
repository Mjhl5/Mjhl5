import type { Item, Topic } from '../types';

type Extra = Partial<Omit<Item, 'id' | 'topic' | 'sub' | 'prompts' | 'answer'>>;
const arr = (p: string | string[]) => (Array.isArray(p) ? p : [p]);

/** Freitext-Frage */
export const q = (id: string, topic: Topic, sub: string, prompts: string | string[], answer: string, extra: Extra = {}): Item => ({
  id, topic, sub, kind: 'input', prompts: arr(prompts), answer, tf: true, ...extra,
});

/** Stichwort-/Aufzählungsfrage: groups = Pflichtbestandteile */
export const l = (id: string, topic: Topic, sub: string, prompts: string | string[], answer: string, groups: string[][], extra: Extra = {}): Item => ({
  id, topic, sub, kind: 'list', prompts: arr(prompts), answer, groups, ...extra,
});

/** Auswahlfrage */
export const c = (id: string, topic: Topic, sub: string, prompts: string | string[], answer: string, options: string[], extra: Extra = {}): Item => ({
  id, topic, sub, kind: 'choice', prompts: arr(prompts), answer, options, ...extra,
});
