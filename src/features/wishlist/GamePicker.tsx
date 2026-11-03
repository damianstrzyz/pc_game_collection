import { useState } from 'react';
import { Link2, X } from 'lucide-react';
import { useDebounce } from '@/lib/useDebounce';
import { useLinkableGames } from './useWishlist';

interface GamePickerProps {
  value: { id: string; title: string } | null;
  onChange: (value: { id: string; title: string } | null) => void;
}

/** Opcjonalne powiązanie pozycji z grą już będącą w kolekcji (np. inne wydanie tego samego tytułu). */
export function GamePicker({ value, onChange }: GamePickerProps) {
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term, 300);
  const { data, isFetching } = useLinkableGames(debounced);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <Link2 className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span className="truncate">{value.title}</span>
        </span>
        <button type="button" onClick={() => onChange(null)} aria-label="Usuń powiązanie" className="text-muted hover:text-ink">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Wpisz tytuł gry z kolekcji…"
        aria-label="Powiąż z grą z kolekcji"
        className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm placeholder:text-muted focus:border-accent/60"
      />
      {debounced.trim().length >= 2 && (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-line bg-surface text-sm">
          {isFetching && !data ? (
            <li className="px-3 py-2 text-muted">Szukanie…</li>
          ) : data && data.length > 0 ? (
            data.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ id: g.id, title: g.edition ? `${g.title} (${g.edition})` : g.title });
                    setTerm('');
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-raised"
                >
                  {g.title}
                  {g.edition && <span className="text-muted"> ({g.edition})</span>}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-muted">Brak pasujących gier w kolekcji.</li>
          )}
        </ul>
      )}
    </div>
  );
}
