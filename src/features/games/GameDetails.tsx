import type { ReactNode } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import { formatDate, formatPLN } from '@/lib/format';
import type { GameRow } from '@/types/database';
import { discSummary, TRI_STATE_LABEL } from './labels';

interface GameDetailsProps {
  game: GameRow;
  /** Przyciski administratora (edycja, usuwanie, zmiana stanu). */
  actions?: ReactNode;
  /** Edytor stanu wyświetlany pod oceną, gdy jest otwarty. */
  conditionEditor?: ReactNode;
  coverUrl?: string | null;
}

function Facts({ title, rows }: { title: string; rows: ReadonlyArray<[string, ReactNode]> }) {
  return (
    <section className="rounded-card border border-line bg-surface/50 p-5">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="min-w-0 break-words">{value ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const text = (v: string | number | null): string => (v === null || v === '' ? '—' : String(v));

export function GameDetails({ game, actions, conditionEditor, coverUrl }: GameDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          {coverUrl ? (
            <img src={coverUrl} alt={`Okładka: ${game.title}`} className="aspect-[5/7] w-full object-cover" />
          ) : (
            <div role="img" aria-label="Brak okładki" className="grid aspect-[5/7] w-full place-items-center bg-raised text-muted">
              <ImageOff className="h-12 w-12" aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <h1 className="text-3xl font-semibold leading-tight">{game.title}</h1>
            {game.edition && <p className="mt-1 text-lg text-muted">{game.edition}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ConditionBadge value={game.condition} showLabel />
            {game.release_year && <span className="text-sm text-muted">Rok wydania: {game.release_year}</span>}
          </div>
          {conditionEditor}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          {game.external_url && (
            <a
              href={game.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Strona o grze
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Facts
          title="Wydanie"
          rows={[
            ['EAN', text(game.ean)],
            ['Język', text(game.language)],
            ['Producent', text(game.developer)],
            ['Wydawca', text(game.publisher)],
            ['Polski wydawca', text(game.polish_publisher)],
          ]}
        />
        <Facts
          title="Zawartość pudełka"
          rows={[
            ['Okładka zewnętrzna', TRI_STATE_LABEL[game.outer_sleeve]],
            ['Płyty', discSummary(game.disc_type, game.disc_count) ?? '—'],
            ['Instrukcja', TRI_STATE_LABEL[game.manual]],
            ['Poradnik', TRI_STATE_LABEL[game.strategy_guide]],
            ['Plakat lub mapa', TRI_STATE_LABEL[game.poster_map]],
            ['Inne', text(game.other_contents)],
          ]}
        />
        <Facts
          title="Zakup"
          rows={[
            ['Cena', formatPLN(game.purchase_price)],
            ['Data zakupu', formatDate(game.purchase_date)],
          ]}
        />
        {game.notes && (
          <section className="rounded-card border border-line bg-surface/50 p-5">
            <h2 className="mb-3 text-base font-semibold">Notatki</h2>
            <p className="whitespace-pre-wrap break-words text-sm">{game.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}
