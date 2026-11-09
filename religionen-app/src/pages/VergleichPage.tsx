import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { REL3, VERGLEICH } from '../data/vergleich';
import { aggregate } from '../lib/stats';
import { Btn, Card, ModeButton, PageTitle } from '../components/ui';

export default function VergleichPage() {
  const { p, content } = useStore();
  const { startSession } = useNav();
  const [cover, setCover] = useState(false);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const items = content.items.filter((i) => i.topic === 'vergleich');
  const rows = VERGLEICH.filter((r) => r.key !== 'prophet');
  const ag = aggregate(items, p.states);
  const fwd = items.filter((i) => !i.id.endsWith('-rev') && !i.id.startsWith('v-festrev') && !i.id.startsWith('v-mix'));
  const rev = items.filter((i) => i.pool === 'religion3');

  return (
    <div className="space-y-5 animate-fadein">
      <PageTitle icon="⚖️" title="Vergleichs-Trainer" sub="Judentum, Christentum und Islam im direkten Vergleich – jede Kategorie in verschiedenen Formulierungen." />

      <div className="grid gap-3 sm:grid-cols-3">
        <ModeButton icon="🔀" title="Alles gemischt" desc={`${items.length} Fragen · ${Math.round(ag.score * 100)} % sicher`} onClick={() => startSession({ title: 'Vergleich – gemischt', items, count: 30, mode: 'varied' })} />
        <ModeButton icon="➡️" title="Religion → Merkmal" desc="z. B. „Wo beten Muslime?“" onClick={() => startSession({ title: 'Vergleich: Religion → Merkmal', items: fwd, count: 25 })} />
        <ModeButton icon="⬅️" title="Merkmal → Religion" desc="z. B. „Welche Religion hat die Tora?“" onClick={() => startSession({ title: 'Vergleich: Merkmal → Religion', items: rev, count: 25 })} />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">📊 Vergleichstabelle</h2>
          <Btn size="sm" variant={cover ? 'primary' : 'secondary'} onClick={() => { setCover((c) => !c); setShown({}); }}>{cover ? '🙈 Abdecken an' : '👁️ Felder abdecken'}</Btn>
        </div>
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                <th className="px-2 py-2 text-xs uppercase text-slate-500">Kategorie</th>
                <th className="px-2">✡️ Judentum</th><th className="px-2">✝️ Christentum</th><th className="px-2">☪️ Islam</th>
                <th className="px-2 text-xs uppercase text-slate-500">Üben</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-2 font-semibold text-slate-500">{r.kategorie}</td>
                  {REL3.map((rel) => {
                    const id = `${r.key}-${rel}`;
                    const hidden = cover && !shown[id];
                    return (
                      <td key={rel} className="px-2 font-bold">
                        {hidden ? <button onClick={() => setShown((s) => ({ ...s, [id]: true }))} className="rounded bg-slate-200 px-2 py-1 text-xs font-normal text-slate-500 dark:bg-slate-700">❓</button> : r.werte[rel]}
                      </td>
                    );
                  })}
                  <td className="px-2">
                    <Btn size="sm" variant="secondary" onClick={() => startSession({ title: `Vergleich: ${r.kategorie}`, items: items.filter((i) => i.sub === r.kategorie), count: 20 })}>▶</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-lg font-extrabold">🤝 Gemeinsamkeiten</h2>
          <ul className="space-y-1 text-sm">
            <li>• Alle drei sind <b>abrahamitische</b> Religionen (Stammvater Abraham).</li>
            <li>• Alle drei glauben an <b>einen</b> Gott.</li>
            <li>• <b>Jerusalem</b> ist für alle drei wichtig (Tempelberg · Kreuzigung/Auferstehung · Al-Aqsa-Moschee).</li>
            <li>• Jesus war <b>Jude</b>; im Islam ist Jesus ein <b>Prophet</b>.</li>
            <li>• Alter: Judentum → Christentum → Islam (jüngste).</li>
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 text-lg font-extrabold">💡 Merkhilfen (Reihenfolge J – C – I)</h2>
          <ul className="space-y-1 text-sm">
            {rows.filter((r) => r.merk).map((r) => <li key={r.key}>• <b>{r.kategorie}:</b> {r.merk}</li>)}
            <li>• <b>Wochentag:</b> Freitag (Islam) → Samstag/Sabbat (Judentum) → Sonntag (Christentum).</li>
            <li>• <b>Eintritt:</b> Judentum über die Mutter, Islam über den Vater/Bekenntnis, Christentum durch die Taufe.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
