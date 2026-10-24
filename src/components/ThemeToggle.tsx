import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? t('nav.themeToLight') : t('nav.themeToDark');
  return (
    <button type="button" onClick={toggle} className="btn-ghost h-10 w-10 p-0" aria-label={label} title={label} data-testid="theme-toggle">
      {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
