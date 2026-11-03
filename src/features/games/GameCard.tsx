import { Link } from 'react-router-dom';
import { Disc3, ImageOff } from 'lucide-react';
import type { GameRow } from '@/types/database';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import { formatPLN } from '@/lib/format';
import { discSummary } from './labels';

export type GameCardLayout = 'grid' | 'list';

export type GameCardData = Pick<
  GameRow,
  'id' | 'title' | 'edition' | 'release_year' | 'disc_type' | 'disc_count' | 'purchase_price' | 'condition' | 'cover_image'
>;

interface GameCardProps {
  game: GameCardData;
  /** Adres okładki (podpisany URL ze Storage); brak = ikona zastępcza. */
  coverUrl?: string | null;
  layout?: GameCardLayout;
}

function Cover({ title, url, className }: { title: string; url?: string | null; className: string }) {
  return url ? (
    <img src={url} alt={`Okładka: ${title}`} loading="lazy" decoding="async" className={`${className} object-cover`} />
  ) : (
    <div className={`${className} grid place-items-center bg-raised text-muted`} role="img" aria-label="Brak okładki">
      <ImageOff className="h-8 w-8" aria-hidden />
    </div>
  );
}

export function GameCard({ game, coverUrl, layout = 'grid' }: GameCardProps) {
  const disc = discSummary(game.disc_type, game.disc_count);
  const to = `/kolekcja/${game.id}`;

  if (layout === 'list') {
    return (
      <Link
        to={to}
        className="flex items-center gap-4 rounded-card border border-line bg-surface p-3 transition-colors hover:border-accent/50"
      >
        <Cover title={game.title} url={coverUrl} className="h-20 w-14 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{game.title}</h3>
          <p className="truncate text-sm text-muted">
            {[game.edition, game.release_year].filter(Boolean).join(', ') || 'Brak danych o wydaniu'}
          </p>
        </div>
        <div className="hidden text-sm text-muted sm:block">{disc}</div>
        <div className="hidden w-24 text-right text-sm sm:block">{formatPLN(game.purchase_price)}</div>
        <ConditionBadge value={game.condition} />
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className="group flex flex-col rounded-card border border-line bg-surface p-3 transition-colors hover:border-accent/50"
    >
      <h3 className="truncate font-semibold">{game.title}</h3>
      <p className="truncate text-sm text-muted">
        {[game.edition, game.release_year].filter(Boolean).join(', ') || 'Brak danych o wydaniu'}
      </p>

      <div className="relative mt-3 overflow-hidden rounded-xl">
        <Cover title={game.title} url={coverUrl} className="aspect-[5/7] w-full transition-transform duration-300 group-hover:scale-[1.03]" />
        <div className="absolute right-2 top-2">
          <ConditionBadge value={game.condition} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 text-muted">
          <Disc3 className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{disc ?? 'Nośnik nieznany'}</span>
        </span>
        <span className="shrink-0 font-medium">{formatPLN(game.purchase_price)}</span>
      </div>
    </Link>
  );
}
