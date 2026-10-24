import type { ReactNode } from 'react';
import { AlertTriangle, Info, Loader2, SearchX } from 'lucide-react';

export function SectionHeading({ title, subtitle, action, id }: { title: string; subtitle?: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 id={id} className="section-title">
          {title}
        </h2>
        {subtitle && <p className="mt-2 muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'info';

const toneClass: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
  accent: 'bg-accent-500/15 text-accent-700 dark:text-accent-300',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
};

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={`chip ${toneClass[tone]} ${className}`}>{children}</span>;
}

export function Notice({ children, tone = 'info', title }: { children: ReactNode; tone?: 'info' | 'warning'; title?: string }) {
  const Icon = tone === 'warning' ? AlertTriangle : Info;
  const cls =
    tone === 'warning'
      ? 'border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
      : 'border-sky-300/70 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200';
  return (
    <div className={`flex gap-3 rounded-xl border p-3 text-sm ${cls}`} role={tone === 'warning' ? 'alert' : 'note'}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <SearchX className="h-10 w-10 text-ink-300 dark:text-ink-600" aria-hidden />
      <p className="mt-4 text-lg font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-md muted">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ExternalLink({ href, children, className = 'link' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
