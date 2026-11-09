import type { Person } from '../types';

/**
 * Namensliste Judentum aus dem Arbeitsblatt (alphabetisch getrennte Vor- und Nachnamen):
 * Adam, Albert, Andrew, Andy, Anne, Bar, Barbra, Benjamin, Bernstein, Bob, Chagall, David, Davidson, Dylan,
 * Einstein, Felix, Frank, Franz, Freud, Garfield, Gustav, Heine, Heinrich, Jassy, Kafka, Kravitz, Kunis, Kurt,
 * Leonard, Levi, Mahler, Marc, Mark, Mendelssohn Bartholdy, Mila, Natalie, Netanyahu, Parker, Pete, Portman,
 * Refaeli, Sandler, Sarah Jessica, Selenskyj, Sigmund, Spielberg, Steven, Strauss, Streisand, Tucholsky,
 * Wolodymyr, Zaslav, Zoë, Zuckerberg.
 *
 * Aus diesen 54 Teilen ergeben sich 27 Personen.
 * WICHTIG: Berufe stehen NICHT in der Liste. Sie stammen aus Allgemeinwissen und
 * müssen mit den handschriftlichen Notizen verglichen werden (im Editor änderbar).
 */
export const NAMENSLISTE_JUDENTUM = 'Adam, Albert, Andrew, Andy, Anne, Bar, Barbra, Benjamin, Bernstein, Bob, Chagall, David, Davidson, Dylan, Einstein, Felix, Frank, Franz, Freud, Garfield, Gustav, Heine, Heinrich, Jassy, Kafka, Kravitz, Kunis, Kurt, Leonard, Levi, Mahler, Marc, Mark, Mendelssohn Bartholdy, Mila, Natalie, Netanyahu, Parker, Pete, Portman, Refaeli, Sandler, Sarah Jessica, Selenskyj, Sigmund, Spielberg, Steven, Strauss, Streisand, Tucholsky, Wolodymyr, Zaslav, Zoë, Zuckerberg';

const JN = 'Beruf aus Allgemeinwissen – bitte mit deinen handschriftlichen Notizen abgleichen.';
const p = (id: string, first: string, last: string, job: string, jobAccept: string[], extra: Partial<Person> = {}): Person => ({
  id, group: 'judentum', first, last, job, jobAccept, jobNote: JN, ...extra,
});

export const PERSONEN_STANDARD: Person[] = [
  p('adam-sandler', 'Adam', 'Sandler', 'Schauspieler / Komiker', ['schauspieler', 'komiker', 'comedian', 'kom']),
  p('albert-einstein', 'Albert', 'Einstein', 'Physiker', ['physiker', 'wissenschaftler', 'forscher']),
  p('andrew-garfield', 'Andrew', 'Garfield', 'Schauspieler', ['schauspieler']),
  p('andy-jassy', 'Andy', 'Jassy', 'Manager (Chef von Amazon)', ['manager', 'chef', 'unternehmer', 'geschaeftsfuehrer', 'ceo', 'amazon'],
    { pairingUncertain: true, jobNote: 'Paarung durch Ausschluss ermittelt (übrig gebliebene Namen). Beruf aus Allgemeinwissen – bitte prüfen.' }),
  p('anne-frank', 'Anne', 'Frank', 'Tagebuchschreiberin (Autorin)', ['tagebuch', 'autorin', 'schriftstellerin', 'schreiberin', 'autor']),
  p('bar-refaeli', 'Bar', 'Refaeli', 'Model', ['model', 'modell', 'fotomodell']),
  p('barbra-streisand', 'Barbra', 'Streisand', 'Sängerin / Schauspielerin', ['saengerin', 'saenger', 'schauspieler', 'musik']),
  p('benjamin-netanyahu', 'Benjamin', 'Netanyahu', 'Politiker (Ministerpräsident Israels)', ['politiker', 'ministerpraesident', 'premierminister', 'regierungschef', 'praesident']),
  p('bob-dylan', 'Bob', 'Dylan', 'Musiker / Sänger', ['musiker', 'saenger', 'songwriter', 'liedermacher']),
  p('david-zaslav', 'David', 'Zaslav', 'Manager (Chef von Warner Bros. Discovery)', ['manager', 'chef', 'unternehmer', 'geschaeftsfuehrer', 'ceo', 'medien'],
    { pairingUncertain: true, jobNote: 'Paarung durch Ausschluss ermittelt (übrig gebliebene Namen). Beruf aus Allgemeinwissen – bitte prüfen.' }),
  p('felix-mendelssohn', 'Felix', 'Mendelssohn Bartholdy', 'Komponist', ['komponist', 'musiker']),
  p('franz-kafka', 'Franz', 'Kafka', 'Schriftsteller', ['schriftsteller', 'autor', 'dichter']),
  p('gustav-mahler', 'Gustav', 'Mahler', 'Komponist / Dirigent', ['komponist', 'dirigent', 'musiker']),
  p('heinrich-heine', 'Heinrich', 'Heine', 'Dichter / Schriftsteller', ['dichter', 'schriftsteller', 'autor', 'poet', 'lyriker']),
  p('kurt-tucholsky', 'Kurt', 'Tucholsky', 'Schriftsteller / Journalist', ['schriftsteller', 'journalist', 'autor']),
  p('leonard-bernstein', 'Leonard', 'Bernstein', 'Komponist / Dirigent', ['komponist', 'dirigent', 'musiker']),
  p('levi-strauss', 'Levi', 'Strauss', 'Unternehmer (Erfinder der Jeans)', ['unternehmer', 'jeans', 'erfinder', 'kaufmann', 'fabrikant']),
  p('marc-chagall', 'Marc', 'Chagall', 'Maler', ['maler', 'kuenstler'], { jobNote: JN + ' Achtung Schreibweise: MarC Chagall (mit C), MarK Zuckerberg (mit K).' }),
  p('mark-zuckerberg', 'Mark', 'Zuckerberg', 'Unternehmer (Gründer von Facebook)', ['unternehmer', 'facebook', 'gruender', 'programmierer', 'ceo', 'meta'],
    { jobNote: JN + ' Achtung Schreibweise: MarK Zuckerberg (mit K), MarC Chagall (mit C).' }),
  p('mila-kunis', 'Mila', 'Kunis', 'Schauspielerin', ['schauspieler']),
  p('natalie-portman', 'Natalie', 'Portman', 'Schauspielerin', ['schauspieler']),
  p('pete-davidson', 'Pete', 'Davidson', 'Komiker / Schauspieler', ['komiker', 'comedian', 'schauspieler']),
  p('sarah-jessica-parker', 'Sarah Jessica', 'Parker', 'Schauspielerin', ['schauspieler']),
  p('sigmund-freud', 'Sigmund', 'Freud', 'Arzt / Psychologe (Psychoanalytiker)', ['psycholog', 'psychoanaly', 'arzt', 'neurolog', 'psychiater']),
  p('steven-spielberg', 'Steven', 'Spielberg', 'Regisseur', ['regisseur', 'filmemacher', 'produzent', 'film']),
  p('wolodymyr-selenskyj', 'Wolodymyr', 'Selenskyj', 'Politiker (Präsident der Ukraine)', ['politiker', 'praesident', 'staatschef']),
  p('zoe-kravitz', 'Zoë', 'Kravitz', 'Schauspielerin', ['schauspieler', 'saengerin']),
];

export const PERSONEN_HINWEIS =
  'Aus der Namensliste Judentum ergeben sich 27 Personen (nicht 20). Die Christentum- und Islam-Listen fehlen noch – du kannst sie unter „Namen-Trainer → Bearbeiten“ ergänzen. ' +
  'Gelernt werden nur Vor- und Nachnamen (keine Berufe).';
