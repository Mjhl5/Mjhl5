import type { Item } from '../types';

export const REL3 = ['Judentum', 'Christentum', 'Islam'] as const;
export type Rel3 = (typeof REL3)[number];

export interface VergleichRow {
  key: string;
  kategorie: string;
  pool: string;
  werte: Record<Rel3, string>;
  /** zusätzliche akzeptierte Antworten */
  accept?: Partial<Record<Rel3, string[]>>;
  /** Mit Artikel im Akkusativ für Rückfragen, z. B. „den Davidstern“ */
  akk?: Partial<Record<Rel3, string>>;
  fwd: string[]; // {R} = Religion, {A} = Anhänger
  rev?: string[]; // {X} = Wert (mit Artikel), Antwort = Religion
  noRev?: Rel3[];
  merk?: string;
}

export const ANHAENGER: Record<Rel3, string> = { Judentum: 'Juden', Christentum: 'Christen', Islam: 'Muslime' };

export const VERGLEICH: VergleichRow[] = [
  { key: 'gott', kategorie: 'Name Gottes', pool: 'gott',
    werte: { Judentum: 'Jahwe', Christentum: 'Gott', Islam: 'Allah' },
    accept: { Christentum: ['Jesus Christus', 'Gott / Jesus Christus'] },
    fwd: ['Wie heißt Gott im {R}?', 'Welchen Namen hat Gott bei den {A}?', 'Zu wem beten die {A}?'],
    rev: ['In welcher Religion heißt Gott „{X}“?', 'Welche Religion nennt Gott „{X}“?'],
    merk: 'J-J: Judentum–Jahwe. A-A: Allah im Islam (Arabisch). Christen sagen einfach „Gott“.' },
  { key: 'anh', kategorie: 'Anhänger', pool: 'anhaenger',
    werte: { Judentum: 'Juden', Christentum: 'Christen', Islam: 'Muslime' },
    accept: { Islam: ['Moslems', 'Muslim'] },
    fwd: ['Wie heißen die Anhänger des {R}?', 'Wie nennt man die Gläubigen im {R}?'],
    rev: ['Zu welcher Religion gehören die {X}?', 'Welche Religion haben die {X}?'] },
  { key: 'symbol', kategorie: 'Symbol', pool: 'symbol',
    werte: { Judentum: 'Davidstern', Christentum: 'Kreuz', Islam: 'Halbmond' },
    akk: { Judentum: 'den Davidstern', Christentum: 'das Kreuz', Islam: 'den Halbmond' },
    fwd: ['Was ist das Symbol des {R}?', 'Welches Zeichen steht für das {R}?', 'Welches Symbol haben die {A}?'],
    rev: ['Welche Religion hat {X} als Symbol?', 'Welche Religion hat {X}?', 'Zu welcher Religion gehört {X}?'],
    merk: 'Stern – Kreuz – Mond: von oben (Himmel/Stern) nach unten (Mond), J – C – I.' },
  { key: 'gruender', kategorie: 'Gründer (laut Arbeitsblatt)', pool: 'gruender',
    werte: { Judentum: 'Abraham', Christentum: 'Jesus', Islam: 'Mohammed' },
    accept: { Christentum: ['Jesus Christus'], Islam: ['Muhammad', 'Muhammed', 'Mohamed'] },
    fwd: ['Wer gilt (laut Arbeitsblatt) als Gründer des {R}?', 'Wer ist der Gründer des {R}?'],
    rev: ['Welche Religion geht (laut Arbeitsblatt) auf {X} zurück?', 'Welche Religion wurde von {X} gegründet?'],
    merk: 'A – J – M: Abraham (Judentum), Jesus (Christentum), Mohammed (Islam) – wie im Alphabet, vom Ältesten zum Jüngsten.' },
  { key: 'prophet', kategorie: 'Prophet des Islam', pool: 'gruender',
    werte: { Judentum: '', Christentum: '', Islam: 'Mohammed' },
    accept: { Islam: ['Muhammad', 'Muhammed', 'Mohamed'] },
    fwd: ['Wer ist der Prophet des Islam?', 'Wie heißt der wichtigste Prophet des Islam?'] },
  { key: 'schrift', kategorie: 'Heilige Schrift', pool: 'schrift',
    werte: { Judentum: 'Tora', Christentum: 'Bibel', Islam: 'Koran' },
    accept: { Judentum: ['Thora', 'Torah', 'Tanach'], Islam: ['Quran'] },
    akk: { Judentum: 'die Tora', Christentum: 'die Bibel', Islam: 'den Koran' },
    fwd: ['Was ist die heilige Schrift des {R}?', 'Welches heilige Buch lesen die {A}?', 'Wie heißt das heilige Buch im {R}?'],
    rev: ['Welche Religion hat {X}?', 'Zu welcher Religion gehört {X}?', 'Welche Religion liest {X}?'],
    merk: 'T – B – K: „Tolle Bücher Kaufen“ = Tora, Bibel, Koran (J, C, I).' },
  { key: 'stadt', kategorie: 'Heilige Stadt', pool: 'stadt',
    werte: { Judentum: 'Jerusalem', Christentum: 'Jerusalem', Islam: 'Mekka' },
    fwd: ['Was ist die heilige Stadt des {R}?', 'Welche Stadt ist den {A} heilig?'],
    rev: ['Für welche Religion ist {X} die heilige Stadt?'], noRev: ['Judentum', 'Christentum'],
    merk: 'Jerusalem ist für ALLE DREI wichtig – heilige Stadt (laut Tabelle) für Juden und Christen. Für Muslime: Mekka.' },
  { key: 'haus', kategorie: 'Gotteshaus', pool: 'haus',
    werte: { Judentum: 'Synagoge', Christentum: 'Kirche', Islam: 'Moschee' },
    akk: { Judentum: 'in der Synagoge', Christentum: 'in der Kirche', Islam: 'in der Moschee' },
    fwd: ['Wo beten die {A}?', 'Wie heißt das Gotteshaus im {R}?', 'In welches Gebäude gehen die {A} zum Beten?'],
    rev: ['Welche Religion betet {X}?', 'Wer betet {X}? (Religion)'],
    merk: 'S – K – M: „Super Kalte Milch“ = Synagoge, Kirche, Moschee.' },
  { key: 'fest', kategorie: 'Wichtiges Fest', pool: 'fest',
    werte: { Judentum: 'Chanukka / Pessach', Christentum: 'Ostern', Islam: 'Zuckerfest / Opferfest' },
    accept: { Judentum: ['Chanukka', 'Pessach', 'Chanukka und Pessach', 'Hanukkah', 'Passah'], Islam: ['Zuckerfest', 'Opferfest', 'Zuckerfest und Opferfest'] },
    fwd: ['Nenne ein wichtiges Fest im {R}.', 'Welches wichtige Fest feiern die {A}?'],
    merk: 'Chanukka = Lichterfest der Juden (laut Vergleichstabelle). Christen: Ostern. Muslime: Zuckerfest/Opferfest.' },
];

/** Einzelne Fest-Rückfragen („Welche Religion feiert Ostern?“) */
const FEST_REV: [string, Rel3][] = [
  ['Ostern', 'Christentum'], ['Chanukka', 'Judentum'], ['Pessach', 'Judentum'], ['das Zuckerfest', 'Islam'], ['das Opferfest', 'Islam'],
  ['Weihnachten', 'Christentum'], ['Jom Kippur', 'Judentum'], ['Pfingsten', 'Christentum'], ['Rosch ha-Schana', 'Judentum'], ['Sukkot', 'Judentum'],
  ['Karfreitag', 'Christentum'], ['Schawuot', 'Judentum'], ['Fronleichnam', 'Christentum'], ['Christi Himmelfahrt', 'Christentum'],
];
const WEITERE_REV: [string, string, Rel3][] = [
  ['wochentag', 'Welche Religion hat den Freitag als wöchentlichen Feiertag?', 'Islam'],
  ['wochentag', 'Welche Religion feiert den Sabbat (Schabbat)?', 'Judentum'],
  ['wochentag', 'Welche Religion hat den Sonntag als wöchentlichen Feiertag?', 'Christentum'],
  ['symbol', 'Zu welcher Religion gehört die Menora (siebenarmiger Leuchter)?', 'Judentum'],
  ['ritual', 'In welcher Religion gibt es die Bar-Mizwa?', 'Judentum'],
  ['ritual', 'In welcher Religion gibt es die Konfirmation?', 'Christentum'],
  ['ritual', 'In welcher Religion gibt es den Hadsch (Pilgerfahrt nach Mekka)?', 'Islam'],
  ['anzahl', 'Welche der drei Religionen hat die meisten Anhänger (ca. 2,3 Mrd.)?', 'Christentum'],
  ['anzahl', 'Welche der drei Religionen hat die wenigsten Anhänger (ca. 15 Mio.)?', 'Judentum'],
  ['eintritt', 'In welcher Religion ist ein Kind Mitglied, wenn die Mutter dazugehört?', 'Judentum'],
  ['eintritt', 'In welcher Religion wird man durch den Vater oder ein Bekenntnis Mitglied?', 'Islam'],
  ['eintritt', 'In welcher Religion wird man durch die Taufe aufgenommen?', 'Christentum'],
  ['schrift', 'Zu welcher Religion gehört der Talmud?', 'Judentum'],
  ['schrift', 'Welche heilige Schrift hat 114 Suren? Zu welcher Religion gehört sie?', 'Islam'],
];

const fill = (t: string, r: Rel3, x = '') =>
  t.replace('{R}', r === 'Islam' ? 'Islam' : r === 'Judentum' ? 'Judentum' : 'Christentum').replace('{A}', ANHAENGER[r]).replace('{X}', x);

const RELACC: Record<Rel3, string[]> = {
  Judentum: ['jüdisch', 'Juden', 'Jude'],
  Christentum: ['christlich', 'Christen', 'Christ'],
  Islam: ['muslimisch', 'islamisch', 'Muslime', 'Moslems'],
};

export function buildVergleichItems(): Item[] {
  const items: Item[] = [];
  for (const row of VERGLEICH) {
    for (const r of REL3) {
      const w = row.werte[r];
      if (!w) continue;
      items.push({
        id: `v-${row.key}-${r}`, topic: 'vergleich', sub: row.kategorie, kind: 'input', tf: true,
        prompts: row.fwd.map((t) => fill(t, r)), answer: w, accept: [...(row.accept?.[r] ?? [])], pool: row.pool, mnemonic: row.merk,
      });
      if (row.rev && !row.noRev?.includes(r)) {
        const x = row.akk?.[r] ?? w;
        items.push({
          id: `v-${row.key}-${r}-rev`, topic: 'vergleich', sub: row.kategorie, kind: 'input', tf: true,
          prompts: row.rev.map((t) => fill(t, r, x)), answer: r, accept: RELACC[r], pool: 'religion3', mnemonic: row.merk,
        });
      }
    }
  }
  FEST_REV.forEach(([f, r], i) =>
    items.push({ id: `v-festrev-${i}`, topic: 'vergleich', sub: 'Feiertage', kind: 'input', tf: true,
      prompts: [`Welche Religion feiert ${f}?`, `${f.replace(/^das /, '').replace(/^./, (m) => m.toUpperCase())} – zu welcher Religion gehört dieses Fest?`],
      answer: r, accept: RELACC[r], pool: 'religion3' }));
  WEITERE_REV.forEach(([sub, p, r], i) =>
    items.push({ id: `v-mix-${i}`, topic: 'vergleich', sub: sub === 'wochentag' ? 'Wochenfeiertag' : sub === 'ritual' ? 'Rituale' : sub === 'symbol' ? 'Symbol' : sub === 'schrift' ? 'Heilige Schrift' : 'Grunddaten',
      kind: 'input', tf: true, prompts: [p], answer: r, accept: RELACC[r], pool: 'religion3' }));
  // Gemeinsamkeiten
  items.push({ id: 'v-gemeinsam-abraham', topic: 'vergleich', sub: 'Gemeinsamkeiten', kind: 'input', prompts: ['Judentum, Christentum und Islam heißen „abrahamitische“ Religionen. Nach wem?'],
    answer: 'Abraham', pool: 'gruender', mnemonic: 'Alle drei berufen sich auf ABRAHAM (Stammvater).' });
  items.push({ id: 'v-gemeinsam-jerusalem', topic: 'vergleich', sub: 'Gemeinsamkeiten', kind: 'input', prompts: ['Welche Stadt ist für alle drei Religionen wichtig?'],
    answer: 'Jerusalem', pool: 'stadt', explain: 'Juden: Tempelberg. Christen: Kreuzigung und Auferstehung. Muslime: Al-Aqsa-Moschee.' });
  items.push({ id: 'v-gemeinsam-reihe', topic: 'vergleich', sub: 'Gemeinsamkeiten', kind: 'list',
    prompts: ['Ordne die drei Religionen vom ältesten zum jüngsten.'], answer: 'Judentum → Christentum → Islam',
    groups: [['judentum'], ['christentum'], ['islam']], explain: 'Der Islam ist die jüngste der drei abrahamitischen Religionen.',
    mnemonic: 'Abraham (uralt) → Jesus (vor 2.000 Jahren) → Mohammed (vor 1.440 Jahren) = Judentum → Christentum → Islam.' });
  items.push({ id: 'v-gemeinsam-jesus', topic: 'vergleich', sub: 'Gemeinsamkeiten', kind: 'input',
    prompts: ['Welcher Prophet des Islam ist auch die zentrale Person im Christentum?'], answer: 'Jesus', pool: 'gruender' });
  return items;
}
