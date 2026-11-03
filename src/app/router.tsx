import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAdmin } from '@/features/auth/RequireAdmin';

// Każda strona jest osobną paczką ładowaną na żądanie.
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const CollectionPage = lazy(() => import('@/pages/CollectionPage'));
const GameDetailsPage = lazy(() => import('@/pages/GameDetailsPage'));
const GameFormPage = lazy(() => import('@/pages/GameFormPage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const StatsPage = lazy(() => import('@/pages/StatsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const page = (node: ReactNode) => (
  <Suspense fallback={<div className="p-8 text-muted">Ładowanie…</div>}>{node}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/logowanie', element: page(<LoginPage />) },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: page(<DashboardPage />) },
          { path: 'kolekcja', element: page(<CollectionPage />) },
          { path: 'kolekcja/:id', element: page(<GameDetailsPage />) },
          { path: 'kolekcja/:id/edycja', element: page(<GameFormPage />) },
          { path: 'dodaj', element: page(<GameFormPage />) },
          { path: 'lista-zyczen', element: page(<WishlistPage />) },
          { path: 'statystyki', element: page(<StatsPage />) },
          { path: 'ustawienia', element: page(<SettingsPage />) },
          { path: '*', element: page(<NotFoundPage />) },
        ],
      },
    ],
  },
]);
