import { GameCard, type GameCardData, type GameCardLayout } from './GameCard';

interface GameGridProps<T extends GameCardData> {
  games: readonly T[];
  view?: GameCardLayout;
  /** Zwraca adres miniatury okładki (podpisany URL ze Storage) albo null. */
  getCoverUrl?: (game: T) => string | null | undefined;
}

export function GameGrid<T extends GameCardData>({ games, view = 'grid', getCoverUrl }: GameGridProps<T>) {
  const className =
    view === 'grid'
      ? 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
      : 'flex flex-col gap-2';

  return (
    <div className={className}>
      {games.map((game) => (
        <GameCard key={game.id} game={game} layout={view} coverUrl={getCoverUrl?.(game)} />
      ))}
    </div>
  );
}
