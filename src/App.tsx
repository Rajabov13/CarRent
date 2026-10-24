import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/layouts/MainLayout';
import { ThemeProvider } from '@/context/ThemeContext';
import { Spinner } from '@/components/ui';
import HomePage from '@/pages/HomePage';

const CarsPage = lazy(() => import('@/pages/CarsPage'));
const CarDetailsPage = lazy(() => import('@/pages/CarDetailsPage'));
const BookingPage = lazy(() => import('@/pages/BookingPage'));
const ReceiptPage = lazy(() => import('@/pages/ReceiptPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const PricesPage = lazy(() => import('@/pages/PricesPage'));
const SourcesPage = lazy(() => import('@/pages/SourcesPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function Loading() {
  const { t } = useTranslation();
  return <Spinner label={t('common.loading')} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="cars" element={<CarsPage />} />
              <Route path="cars/:slug" element={<CarDetailsPage />} />
              <Route path="booking/:slug" element={<BookingPage />} />
              <Route path="receipt/:reference" element={<ReceiptPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="prices" element={<PricesPage />} />
              <Route path="sources" element={<SourcesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
