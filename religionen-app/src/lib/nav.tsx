import { createContext, useContext } from 'react';
import type { SessionProps } from '../components/QuizSession';

export type Route = '' | 'plan' | 'laender' | 'religionen' | 'vergleich' | 'evangelien' | 'namen' | 'klausur' | 'fehler' | 'blitz' | 'daten';

export interface Nav {
  route: Route;
  go: (r: Route) => void;
  startSession: (cfg: Omit<SessionProps, 'onExit'>) => void;
}

export const NavCtx = createContext<Nav | null>(null);
export const useNav = () => {
  const n = useContext(NavCtx);
  if (!n) throw new Error('NavCtx fehlt');
  return n;
};
