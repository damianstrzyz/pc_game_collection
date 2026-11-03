import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Library, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GameGridSkeleton } from '@/components/ui/LoadingSkeleton';
import { MobileFiltersDrawer } from '@/components/ui/MobileFiltersDrawer';
import { Pagination } from '@/components/ui/Pagination';
import { CatalogFilters } from '@/features/games/CatalogFilters';
import { CatalogToolbar } from '@/features/games/CatalogToolbar';
import { GameGrid } from '@/features/games/GameGrid';
import {
  DEFAULT_FILTERS,
  countActiveFilters,
  hasAnyCriteria,
  parseFilters,
  toSearchParams,
  type CatalogFilters as Filters,
} from '@/features/games/catalogParams';
import { useCatalog, useFilterOptions } from '@/features/games/useGames';
import { useViewMode } from '@/features/games/useViewMode';
import { thumbPath } from '@/features/games/photosApi';
import { useSignedUrls } from '@/features/games/usePhotos';
import { pluralGames } from '@/lib/format';
import { useDebounce } from '@/lib/useDebounce';

const SEARCH_DEBOUNCE_MS = 300;

export default function CollectionPage() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const [view, setView] = useViewMode();
  const [drawerOpen, setDrawerOpen] = useState(false);

  /** Zmiana kryteriów resetuje stronę do 1, chyba że zmieniamy samą stronę. */
  const update = useCallback(
    (patch: Partial<Filters>, replace = false) => {
      setParams(
        (prev) => {
          const next = { ...parseFilters(prev), ...patch };
          if (!('page' in patch)) next.page = 1;
          return toSearchParams(next);
        },
        { replace },
      );
    },
    [setParams],
  );

  // --- Wyszukiwanie z opóźnieniem (debounce) ---
  const [search, setSearch] = useState(filters.q);
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const currentQ = useRef(filters.q);
  currentQ.current = filters.q;

  useEffect(() => {
    if (debouncedSearch !== currentQ.current) update({ q: debouncedSearch }, true);
  }, [debouncedSearch, update]);

  // Zmiana q z zewnątrz (pole w nagłówku, wyczyszczenie filtrów) aktualizuje pole tutaj.
  useEffect(() => {
    if (filters.q !== debouncedSearch) setSearch(filters.q);
  }, [filters.q]);

  const { data, isLoading, isError, error, refetch, isFetching, isPlaceholderData } = useCatalog(filters);
  const { data: options } = useFilterOptions();

  const coverPaths = (data?.games ?? []).flatMap((g) => (g.cover_image ? [thumbPath(g.cover_image)] : []));
  const { data: coverUrls } = useSignedUrls(coverPaths);

  // Strona poza zakresem (np. po usunięciu gier) wraca na ostatnią dostępną.
  useEffect(() => {
    if (data && !isPlaceholderData && filters.page > data.pageCount) update({ page: data.pageCount }, true);
  }, [data, isPlaceholderData, filters.page, update]);

  const activeFilters = countActiveFilters(filters);
  const clearAll = () => {
    setSearch('');
    setParams(toSearchParams({ ...DEFAULT_FILTERS, sort: filters.sort, dir: filters.dir }));
  };

  const changePage = (page: number) => {
    update({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterPanel = <CatalogFilters filters={filters} options={options} onChange={(patch) => update(patch)} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold">Moja kolekcja</h1>
        {data && <p className="text-sm text-muted">{pluralGames(data.total)}</p>}
      </div>

      <CatalogToolbar
        search={search}
        onSearchChange={setSearch}
        sort={filters.sort}
        dir={filters.dir}
        onSortChange={(sort, dir) => update({ sort, dir })}
        view={view}
        onViewChange={setView}
        activeFilters={activeFilters}
        onOpenFilters={() => setDrawerOpen(true)}
      />

      <section aria-label="Filtry" className="hidden rounded-card border border-line bg-surface/50 p-4 lg:block">
        {filterPanel}
        {hasAnyCriteria(filters) && (
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={clearAll}>
              Wyczyść filtry
            </Button>
          </div>
        )}
      </section>

      <MobileFiltersDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onClear={clearAll}>
        {filterPanel}
      </MobileFiltersDrawer>

      {isLoading ? (
        <GameGridSkeleton />
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Nie udało się wczytać kolekcji"
          description={error instanceof Error ? error.message : 'Spróbuj ponownie za chwilę.'}
          action={<Button onClick={() => void refetch()}>Spróbuj ponownie</Button>}
        />
      ) : data && data.games.length === 0 ? (
        hasAnyCriteria(filters) ? (
          <EmptyState
            icon={SearchX}
            title="Brak gier spełniających kryteria"
            description="Zmień wyszukiwaną frazę lub usuń część filtrów."
            action={<Button variant="primary" onClick={clearAll}>Wyczyść filtry</Button>}
          />
        ) : (
          <EmptyState
            icon={Library}
            title="Twoja kolekcja jest pusta"
            description="Dodaj pierwszą grę, aby zacząć katalogować kolekcję."
            action={
              <Link to="/dodaj" className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-bg">
                Dodaj grę
              </Link>
            }
          />
        )
      ) : data ? (
        <div className={isFetching && isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <GameGrid
            games={data.games}
            view={view}
            getCoverUrl={(g) => (g.cover_image ? coverUrls?.[thumbPath(g.cover_image)] : null)}
          />
          <div className="mt-8">
            <Pagination page={filters.page} pageCount={data.pageCount} onChange={changePage} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
