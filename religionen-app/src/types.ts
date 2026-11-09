export type Topic =
  | 'laender'
  | 'judentum'
  | 'christentum'
  | 'islam'
  | 'vergleich'
  | 'evangelien'
  | 'namen'
  | 'zusatz';

export type ItemKind = 'input' | 'choice' | 'list' | 'multi' | 'map' | 'mapclick';

export interface Part {
  label: string;
  answer: string;
  accept?: string[];
  pool?: string;
  /** feste Auswahl (z. B. Kontinent) – sonst Freitext */
  options?: string[];
}

export interface Item {
  id: string;
  topic: Topic;
  /** Unterkategorie, z. B. „Hauptstädte“, „Feiertage“ – für Schwächen-Analyse */
  sub: string;
  kind: ItemKind;
  /** verschiedene Formulierungen derselben Frage */
  prompts: string[];
  /** Musterlösung zum Anzeigen */
  answer: string;
  /** weitere akzeptierte Schreibweisen */
  accept?: string[];
  /** Name des Antwort-Pools (für Multiple Choice + Verwechslungs-Erkennung) */
  pool?: string;
  /** feste Antwortmöglichkeiten */
  options?: string[];
  /** Für 'list': jede Gruppe = ein Pflichtbestandteil mit Alternativen */
  groups?: string[][];
  /** Für 'list': wie viele Gruppen mindestens genannt werden müssen */
  min?: number;
  /** Für 'multi': mehrere Felder */
  parts?: Part[];
  /** Lückentext-Satz mit ___ */
  cloze?: string;
  explain?: string;
  mnemonic?: string;
  /** Hinweis, wenn Inhalt unsicher ist */
  uncertain?: string;
  /** Für Karten-Fragen */
  mapNo?: number;
  /** Antworten, die bei Multiple Choice NICHT als falsche Option vorkommen dürfen */
  exclude?: string[];
  /** Für Richtig/Falsch-Generierung erlaubt */
  tf?: boolean;
}

export interface ItemState {
  box: number; // 0 = neu, 1..6
  due: number; // Zeitstempel
  right: number;
  wrong: number;
  streak: number;
  last: number;
}

export interface MistakeEntry {
  id: string;
  given: string;
  expected: string;
  at: number;
  confusedWith?: string;
}

export interface Person {
  id: string;
  group: 'judentum' | 'christentum' | 'islam';
  first: string;
  last: string;
  job: string;
  /** Beruf-Varianten, die auch akzeptiert werden */
  jobAccept?: string[];
  pairingUncertain?: boolean;
  jobNote?: string;
  custom?: boolean;
}

export interface CustomCard {
  id: string;
  question: string;
  answer: string;
  accept: string[];
}
