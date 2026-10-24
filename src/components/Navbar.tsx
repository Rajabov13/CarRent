import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, UserRound, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

const links = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/cars', key: 'nav.cars', end: false },
  { to: '/prices', key: 'nav.prices', end: false },
  { to: '/sources', key: 'nav.sources', end: false },
];

export function Navbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-ink-100 text-ink-950 dark:bg-ink-800 dark:text-white'
        : 'text-ink-600 hover:text-ink-950 dark:text-ink-300 dark:hover:text-white'
    }`;

  return (
    <header className="no-print sticky top-0 z-[1000] border-b border-ink-200/70 bg-white/90 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main">
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>
              {t(l.key)}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <Link to="/account" className="btn-dark hidden h-10 sm:inline-flex" data-testid="account-button">
            <UserRound className="h-4 w-4" aria-hidden />
            <span>{t('nav.account')}</span>
          </Link>
          <button
            type="button"
            className="btn-ghost h-10 w-10 p-0 lg:hidden"
            aria-label={t('nav.menu')}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-ink-200 bg-white px-4 py-3 lg:hidden dark:border-ink-800 dark:bg-ink-950">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>
                {t(l.key)}
              </NavLink>
            ))}
            <NavLink to="/account" className={linkCls}>
              {t('nav.account')}
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
