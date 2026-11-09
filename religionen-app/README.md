# 📚 Religionen – Klausurtrainer

Lern-App für die Klausur über die Weltreligionen (Länder, Judentum, Christentum, Islam, Vergleich, Evangelien, Persönlichkeiten).
Läuft komplett lokal im Browser, ohne Login. Der Lernstand wird im Browser (LocalStorage) gespeichert.

## Starten

Voraussetzung: [Node.js](https://nodejs.org) (Version 18 oder neuer).

```bash
cd religionen-app
npm install
npm run dev
```

Dann im Browser öffnen: **http://localhost:5173**

Auf dem Handy (im selben WLAN): die Adresse nehmen, die im Terminal unter „Network“ steht, z. B. `http://192.168.x.x:5173`.

### Ohne Entwicklungsserver (fertige Version)

```bash
npm run build
npm run preview
```
→ http://localhost:4173

## Tests

```bash
npm test
```
Prüft u. a., dass jede Musterlösung von der Antwortprüfung als richtig erkannt wird und die Namensliste vollständig zusammengesetzt ist.

## Inhalte ergänzen

- **Fehlende Persönlichkeiten (Christentum/Islam):** in der App unter *Namen → Bearbeiten / ergänzen* (eine Person pro Zeile: `Vorname; Nachname`).
- **Weitere Fragen aus den Arbeitsblättern:** unter *Daten & Sicherung → Eigene Prüfungsfragen*.
- Im Code: `src/data/*.ts`.
