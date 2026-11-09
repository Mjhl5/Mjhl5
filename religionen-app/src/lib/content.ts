import type { CustomCard, Item, Person, Topic } from '../types';
import { LAENDER, KONTINENTE, RELIGIONEN5, LAENDER_GRUPPEN_MERK } from '../data/laender';
import { JUDENTUM_ITEMS, CHRISTENTUM_ITEMS, ISLAM_ITEMS } from '../data/religionen';
import { buildVergleichItems } from '../data/vergleich';
import { buildEvangelienItems } from '../data/evangelien';

export const TOPIC_LABEL: Record<Topic, string> = {
  laender: 'Länder',
  judentum: 'Judentum',
  christentum: 'Christentum',
  islam: 'Islam',
  vergleich: 'Vergleich',
  evangelien: 'Evangelien',
  namen: 'Persönlichkeiten',
  zusatz: 'Eigene Fragen',
};
export const TOPIC_ICON: Record<Topic, string> = {
  laender: '🌍', judentum: '✡️', christentum: '✝️', islam: '☪️', vergleich: '⚖️', evangelien: '📖', namen: '👤', zusatz: '📝',
};

const RELACC: Record<string, string[]> = {
  Christentum: ['christlich', 'Christen'],
  Islam: ['muslimisch', 'islamisch', 'Muslime'],
  Judentum: ['jüdisch', 'Juden'],
  Hinduismus: ['Hindu', 'Hindus', 'hinduistisch'],
  Buddhismus: ['buddhistisch', 'Buddhisten', 'Buddha'],
};

const WO: Record<string, string> = { USA: 'Wo liegen die USA?', Philippinen: 'Wo liegen die Philippinen?', Mongolei: 'Wo liegt die Mongolei?', Iran: 'Wo liegt der Iran?' };

export function buildLaenderItems(): Item[] {
  const items: Item[] = [];
  for (const L of LAENDER) {
    const merk = L.merk;
    const von = L.von ?? L.land;
    const inn = L.inn ?? `in ${L.land}`;
    items.push({ id: `l-${L.nr}-hs`, topic: 'laender', sub: 'Hauptstädte', kind: 'input', tf: true,
      prompts: [`Wie heißt die Hauptstadt von ${von}?`, `${L.land} – Hauptstadt?`, `Was ist die Hauptstadt von ${von}?`],
      answer: L.hauptstadt, accept: L.hsAlt, pool: 'hauptstadt', mnemonic: merk, cloze: `Die Hauptstadt von ${von} ist ___.` });
    items.push({ id: `l-${L.nr}-land`, topic: 'laender', sub: 'Länder zu Hauptstädten', kind: 'input', tf: true,
      prompts: [`${L.hauptstadt} ist die Hauptstadt von welchem Land?`, `Zu welchem Land gehört die Hauptstadt ${L.hauptstadt}?`],
      answer: L.land, accept: L.landAlt, pool: 'land', mnemonic: merk });
    items.push({ id: `l-${L.nr}-kont`, topic: 'laender', sub: 'Kontinente', kind: 'choice', tf: true,
      prompts: [`Auf welchem Kontinent ${(WO[L.land] ?? `Wo liegt ${L.land}?`).replace(/^Wo /, '').replace(/\?$/, '')}?`, `${L.land} – welcher Kontinent?`],
      answer: L.kontinent, accept: L.kontAlt, options: KONTINENTE, pool: 'kontinent', mnemonic: merk });
    items.push({ id: `l-${L.nr}-rel`, topic: 'laender', sub: 'Religionen der Länder', kind: 'input', tf: true,
      prompts: [`Welche Religion ist ${inn} vorherrschend?`, `${L.land} – welche Religion haben die meisten Menschen?`],
      answer: L.religion, accept: RELACC[L.religion], pool: 'religion5', mnemonic: `${merk ?? ''}\n\n${LAENDER_GRUPPEN_MERK}`.trim() });
    items.push({ id: `l-${L.nr}-all`, topic: 'laender', sub: 'Komplette Zuordnung', kind: 'multi',
      prompts: [`${L.land}: Nenne Hauptstadt, Kontinent und Religion.`], answer: `${L.hauptstadt} · ${L.kontinent} · ${L.religion}`, mnemonic: merk,
      parts: [
        { label: 'Hauptstadt', answer: L.hauptstadt, accept: L.hsAlt, pool: 'hauptstadt' },
        { label: 'Kontinent', answer: L.kontinent, accept: L.kontAlt, pool: 'kontinent', options: KONTINENTE },
        { label: 'Religion', answer: L.religion, accept: RELACC[L.religion], pool: 'religion5' },
      ] });
    items.push({ id: `l-${L.nr}-map`, topic: 'laender', sub: 'Karte', kind: 'map', mapNo: L.nr,
      prompts: [`Welches Land hat auf der Karte die Nummer ${L.nr}?`], answer: L.land, accept: L.landAlt, pool: 'land', mnemonic: merk });
    items.push({ id: `l-${L.nr}-mapclick`, topic: 'laender', sub: 'Karte', kind: 'mapclick', mapNo: L.nr,
      prompts: [`${WO[L.land] ?? `Wo liegt ${L.land}?`} Tippe auf die richtige Nummer.`], answer: String(L.nr), mnemonic: merk });
  }
  return items;
}

export function buildPersonItems(persons: Person[]): Item[] {
  const items: Item[] = [];
  for (const P of persons) {
    const full = `${P.first} ${P.last}`;
    const unsicher = P.pairingUncertain ? '⚠️ Paarung unsicher: durch Ausschluss ermittelt (diese Namen blieben übrig).' : undefined;
    const merk = /^Mar[ck]$/.test(P.first) ? 'Achtung Schreibweise: MarC Chagall (mit C, Maler), MarK Zuckerberg (mit K).' : undefined;
    items.push({ id: `p-${P.id}-fl`, topic: 'namen', sub: 'Nachnamen', kind: 'input', tf: true,
      prompts: [`Vorname: ${P.first} → Wie lautet der Nachname?`, `${P.first} … ? (Nachname ergänzen)`],
      answer: P.last, pool: 'nachname', uncertain: unsicher, explain: full, mnemonic: merk });
    items.push({ id: `p-${P.id}-lf`, topic: 'namen', sub: 'Vornamen', kind: 'input', tf: true,
      prompts: [`Nachname: ${P.last} → Wie lautet der Vorname?`, `… ${P.last} (Vorname ergänzen)`],
      answer: P.first, pool: 'vorname', uncertain: unsicher, explain: full, mnemonic: merk });
  }
  return items;
}

export function buildCustomItems(cards: CustomCard[]): Item[] {
  return cards.map((k) => ({ id: `z-${k.id}`, topic: 'zusatz' as Topic, sub: 'Eigene Fragen', kind: 'input' as const, prompts: [k.question], answer: k.answer, accept: k.accept, tf: true }));
}

const STATIC_ITEMS: Item[] = [
  ...buildLaenderItems(),
  ...JUDENTUM_ITEMS,
  ...CHRISTENTUM_ITEMS,
  ...ISLAM_ITEMS,
  ...buildVergleichItems(),
  ...buildEvangelienItems(),
];

export interface Content {
  items: Item[];
  byId: Map<string, Item>;
  pools: Map<string, string[]>;
  /** nur echte Lern-Antworten (für Verwechslungs-Statistik) */
  corePools: Map<string, Set<string>>;
}

const EXTRA_POOLS: Record<string, string[]> = {
  religion5: RELIGIONEN5,
  religion3: ['Judentum', 'Christentum', 'Islam'],
  kontinent: KONTINENTE,
  gott: ['Jahwe', 'Gott', 'Allah'],
  symbol: ['Davidstern', 'Kreuz', 'Halbmond', 'Menora'],
  haus: ['Synagoge', 'Kirche', 'Moschee'],
  schrift: ['Tora', 'Bibel', 'Koran', 'Tanach', 'Talmud'],
  gruender: ['Abraham', 'Jesus', 'Mohammed', 'Moses', 'Noah'],
  stadt: ['Jerusalem', 'Mekka', 'Medina', 'Bethlehem', 'Rom', 'Wittenberg'],
  wochentag: ['Freitag', 'Samstag', 'Sonntag', 'Sabbat / Schabbat'],
  fest: ['Weihnachten', 'Karfreitag', 'Ostern', 'Christi Himmelfahrt', 'Pfingsten', 'Fronleichnam', 'Rosch ha-Schana', 'Jom Kippur', 'Sukkot', 'Pessach', 'Schawuot', 'Opferfest', 'Zuckerfest', 'Chanukka'],
  anhaenger: ['Juden', 'Christen', 'Muslime'],
  stroemung: ['Sunniten', 'Schiiten'],
  prozent: ['10 %', '50 %', '75 %', '90 %'],
  alter: ['12. Geburtstag', '13. Geburtstag', '14. Geburtstag', '18. Geburtstag'],
  // häufig verwechselte (nicht abgefragte) Namen – damit z. B. „Irak“ nicht als Tippfehler von „Iran“ durchgeht
  land: ['Irak', 'Nigeria', 'Mali', 'Oman', 'Jemen', 'Libanon', 'Jordanien', 'Ägypten', 'Türkei', 'China', 'Japan', 'Laos', 'Kanada', 'Spanien', 'Portugal', 'Kenia', 'Malaysia', 'Kambodscha', 'Vietnam', 'Bangladesch', 'Afghanistan', 'Saudi-Arabien', 'Algerien', 'Tunesien', 'Libyen', 'Österreich'],
  hauptstadt: ['Bagdad', 'Abuja', 'Rio de Janeiro', 'Sydney', 'Melbourne', 'New York', 'Marrakesch', 'Casablanca', 'Istanbul', 'Tel Aviv', 'Karachi', 'Mumbai', 'Peking', 'Tokio', 'Hanoi', 'Kairo', 'Beirut', 'Amman', 'Riad', 'Kabul', 'Bamako', 'Lagos', 'Sankt Petersburg', 'Mailand', 'Yangon', 'Rangun', 'Sao Paulo', 'Los Angeles', 'Guadalajara', 'Kapstadt'],
};

export function buildContent(persons: Person[], cards: CustomCard[]): Content {
  const items = [...STATIC_ITEMS, ...buildPersonItems(persons), ...buildCustomItems(cards)];
  const byId = new Map(items.map((i) => [i.id, i]));
  const poolSets = new Map<string, Set<string>>();
  const add = (k: string, v: string) => {
    if (!v) return;
    if (!poolSets.has(k)) poolSets.set(k, new Set());
    poolSets.get(k)!.add(v);
  };
  for (const it of items) {
    if (it.pool) add(it.pool, it.answer);
    it.parts?.forEach((p) => p.pool && add(p.pool, p.answer));
  }
  const corePools = new Map<string, Set<string>>();
  poolSets.forEach((v, k) => corePools.set(k, new Set(v)));
  for (const [k, vs] of Object.entries(EXTRA_POOLS)) vs.forEach((v) => add(k, v));
  persons.forEach((p) => add('person', `${p.first} ${p.last}`));
  const pools = new Map<string, string[]>();
  poolSets.forEach((s, k) => pools.set(k, [...s]));
  return { items, byId, pools, corePools };
}
