import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight" aria-label="RentCar Uzbekistan">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 dark:bg-white">
        <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden>
          <path d="M14 38l5-12c1-3 3-4 6-4h14c3 0 5 1 6 4l5 12v8a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-2H21v2a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z" fill="#f59e0b" />
          <circle cx="22" cy="38" r="3" className="fill-ink-950 dark:fill-white" />
          <circle cx="42" cy="38" r="3" className="fill-ink-950 dark:fill-white" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block text-[15px] text-ink-950 dark:text-white">RentCar</span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600 dark:text-accent-400">Uzbekistan</span>
      </span>
    </Link>
  );
}
