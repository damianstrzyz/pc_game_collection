import { Link } from 'react-router-dom';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import { formatDate, formatPLN } from '@/lib/format';
import type { StatGame } from '@/types/stats';

interface GameMiniListProps {
  title: string;
  games: readonly StatGame[];
  /** Co pokazać pod tytułem. */
  detail: 'added' | 'purchase' | 'price';
}

function detailText(g: StatGame, detail: GameMiniListProps['detail']): string {
  if (detail === 'added') return `Dodano ${formatDate(g.created_at)}`;
  if (detail === 'purchase') return `${formatDate(g.purchase_date)}, ${formatPLN(g.purchase_price)}`;
  return formatPLN(g.purchase_price);
}

export function GameMiniList({ title, games, detail }: GameMiniListProps) {
  return (
    <section className="rounded-card border border-line bg-surface/50 p-5">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {games.length === 0 ? (
        <p className="text-sm text-muted">Brak danych.</p>
      ) : (
        <ul className="divide-y divide-line">
          {games.map((g) => (
            <li key={g.id}>
              <Link to={`/kolekcja/${g.id}`} className="flex items-center justify-between gap-3 py-2 hover:opacity-80">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{g.title}</span>
                  <span className="block truncate text-xs text-muted">{detailText(g, detail)}</span>
                </span>
                <ConditionBadge value={g.condition} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
