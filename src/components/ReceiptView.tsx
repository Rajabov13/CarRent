import type { ReceiptModel } from '@/hooks/useReceiptModel';
import { Logo } from './Logo';

export function ReceiptView({ model, compact = false }: { model: ReceiptModel; compact?: boolean }) {
  return (
    <article className="card print-surface overflow-hidden" aria-label={model.title} data-testid="receipt">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-200 p-5 dark:border-ink-800">
        <div>
          {!compact && <Logo />}
          <h2 className={`${compact ? '' : 'mt-3'} text-lg font-bold`}>{model.title}</h2>
          <p className="text-xs muted">{model.platform}</p>
        </div>
        <div className="text-right">
          <span className="inline-block rotate-[-2deg] rounded-md border-2 border-amber-600 px-2 py-1 text-xs font-black tracking-widest text-amber-700 dark:border-amber-400 dark:text-amber-300" data-testid="estimate-stamp">
            {model.stamp}
          </span>
          {model.reference && (
            <p className="mt-2 text-xs">
              <span className="muted">{model.reference.label}: </span>
              <span className="font-mono font-semibold" data-testid="receipt-reference">{model.reference.value}</span>
            </p>
          )}
          {model.issued && (
            <p className="text-xs">
              <span className="muted">{model.issued.label}: </span>
              {model.issued.value}
            </p>
          )}
        </div>
      </header>

      <p className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs font-medium text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        {model.notConfirmed}
      </p>

      <div className="space-y-5 p-5">
        <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {model.parties.map((p) => (
            <div key={p.label}>
              <p className="label">{p.label}</p>
              {p.lines.map((line, i) => (
                <p key={i} className={`text-sm ${i === 0 ? 'font-semibold' : 'muted'} break-words`}>
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          {model.facts.map((x) => (
            <div key={x.label} className="rounded-xl bg-ink-100/70 p-3 dark:bg-ink-800/60">
              <dt className="text-xs muted">{x.label}</dt>
              <dd className="text-sm font-semibold">{x.value}</dd>
            </div>
          ))}
        </dl>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="receipt-items">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:text-ink-400">
                <th scope="col" className="py-2 pr-2 font-semibold">{model.itemHeaders[0]}</th>
                <th scope="col" className="py-2 pr-2 text-right font-semibold">{model.itemHeaders[1]}</th>
                <th scope="col" className="py-2 pr-2 text-right font-semibold">{model.itemHeaders[2]}</th>
                <th scope="col" className="py-2 text-right font-semibold">{model.itemHeaders[3]}</th>
              </tr>
            </thead>
            <tbody>
              {model.items.map((it, i) => (
                <tr key={i} className="border-b border-ink-100 dark:border-ink-800/70">
                  <td className="py-2 pr-2">{it.label}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{it.qty}</td>
                  <td className="whitespace-nowrap py-2 pr-2 text-right tabular-nums">{it.unit}</td>
                  <td className={`whitespace-nowrap py-2 text-right tabular-nums ${it.muted ? 'italic muted' : 'font-medium'}`}>{it.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto max-w-md space-y-1.5" data-testid="receipt-totals">
          {model.totals.map((x) => (
            <div key={x.label} className={`flex items-baseline justify-between gap-4 ${x.strong ? 'border-t border-ink-200 pt-2 text-base font-bold dark:border-ink-700' : 'text-sm'}`}>
              <dt>
                {x.label}
                {x.note && <span className="block text-[11px] font-normal muted">{x.note}</span>}
              </dt>
              <dd className="whitespace-nowrap tabular-nums">{x.value}</dd>
            </div>
          ))}
        </dl>

        {model.notes.length > 0 && (
          <ul className="list-disc space-y-1 rounded-xl bg-ink-100/60 p-4 pl-8 text-xs text-ink-600 dark:bg-ink-800/50 dark:text-ink-300">
            {model.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}

        {!compact && (
          <div>
            <p className="label">{model.termsTitle}</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {model.terms.map((x) => (
                <div key={x.label}>
                  <dt className="font-semibold">{x.label}</dt>
                  <dd className="muted">{x.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <p className="text-[11px] muted break-words">{model.footer}</p>
      </div>
    </article>
  );
}
