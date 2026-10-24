import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGS } from '@/i18n';

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn-ghost h-10 px-3"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('nav.language')}: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        data-testid="language-button"
      >
        <Globe className="h-4 w-4" aria-hidden />
        <span>{current.short}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t('nav.language')}
          className="absolute right-0 z-[1100] mt-2 w-44 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg dark:border-ink-700 dark:bg-ink-900"
        >
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === current.code}
                lang={l.code}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
                onClick={() => {
                  void i18n.changeLanguage(l.code);
                  setOpen(false);
                }}
                data-testid={`lang-${l.code}`}
              >
                <span>{l.label}</span>
                {l.code === current.code && <Check className="h-4 w-4 text-accent-600" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
