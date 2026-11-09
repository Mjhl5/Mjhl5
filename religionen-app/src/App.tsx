import { useEffect, useState } from 'react';
import { NavCtx, type Route } from './lib/nav';
import QuizSession, { type SessionProps } from './components/QuizSession';
import Dashboard from './pages/Dashboard';
import PlanPage from './pages/PlanPage';
import LaenderPage from './pages/LaenderPage';
import ReligionenPage from './pages/ReligionenPage';
import VergleichPage from './pages/VergleichPage';
import EvangelienPage from './pages/EvangelienPage';
import NamenPage from './pages/NamenPage';
import KlausurPage from './pages/KlausurPage';
import FehlerPage from './pages/FehlerPage';
import BlitzPage from './pages/BlitzPage';
import DatenPage from './pages/DatenPage';

const NAV: { r: Route; label: string; icon: string }[] = [
  { r: '', label: 'Start', icon: '🏠' },
  { r: 'plan', label: 'Klausur morgen', icon: '⏰' },
  { r: 'laender', label: 'Länder', icon: '🌍' },
  { r: 'religionen', label: 'Religionen', icon: '📋' },
  { r: 'vergleich', label: 'Vergleich', icon: '⚖️' },
  { r: 'evangelien', label: 'Evangelien', icon: '📖' },
  { r: 'namen', label: 'Namen', icon: '👤' },
  { r: 'klausur', label: 'Klausur-Simulator', icon: '📝' },
  { r: 'fehler', label: 'Meine Fehler', icon: '🎯' },
  { r: 'blitz', label: 'Blitzlernen', icon: '⚡' },
  { r: 'daten', label: 'Daten & Sicherung', icon: '💾' },
];

const readRoute = (): Route => (window.location.hash.replace(/^#\/?/, '') as Route) || '';

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [session, setSession] = useState<Omit<SessionProps, 'onExit'> | null>(null);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const h = () => { setRoute(readRoute()); setSession(null); };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('rk-theme', dark ? 'dark' : 'light'); } catch { /* */ }
  }, [dark]);

  const go = (r: Route) => {
    setSession(null);
    if (readRoute() === r) setRoute(r);
    else window.location.hash = `/${r}`;
    window.scrollTo({ top: 0 });
  };
  const startSession = (cfg: Omit<SessionProps, 'onExit'>) => { setSession(cfg); window.scrollTo({ top: 0 }); };

  const page = (() => {
    switch (route) {
      case 'plan': return <PlanPage />;
      case 'laender': return <LaenderPage />;
      case 'religionen': return <ReligionenPage />;
      case 'vergleich': return <VergleichPage />;
      case 'evangelien': return <EvangelienPage />;
      case 'namen': return <NamenPage />;
      case 'klausur': return <KlausurPage />;
      case 'fehler': return <FehlerPage />;
      case 'blitz': return <BlitzPage />;
      case 'daten': return <DatenPage />;
      default: return <Dashboard />;
    }
  })();

  return (
    <NavCtx.Provider value={{ route, go, startSession }}>
      <div className="min-h-screen lg:flex">
        {/* Seitenleiste (Desktop) */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white/80 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:flex">
          <div className="mb-4 px-2 pt-2">
            <div className="text-lg font-black tracking-tight">📚 Religionen</div>
            <div className="text-xs text-slate-500">Klausurtrainer</div>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto">
            {NAV.map((n) => (
              <button key={n.r} onClick={() => go(n.r)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${route === n.r && !session ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                <span>{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>
          <button onClick={() => setDark((d) => !d)} className="mt-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            {dark ? '☀️ Heller Modus' : '🌙 Dunkler Modus'}
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Kopfzeile (Handy/Tablet) */}
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
            <div className="flex items-center justify-between px-4 py-2">
              <button onClick={() => go('')} className="font-black">📚 Religionen-Trainer</button>
              <button onClick={() => setDark((d) => !d)} className="rounded-lg px-2 py-1 text-lg" aria-label="Farbmodus wechseln">{dark ? '☀️' : '🌙'}</button>
            </div>
            <nav className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2">
              {NAV.map((n) => (
                <button key={n.r} onClick={() => go(n.r)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${route === n.r && !session ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {n.icon} {n.label}
                </button>
              ))}
            </nav>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
            {session ? <QuizSession key={session.title + session.items.length} {...session} onExit={() => setSession(null)} /> : page}
          </main>
        </div>
      </div>
    </NavCtx.Provider>
  );
}
