import type { Item } from '../types';

export interface Evangelium { name: string; abk: string; symbol: string; icon: string; nameAlt?: string[]; abkAlt?: string[]; symAlt?: string[]; bild: string }

/** Reihenfolge wie in der Bibel: Mt, Mk, Lk, Jh */
export const EVANGELIEN: Evangelium[] = [
  { name: 'Matthäus', abk: 'Mt', symbol: 'Engel', icon: '👼', nameAlt: ['Matthaeus', 'Mattheus'], symAlt: ['Mensch', 'geflügelter Mensch'],
    bild: 'Matthäus beginnt mit dem Stammbaum Jesu – also mit MENSCHEN. Ein Mensch mit Flügeln = Engel.' },
  { name: 'Markus', abk: 'Mk', symbol: 'Löwe', icon: '🦁', bild: 'Markus beginnt mit Johannes dem Täufer, der in der Wüste ruft – laut wie ein brüllender LÖWE.' },
  { name: 'Lukas', abk: 'Lk', symbol: 'Stier', icon: '🐂', symAlt: ['Ochse', 'Rind'], bild: 'Lukas erzählt von der Krippe im STALL – im Stall steht der STIER.' },
  { name: 'Johannes', abk: 'Jh', symbol: 'Adler', icon: '🦅', abkAlt: ['Joh', 'Jo'], bild: 'Johannes ist das „höchste“, geistigste Evangelium – der ADLER fliegt am höchsten.' },
];

export const EVANGELIEN_GESCHICHTE =
  'ELSA-Trick: In der Bibel-Reihenfolge Mt – Mk – Lk – Jh stehen die Symbole E – L – S – A: Engel, Löwe, Stier, Adler → „ELSA“!\n\n' +
  'Geschichte: Ein ENGEL namens MATThäus liegt auf einer MATTe. Plötzlich springt ein LÖWE auf den MARKt – das ist MARKus. ' +
  'Alle laufen weg, nur ein STIER guckt aus der LUKe des Stalls – das ist LUKas. Und hoch oben kreist ein ADLER und ruft „JOHHH!“ – das ist JOHannes.';

const SYMS = EVANGELIEN.map((e) => e.symbol);
export function buildEvangelienItems(): Item[] {
  const items: Item[] = [];
  for (const e of EVANGELIEN) {
    const b = `${e.icon} ${e.bild}`;
    items.push({ id: `e-${e.abk}-sym`, topic: 'evangelien', sub: 'Symbole', kind: 'input', tf: true,
      prompts: [`Welches Symbol hat der Evangelist ${e.name}?`, `${e.name} – welches Symbol?`, `Welches Tier/Wesen gehört zu ${e.name}?`],
      answer: e.symbol, accept: e.symAlt, pool: 'gsym', mnemonic: b, cloze: `Das Symbol von ${e.name} ist der/das ___.` });
    items.push({ id: `e-${e.abk}-name`, topic: 'evangelien', sub: 'Symbole', kind: 'input', tf: true,
      prompts: [`Welcher Evangelist hat das Symbol ${e.symbol}?`, `Symbol ${e.icon} ${e.symbol} → welches Evangelium?`],
      answer: e.name, accept: e.nameAlt, pool: 'gname', mnemonic: b });
    items.push({ id: `e-${e.abk}-abk`, topic: 'evangelien', sub: 'Abkürzungen', kind: 'input', tf: true,
      prompts: [`Wie wird das Evangelium nach ${e.name} abgekürzt?`, `Abkürzung für ${e.name}?`],
      answer: e.abk, accept: e.abkAlt, pool: 'gabk', mnemonic: 'Mt = MaTThäus (mit T), Mk = MarKus (mit K), Lk = LuKas, Jh = JoHannes.' });
    items.push({ id: `e-${e.abk}-abkname`, topic: 'evangelien', sub: 'Abkürzungen', kind: 'input', tf: true,
      prompts: [`Wofür steht die Abkürzung „${e.abk}“?`, `„${e.abk}“ = welches Evangelium?`],
      answer: e.name, accept: e.nameAlt, pool: 'gname', mnemonic: 'Mt = MaTThäus (mit T), Mk = MarKus (mit K), Lk = LuKas, Jh = JoHannes.' });
    items.push({ id: `e-${e.abk}-abksym`, topic: 'evangelien', sub: 'Symbole', kind: 'input',
      prompts: [`Welches Symbol gehört zur Abkürzung „${e.abk}“?`], answer: e.symbol, accept: e.symAlt, pool: 'gsym', mnemonic: b });
  }
  items.push({ id: 'e-alle', topic: 'evangelien', sub: 'Übersicht', kind: 'list', prompts: ['Nenne alle vier Evangelien.'],
    answer: 'Matthäus, Markus, Lukas, Johannes', groups: [['matthaeus', 'mattheus'], ['markus'], ['lukas'], ['johannes']],
    mnemonic: '„Mit Meinem Lieben Jesus“ – Matthäus, Markus, Lukas, Johannes.' });
  items.push({ id: 'e-alle-sym', topic: 'evangelien', sub: 'Symbole', kind: 'list', prompts: ['Nenne die vier Evangelisten-Symbole.'],
    answer: SYMS.join(', '), groups: [['engel', 'mensch'], ['loewe'], ['stier', 'ochse'], ['adler']], mnemonic: EVANGELIEN_GESCHICHTE });
  return items;
}
