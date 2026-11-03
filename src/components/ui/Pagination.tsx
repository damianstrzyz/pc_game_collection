import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/** Numery stron z wielokropkami, np. 1 … 4 5 6 … 20. */
function pageItems(page: number, count: number): Array<number | 'gap-l' | 'gap-r'> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const items: Array<number | 'gap-l' | 'gap-r'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  if (start > 2) items.push('gap-l');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < count - 1) items.push('gap-r');
  items.push(count);
  return items;
}

const base = 'grid h-10 min-w-10 place-items-center rounded-xl border px-3 text-sm transition-colors';

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Paginacja" className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Poprzednia strona"
        className={`${base} border-line text-muted hover:text-ink disabled:opacity-40`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      {pageItems(page, pageCount).map((item) =>
        typeof item === 'string' ? (
          <span key={item} className="px-1 text-muted" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Strona ${item}`}
            className={`${base} ${item === page ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted hover:text-ink'}`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Następna strona"
        className={`${base} border-line text-muted hover:text-ink disabled:opacity-40`}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
