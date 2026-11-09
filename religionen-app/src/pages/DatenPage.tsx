import { useRef, useState } from 'react';
import { exportProgress, parseProgress, useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Btn, Card, ConfirmBtn, PageTitle } from '../components/ui';

export default function DatenPage() {
  const { p, content, update, reset } = useStore();
  const { startSession } = useNav();
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [alt, setAlt] = useState('');
  const [msg, setMsg] = useState('');
  const [txt, setTxt] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const custom = content.items.filter((i) => i.topic === 'zusatz');

  function addCard() {
    if (!q.trim() || !a.trim()) return;
    update((x) => ({ ...x, cards: [...x.cards, { id: Date.now().toString(36), question: q.trim(), answer: a.trim(), accept: alt.split(',').map((s) => s.trim()).filter(Boolean) }] }));
    setQ(''); setA(''); setAlt('');
  }

  function download() {
    const blob = new Blob([exportProgress(p)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = `lernstand-religionen-${new Date().toISOString().slice(0, 10)}.json`;
    el.click();
    URL.revokeObjectURL(url);
  }

  function upload(f: File) {
    f.text().then((t) => {
      const np = parseProgress(t);
      if (!np) return setMsg('❌ Datei konnte nicht gelesen werden.');
      update(() => np);
      setMsg('✅ Lernstand geladen.');
    });
  }

  const inp = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950';
  return (
    <div className="space-y-5 animate-fadein">
      <PageTitle icon="💾" title="Daten & Sicherung" sub="Eigene Prüfungsfragen ergänzen, Lernstand sichern oder auf ein anderes Gerät übertragen." />

      <Card>
        <h2 className="font-extrabold">📝 Eigene Prüfungsfragen (z. B. weitere Fragen aus den Arbeitsblättern)</h2>
        <p className="mt-1 text-sm text-slate-500">Diese Fragen werden genauso abgefragt und wiederholt wie alle anderen – auch im gemischten Lernen und bei „Meine Fehler“.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input className={`${inp} sm:col-span-2`} placeholder="Frage" value={q} onChange={(e) => setQ(e.target.value)} />
          <input className={inp} placeholder="Richtige Antwort" value={a} onChange={(e) => setA(e.target.value)} />
          <input className={inp} placeholder="Weitere richtige Schreibweisen (mit Komma)" value={alt} onChange={(e) => setAlt(e.target.value)} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Btn onClick={addCard} disabled={!q.trim() || !a.trim()}>+ Frage hinzufügen</Btn>
          {custom.length > 0 && <Btn variant="secondary" onClick={() => startSession({ title: 'Eigene Fragen', items: custom, count: custom.length })}>▶ Eigene Fragen üben ({custom.length})</Btn>}
        </div>
        {p.cards.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {p.cards.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-1 dark:border-slate-800">
                <span><b>{c.question}</b> → {c.answer}</span>
                <Btn size="sm" variant="ghost" onClick={() => update((x) => ({ ...x, cards: x.cards.filter((k) => k.id !== c.id) }))}>🗑️</Btn>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-extrabold">💾 Lernstand sichern</h2>
        <p className="mt-1 text-sm text-slate-500">Der Fortschritt wird automatisch im Browser (LocalStorage) gespeichert und bleibt nach einem Neustart erhalten. Zusätzlich kannst du ihn als Datei sichern – z. B. um vom Laptop aufs Handy zu wechseln.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn onClick={download}>⬇️ Lernstand herunterladen</Btn>
          <Btn variant="secondary" onClick={() => fileRef.current?.click()}>⬆️ Lernstand laden</Btn>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>
        {msg && <p className="mt-2 text-sm font-semibold">{msg}</p>}
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-slate-500">Sicherung als Text (falls Herunterladen nicht geht)</summary>
          <p className="mt-2 text-xs text-slate-500">Kopieren und z. B. in eine Notiz einfügen. Zum Laden: Text unten einfügen und „Aus Text laden“ tippen.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn size="sm" variant="secondary" onClick={() => { const t = exportProgress(p); navigator.clipboard?.writeText(t).then(() => setMsg('✅ Lernstand kopiert.'), () => { setTxt(t); setMsg('Text unten markieren und kopieren.'); }); }}>📋 Lernstand kopieren</Btn>
            <Btn size="sm" variant="secondary" disabled={!txt.trim()} onClick={() => { const np = parseProgress(txt); if (!np) return setMsg('❌ Text ist keine gültige Sicherung.'); update(() => np); setMsg('✅ Lernstand geladen.'); }}>Aus Text laden</Btn>
          </div>
          <textarea id="backup-text" value={txt} onChange={(e) => setTxt(e.target.value)} rows={4} className={`${inp} mt-2 font-mono text-xs`} placeholder="Sicherung hier einfügen …" />
        </details>
      </Card>

      <Card>
        <h2 className="font-extrabold text-rose-600">⚠️ Alles zurücksetzen</h2>
        <p className="mt-1 text-sm text-slate-500">Löscht Lernstand, Fehler, Lernzeit, eigene Fragen und Änderungen an Personen.</p>
        <ConfirmBtn className="mt-3" variant="danger" label="Alles zurücksetzen" confirmLabel="Wirklich ALLES löschen? Nochmal tippen" onConfirm={reset} />
      </Card>
    </div>
  );
}
