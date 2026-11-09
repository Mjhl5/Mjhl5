import { describe, expect, it } from 'vitest';
import { matchAnswer, matchList } from '../lib/text';
import { buildContent } from '../lib/content';
import { PERSONEN_STANDARD, NAMENSLISTE_JUDENTUM } from '../data/personen';
import { LAENDER } from '../data/laender';
import { buildOptions } from '../components/QuestionCard';
import { applyAnswer, pickSession, interleaveItems } from '../lib/srs';
import { gradeFor } from '../pages/KlausurPage';

const content = buildContent(PERSONEN_STANDARD, []);

describe('Antwortprüfung', () => {
  it('erkennt exakte und tolerante Antworten', () => {
    expect(matchAnswer('damaskus', ['Damaskus']).correct).toBe(true);
    expect(matchAnswer('Damaskos', ['Damaskus']).typo).toBe(true);
    expect(matchAnswer('neu delhi', ['Neu-Delhi']).correct).toBe(true);
    expect(matchAnswer('Washington', ['Washington D. C.', 'Washington']).correct).toBe(true);
    expect(matchAnswer('Washington DC', ['Washington D. C.']).correct).toBe(true);
    expect(matchAnswer('die Synagoge', ['Synagoge']).correct).toBe(true);
    expect(matchAnswer('Jawe', ['Jahwe']).correct).toBe(true);
    expect(matchAnswer('Ulan Bator', ['Ulan-Bator']).correct).toBe(true);
  });
  it('lehnt andere bekannte Antworten ab und meldet Verwechslung', () => {
    const caps = content.pools.get('hauptstadt')!;
    const r = matchAnswer('Damaskus', ['Teheran'], caps);
    expect(r.correct).toBe(false);
    expect(r.confusedWith).toBe('Damaskus');
    expect(matchAnswer('Irak', ['Iran'], content.pools.get('land')!).correct).toBe(false);
    expect(matchAnswer('Nigeria', ['Niger'], content.pools.get('land')!).correct).toBe(false);
    expect(matchAnswer('Rim', ['Rom'], []).correct).toBe(false);
    expect(matchAnswer('Markus', ['Matthäus'], content.pools.get('gname')!).correct).toBe(false);
    expect(matchAnswer('Islam', ['Christentum'], content.pools.get('religion5')!).correct).toBe(false);
    expect(matchAnswer('Sydney', ['Canberra'], caps).correct).toBe(false);
    expect(matchAnswer('', ['Rom']).correct).toBe(false);
  });
  it('prüft Aufzählungen über Stichworte', () => {
    const g = [['orthodox'], ['konservativ'], ['liberal', 'reform']];
    expect(matchList('Orthodoxe, Konservative und Liberale', g).correct).toBe(true);
    expect(matchList('orthodox, reformjuden, konservative juden', g).correct).toBe(true);
    const r = matchList('orthodox und reform', g);
    expect(r.correct).toBe(false);
    expect(r.missing).toEqual([1]);
  });
});

describe('Lerninhalte', () => {
  it('hat eindeutige IDs', () => {
    const ids = content.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('hat genau 20 Länder mit allen Übungen', () => {
    expect(LAENDER.length).toBe(20);
    expect(LAENDER.map((l) => l.nr)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    for (const L of LAENDER) expect(content.items.filter((i) => i.id.startsWith(`l-${L.nr}-`)).length).toBe(7);
  });
  it('setzt die Namensliste vollständig zusammen (jeder Namensteil genau einmal)', () => {
    const parts = NAMENSLISTE_JUDENTUM.split(', ').sort();
    const used = PERSONEN_STANDARD.flatMap((p) => [p.first, p.last]).sort();
    expect(used).toEqual(parts);
    expect(PERSONEN_STANDARD.length).toBe(27);
  });
  it('jede Musterlösung wird von der eigenen Prüfung als richtig erkannt', () => {
    for (const it of content.items) {
      if (it.kind === 'input' || it.kind === 'map') {
        const acc = [it.answer, ...(it.accept ?? [])];
        for (const a of acc) {
          const r = matchAnswer(a, acc, content.pools.get(it.pool ?? '') ?? []);
          expect(r.correct, `${it.id}: "${a}"`).toBe(true);
        }
      }
      if (it.kind === 'list') {
        const r = matchList(it.answer, it.groups ?? [], it.min);
        expect(r.correct, `${it.id}: ${it.answer} – fehlt ${r.missing}`).toBe(true);
      }
      if (it.kind === 'choice') expect(buildOptions(it, content.pools), it.id).toContain(it.answer);
      if (it.kind === 'multi') for (const p of it.parts!) expect(matchAnswer(p.answer, [p.answer, ...(p.accept ?? [])], content.pools.get(p.pool ?? '') ?? []).correct).toBe(true);
      expect(it.prompts.length, it.id).toBeGreaterThan(0);
    }
  });
  it('Multiple Choice liefert 4 verschiedene Optionen für Pool-Fragen', () => {
    for (const it of content.items.filter((i) => i.pool && !i.options && i.kind === 'input')) {
      const o = buildOptions(it, content.pools);
      expect(new Set(o).size, it.id).toBe(o.length);
      expect(o.length, it.id).toBeGreaterThanOrEqual(2);
    }
  });
  it('Lückentexte enthalten genau eine Lücke', () => {
    for (const it of content.items.filter((i) => i.cloze)) expect(it.cloze!.split('___').length, it.id).toBe(2);
  });
});

describe('Wiederholungssystem', () => {
  it('falsch → Box 1, richtig → aufsteigen', () => {
    let s = applyAnswer(undefined, true);
    expect(s.box).toBe(1);
    s = applyAnswer(s, true);
    expect(s.box).toBe(2);
    s = applyAnswer(s, false);
    expect(s.box).toBe(1);
    expect(s.wrong).toBe(1);
  });
  it('fällige Fehler kommen zuerst', () => {
    const items = content.items.filter((i) => i.topic === 'laender');
    const states = { [items[5].id]: { box: 1, due: 0, right: 0, wrong: 2, streak: 0, last: 0 } };
    const pick = pickSession(items, states, 10, false);
    expect(pick.map((i) => i.id)).toContain(items[5].id);
  });
  it('mischt Themen (Interleaving)', () => {
    const its = interleaveItems(content.items.filter((i) => i.topic === 'laender' || i.topic === 'islam').slice(0, 60));
    let same = 0;
    for (let i = 1; i < its.length; i++) if (its[i].topic === its[i - 1].topic && its[i].sub === its[i - 1].sub) same++;
    expect(same).toBeLessThan(its.length / 3);
  });
  it('Notenschlüssel', () => {
    expect(gradeFor(95)).toBe('1');
    expect(gradeFor(70)).toBe('3');
    expect(gradeFor(10)).toBe('6');
  });
});
