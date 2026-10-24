import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.title'));
  return (
    <div className="container-page py-24 text-center">
      <p className="text-6xl font-black text-accent-500">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t('notFound.title')}</h1>
      <p className="mt-2 muted">{t('notFound.body')}</p>
      <Link to="/" className="btn-primary mt-6">{t('notFound.home')}</Link>
    </div>
  );
}
