export interface Land {
  nr: number;
  land: string;
  kontinent: string;
  hauptstadt: string;
  religion: string;
  lat: number;
  lon: number;
  /** weitere akzeptierte Schreibweisen */
  hsAlt?: string[];
  landAlt?: string[];
  kontAlt?: string[];
  merk?: string;
  /** Grammatik: „Hauptstadt von …“ / „in …“ */
  von?: string;
  inn?: string;
}

/** Verbindliche Lerntabelle (20 Länder) */
export const LAENDER: Land[] = [
  { nr: 1, von: 'den USA', inn: 'in den USA', land: 'USA', kontinent: 'Nordamerika', hauptstadt: 'Washington D. C.', religion: 'Christentum', lat: 39, lon: -98,
    hsAlt: ['Washington', 'Washington DC'], landAlt: ['Vereinigte Staaten', 'Amerika', 'Vereinigte Staaten von Amerika'],
    merk: 'Nicht New York! Die Hauptstadt ist Washington – wie der erste Präsident George Washington.' },
  { nr: 2, land: 'Nepal', kontinent: 'Asien', hauptstadt: 'Kathmandu', religion: 'Hinduismus', lat: 28.3, lon: 84,
    merk: 'Im Himalaya (Mount Everest!). „Kat-man-du“: Eine Katze ruft „Mann, du!“ vom Berg. Nepal liegt neben Indien → auch Hinduismus.' },
  { nr: 3, land: 'Pakistan', kontinent: 'Asien', hauptstadt: 'Islamabad', religion: 'Islam', lat: 30, lon: 70,
    merk: 'Die Hauptstadt verrät die Religion: ISLAM-abad → Islam.' },
  { nr: 4, land: 'Italien', kontinent: 'Europa', hauptstadt: 'Rom', religion: 'Christentum', lat: 42.8, lon: 12.5,
    merk: 'In Rom steht der Petersdom und der Papst wohnt dort → Christentum.' },
  { nr: 5, land: 'Thailand', kontinent: 'Asien', hauptstadt: 'Bangkok', religion: 'Buddhismus', lat: 15, lon: 101,
    merk: 'Thailand = goldene Buddha-Tempel in Bangkok.' },
  { nr: 6, land: 'Brasilien', kontinent: 'Südamerika', hauptstadt: 'Brasilia', religion: 'Christentum', lat: -10, lon: -52,
    hsAlt: ['Brasília'],
    merk: 'Nicht Rio! Die Hauptstadt heißt fast wie das Land: Brasil-ien → Brasil-ia. Riesige Christus-Statue in Rio → Christentum.' },
  { nr: 7, land: 'Indonesien', kontinent: 'Asien', hauptstadt: 'Jakarta', religion: 'Islam', lat: -2.5, lon: 118,
    hsAlt: ['Djakarta'],
    merk: 'Indonesien = das Land mit den meisten Muslimen der Welt. „Ja, Karte!“ → Jakarta.' },
  { nr: 8, land: 'Myanmar', kontinent: 'Asien', hauptstadt: 'Naypyidaw', religion: 'Buddhismus', lat: 21, lon: 96,
    hsAlt: ['Naypyitaw', 'Nay Pyi Taw', 'Naypyitau'], landAlt: ['Birma', 'Burma'],
    merk: '„Nay-pyi-daw“: „Nein, Pie da!“ – Der Mönch (Buddhismus) will keinen Kuchen. Myanmar liegt neben Thailand → auch Buddhismus.' },
  { nr: 9, land: 'Israel', kontinent: 'Asien', hauptstadt: 'Jerusalem', religion: 'Judentum', lat: 31.4, lon: 35,
    merk: 'Israel liegt in Asien (Naher Osten)! Jerusalem = heilige Stadt der Juden.' },
  { nr: 10, land: 'Namibia', kontinent: 'Afrika', hauptstadt: 'Windhuk', religion: 'Christentum', lat: -22, lon: 17,
    hsAlt: ['Windhoek'],
    merk: '„Wind-Huk“: In der Namib-Wüste weht der WIND über den HUT. Früher deutsche Kolonie → Christentum.' },
  { nr: 11, land: 'Marokko', kontinent: 'Afrika', hauptstadt: 'Rabat', religion: 'Islam', lat: 32, lon: -6,
    merk: 'Nicht Marrakesch! „Ra-bat“: Marokko gibt RABATT auf dem Markt (Basar). Nordafrika → Islam.' },
  { nr: 12, land: 'Indien', kontinent: 'Asien', hauptstadt: 'Neu-Delhi', religion: 'Hinduismus', lat: 22, lon: 79,
    hsAlt: ['Delhi', 'New Delhi', 'Neu Delhi'],
    merk: 'INDien → HINDuismus (fast gleiche Buchstaben!).' },
  { nr: 13, land: 'Syrien', kontinent: 'Asien', hauptstadt: 'Damaskus', religion: 'Islam', lat: 35, lon: 38.5,
    merk: '„Da-mas-kus“: „Da mach ’nen Kuss!“ Syrien liegt im Nahen Osten → Islam.' },
  { nr: 14, land: 'Mexiko', kontinent: 'Mittelamerika', hauptstadt: 'Mexiko City', religion: 'Christentum', lat: 23, lon: -102,
    hsAlt: ['Mexiko Stadt', 'Mexico City', 'Mexiko-Stadt', 'Mexico'], kontAlt: ['Zentralamerika'],
    merk: 'Ganz einfach: Land Mexiko → Stadt Mexiko City. Achtung: Kontinent laut Tabelle = Mittelamerika.' },
  { nr: 15, land: 'Niger', kontinent: 'Afrika', hauptstadt: 'Niamey', religion: 'Islam', lat: 17, lon: 9,
    merk: 'NI-ger → NI-amey: beide fangen mit „Ni“ an. Sahara/Westafrika → Islam.' },
  { nr: 16, land: 'Russland', kontinent: 'Europa/Asien', hauptstadt: 'Moskau', religion: 'Christentum', lat: 61, lon: 95,
    kontAlt: ['Europa und Asien', 'Eurasien', 'Asien/Europa', 'Asien und Europa'],
    merk: 'Russland liegt in ZWEI Kontinenten: Europa UND Asien. Orthodoxe Kirche mit Zwiebeltürmen → Christentum.' },
  { nr: 17, von: 'dem Iran', inn: 'im Iran', land: 'Iran', kontinent: 'Asien', hauptstadt: 'Teheran', religion: 'Islam', lat: 32.5, lon: 54,
    hsAlt: ['Tehran'],
    merk: '„Tee-heran“: Im Iran trinkt man viel Tee. Iran = vor allem Schiiten → Islam.' },
  { nr: 18, land: 'Australien', kontinent: 'Australien', hauptstadt: 'Canberra', religion: 'Christentum', lat: -25, lon: 134,
    hsAlt: ['Kanberra'],
    merk: 'Nicht Sydney! „Can-berra“: Ein Känguru „kann Beeren“ essen. Kontinent = Australien (wie das Land).' },
  { nr: 19, von: 'der Mongolei', inn: 'in der Mongolei', land: 'Mongolei', kontinent: 'Asien', hauptstadt: 'Ulan-Bator', religion: 'Buddhismus', lat: 46.8, lon: 103,
    hsAlt: ['Ulaanbaatar', 'Ulan Bator', 'Ulanbator'],
    merk: '„Ulan-Bator“: Ein Ulan (Reiter) auf dem Pferd in der Steppe. Mongolei = buddhistische Klöster.' },
  { nr: 20, von: 'den Philippinen', inn: 'auf den Philippinen', land: 'Philippinen', kontinent: 'Asien', hauptstadt: 'Manila', religion: 'Christentum', lat: 12.5, lon: 122,
    merk: 'Phil-ippinen → „Phil“ kommt aus Spanien (König Philipp) → katholisch → Christentum. Manila klingt spanisch.' },
];

export const KONTINENTE = ['Nordamerika', 'Mittelamerika', 'Südamerika', 'Europa', 'Asien', 'Afrika', 'Australien', 'Europa/Asien'];
export const RELIGIONEN5 = ['Christentum', 'Islam', 'Judentum', 'Hinduismus', 'Buddhismus'];

/** Merkhilfe nach Religionen gruppiert (Gruppierung) */
export const LAENDER_GRUPPEN_MERK =
  'Gruppen-Trick: Buddhismus = Thailand, Myanmar, Mongolei („TMM“). Hinduismus = Indien, Nepal („IN“). Judentum = nur Israel. ' +
  'Islam = Pakistan, Indonesien, Marokko, Syrien, Niger, Iran („PIMSNI“). Christentum = alle anderen 8: USA, Italien, Brasilien, Namibia, Mexiko, Russland, Australien, Philippinen.';
