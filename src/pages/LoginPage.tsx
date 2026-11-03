import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

export default function LoginPage() {
  const { session, isAdmin, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && session && isAdmin) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    setBusy(false);
    if (message) setError(message);
    else navigate(from, { replace: true });
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-card border border-line bg-surface p-6">
        <h1 className="text-xl font-semibold">Kolekcja gier PC</h1>
        <p className="text-sm text-muted">Dostęp tylko dla właściciela kolekcji.</p>
        <label className="block text-sm">
          E-mail
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Hasło
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2"
          />
        </label>
        {error && <p role="alert" className="text-sm text-cond-poor">{error}</p>}
        {!error && !loading && session && !isAdmin && (
          <p role="alert" className="text-sm text-cond-poor">To konto nie ma uprawnień administratora.</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent px-3 py-2 font-medium text-bg disabled:opacity-60"
        >
          {busy ? 'Logowanie…' : 'Zaloguj się'}
        </button>
      </form>
    </div>
  );
}
