import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Blokada tras w interfejsie. Prawdziwe zabezpieczenie to RLS w bazie danych. */
export function RequireAdmin() {
  const { session, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted">Ładowanie…</div>;
  }
  if (!session || !isAdmin) {
    return <Navigate to="/logowanie" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
