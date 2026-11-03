import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Gamepad2, LogOut, Search, Settings } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

export function AppHeader() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');

  // Pole wyszukiwania odzwierciedla adres URL (np. po wyczyszczeniu filtrów).
  const urlQuery = params.get('q') ?? '';
  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/kolekcja?q=${encodeURIComponent(q)}` : '/kolekcja');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight lg:w-48">
          <Gamepad2 className="h-6 w-6 text-accent" aria-hidden />
          <span className="hidden sm:inline">Kolekcja gier</span>
        </Link>

        <form onSubmit={onSubmit} role="search" className="relative min-w-0 flex-1 lg:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po tytule, EAN lub edycji…"
            aria-label="Szukaj w kolekcji"
            className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-sm placeholder:text-muted focus:border-accent/60"
          />
        </form>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/ustawienia"
            aria-label="Ustawienia"
            className="grid h-10 w-10 place-items-center rounded-xl text-muted transition-colors hover:bg-surface hover:text-ink lg:hidden"
          >
            <Settings className="h-5 w-5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm text-accent transition-colors hover:bg-surface"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Wyloguj</span>
            <span className="sr-only sm:hidden">Wyloguj</span>
          </button>
        </div>
      </div>
    </header>
  );
}
