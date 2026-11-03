import { Link } from 'react-router-dom';
import type { LabelCount } from '@/types/stats';

interface RankListProps {
  title: string;
  items: readonly LabelCount[];
  /** Adres katalogu z włączonym filtrem dla danej pozycji. */
  hrefFor?: (label: string) => string;
  limit?: number;
}

export function RankList({ title, items, hrefFor, limit = 5 }: RankListProps) {
  const top = items.slice(0, limit);
  const max = Math.max(1, ...top.map((i) => i.count));
  return (
    <section className="rounded-card border border-line bg-surface/50 p-5">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {top.length === 0 ? (
        <p className="text-sm text-muted">Brak danych.</p>
      ) : (
        <ol className="space-y-2.5">
          {top.map((item) => {
            const row = (
              <>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{item.label}</span>
                  <span className="shrink-0 text-muted">{item.count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(item.count / max) * 100}%` }} />
                </div>
              </>
            );
            return (
              <li key={item.label}>
                {hrefFor ? (
                  <Link to={hrefFor(item.label)} className="block rounded-lg hover:opacity-80">
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
