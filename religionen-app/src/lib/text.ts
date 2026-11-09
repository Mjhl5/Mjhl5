const ARTICLES = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'im', 'in', 'am', 'an', 'zur', 'zum', 'bei', 'die']);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** normalisiert + entfernt führende Artikel + Leerzeichen */
export function compact(s: string): string {
  const words = normalize(s).split(' ').filter(Boolean);
  while (words.length > 1 && ARTICLES.has(words[0])) words.shift();
  return words.join('');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
    for (let j = 1; j <= b.length; j++) d[i][j] = i === 0 ? j : 0;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      // Vertauschung zweier Buchstaben zählt als 1 Fehler
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** Wie viele Tippfehler erlaubt sind (abhängig von der Wortlänge) */
export function tolerance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 10) return 2;
  return 3;
}

export interface MatchResult {
  correct: boolean;
  typo: boolean;
  /** falls die Eingabe einer ANDEREN bekannten Antwort entspricht */
  confusedWith?: string;
}

/**
 * Prüft eine Freitext-Antwort.
 * - exakte Übereinstimmung (ohne Groß/klein, Umlaute, Bindestriche, Artikel) = richtig
 * - kleine Tippfehler = richtig (mit Hinweis), solange die Eingabe nicht
 *   besser zu einer anderen bekannten Antwort aus dem Pool passt
 */
export function matchAnswer(input: string, accepted: string[], others: string[] = []): MatchResult {
  const inp = compact(input);
  if (!inp) return { correct: false, typo: false };
  const acc = accepted.map(compact).filter(Boolean);
  const accSet = new Set(acc);
  if (accSet.has(inp)) return { correct: true, typo: false };

  const oth = others.filter((o) => !accSet.has(compact(o)));
  // exakter Treffer einer anderen Antwort -> Verwechslung
  for (const o of oth) {
    if (compact(o) === inp) return { correct: false, typo: false, confusedWith: o };
  }
  let bestAcc = Infinity;
  for (const a of acc) bestAcc = Math.min(bestAcc, levenshtein(inp, a) - tolerance(a.length));
  let bestOther = Infinity;
  let bestOtherName: string | undefined;
  for (const o of oth) {
    const c = compact(o);
    const d = levenshtein(inp, c) - tolerance(c.length);
    if (d < bestOther) {
      bestOther = d;
      bestOtherName = o;
    }
  }
  if (bestAcc <= 0) {
    // auch innerhalb der Toleranz einer anderen Antwort und dort näher? -> falsch
    if (bestOther <= 0 && bestOther < bestAcc) return { correct: false, typo: false, confusedWith: bestOtherName };
    return { correct: true, typo: true };
  }
  if (bestOther <= 0) return { correct: false, typo: false, confusedWith: bestOtherName };
  return { correct: false, typo: false };
}

export interface ListResult {
  correct: boolean;
  found: number[];
  missing: number[];
  needed: number;
}

/** Prüft, ob in einer längeren Antwort die nötigen Stichworte vorkommen */
export function matchList(input: string, groups: string[][], min?: number): ListResult {
  const norm = normalize(input);
  const joined = norm.replace(/ /g, '');
  const tokens = norm.split(' ').filter(Boolean);
  const found: number[] = [];
  const missing: number[] = [];
  groups.forEach((alts, gi) => {
    const hit = alts.some((alt) => {
      const a = normalize(alt);
      const ac = a.replace(/ /g, '');
      if (!ac) return false;
      if (ac.length >= 3 && joined.includes(ac)) return true;
      if (ac.length < 3 && tokens.includes(a)) return true;
      // Einzelwort-Tippfehler
      const altWords = a.split(' ');
      if (altWords.length === 1) {
        return tokens.some((t) => {
          if (t.length < 4) return false;
          if (levenshtein(t, ac) <= tolerance(ac.length)) return true;
          // Wortanfang (z. B. „orthodoxe“ ↔ „orthodox“)
          return ac.length >= 5 && t.startsWith(ac.slice(0, Math.max(5, ac.length - 2)));
        });
      }
      // mehrteilige Begriffe: alle Wörter müssen ungefähr vorkommen
      return altWords.every((w) => w.length < 3 ? tokens.includes(w) : tokens.some((t) => t === w || (w.length > 3 && levenshtein(t, w) <= tolerance(w.length))));
    });
    (hit ? found : missing).push(gi);
  });
  const needed = Math.min(min ?? groups.length, groups.length);
  return { correct: found.length >= needed, found, missing, needed };
}
