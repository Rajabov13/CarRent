import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { PRICE_CHECK_DATE } from '@/data/exchangeRates';
import { useFormat } from '@/hooks/useMoney';

export function Footer() {
  const { t } = useTranslation();
  const f = useFormat();
  return (
    <footer className="no-print mt-20 border-t border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm muted">{t('footer.tagline')}</p>
          <p className="mt-3 text-xs muted">{t('footer.disclaimer')}</p>
          <p className="mt-3 text-xs muted">{t('hero.badge', { date: f.date(PRICE_CHECK_DATE) })}</p>
        </div>
        <div>
          <p className="label">{t('footer.explore')}</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:underline" to="/cars">{t('nav.cars')}</Link></li>
            <li><Link className="hover:underline" to="/cars?view=map">{t('map.title')}</Link></li>
            <li><Link className="hover:underline" to="/prices">{t('nav.prices')}</Link></li>
            <li><Link className="hover:underline" to="/account">{t('nav.account')}</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">{t('footer.info')}</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:underline" to="/sources">{t('nav.sources')}</Link></li>
            <li><Link className="hover:underline" to="/#faq">{t('home.faqTitle')}</Link></li>
            <li><Link className="hover:underline" to="/#how">{t('home.howTitle')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-200 py-5 dark:border-ink-800">
        <p className="container-page text-xs muted">{t('footer.rights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
