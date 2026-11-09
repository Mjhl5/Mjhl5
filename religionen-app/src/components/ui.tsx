import { forwardRef, useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 ${className}`}>{children}</div>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'; size?: 'sm' | 'md' | 'lg' };
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn({ variant = 'primary', size = 'md', className = '', ...rest }, ref) {
  const v = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
    success: 'bg-emerald-600 text-white hover:bg-emerald-500',
  }[variant];
  const s = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-base' }[size];
  return <button ref={ref} className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${v} ${s} ${className}`} {...rest} />;
});

export function Bar({ value, className = '', color = 'bg-indigo-500' }: { value: number; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageTitle({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl"><span>{icon}</span>{title}</h1>
      {sub && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

export function Tag({ children, color = 'slate' }: { children: ReactNode; color?: 'slate' | 'amber' | 'rose' | 'emerald' | 'indigo' }) {
  const c = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  }[color];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${c}`}>{children}</span>;
}

export function ModeButton({ title, desc, icon, onClick, badge }: { title: string; desc?: string; icon?: string; onClick: () => void; badge?: ReactNode }) {
  return (
    <button onClick={onClick} className="group flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500">
      {icon && <span className="text-2xl">{icon}</span>}
      <span className="flex-1">
        <span className="flex items-center gap-2 font-bold">{title}{badge}</span>
        {desc && <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{desc}</span>}
      </span>
      <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-500">→</span>
    </button>
  );
}

/** Knopf mit eingebauter Sicherheitsabfrage (zweimal tippen) – ohne Browser-Dialog */
export function ConfirmBtn({ label, confirmLabel = 'Sicher? Nochmal tippen', onConfirm, ...rest }: Omit<BtnProps, 'onClick'> & { label: ReactNode; confirmLabel?: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Btn {...rest} variant={armed ? 'danger' : rest.variant} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {armed ? confirmLabel : label}
    </Btn>
  );
}
