import { ArrowDown, ArrowUp, LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react';
import { SORT_OPTIONS, type SortDir, type SortKey } from './catalogParams';
import type { GameCardLayout } from './GameCard';

interface CatalogToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortKey;
  dir: SortDir;
  onSortChange: (sort: SortKey, dir: SortDir) => void;
  view: GameCardLayout;
  onViewChange: (view: GameCardLayout) => void;
  activeFilters: number;
  onOpenFilters: () => void;
}

const iconBtn = 'grid h-10 w-10 place-items-center rounded-xl border border-line transition-colors';

export function CatalogToolbar(p: CatalogToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[12rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={p.search}
          onChange={(e) => p.onSearchChange(e.target.value)}
          placeholder="Tytuł, EAN lub edycja…"
          aria-label="Szukaj w kolekcji"
          className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-sm placeholder:text-muted focus:border-accent/60"
        />
      </div>

      <select
        value={p.sort}
        onChange={(e) => p.onSortChange(e.target.value as SortKey, p.dir)}
        aria-label="Sortuj według"
        className="h-10 rounded-xl border border-line bg-surface px-3 text-sm"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            Sortuj: {o.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => p.onSortChange(p.sort, p.dir === 'asc' ? 'desc' : 'asc')}
        aria-label={p.dir === 'asc' ? 'Kolejność rosnąca, kliknij aby odwrócić' : 'Kolejność malejąca, kliknij aby odwrócić'}
        className={`${iconBtn} text-muted hover:text-ink`}
      >
        {p.dir === 'asc' ? <ArrowUp className="h-4 w-4" aria-hidden /> : <ArrowDown className="h-4 w-4" aria-hidden />}
      </button>

      <div role="group" aria-label="Widok" className="flex gap-1">
        <button
          type="button"
          onClick={() => p.onViewChange('grid')}
          aria-pressed={p.view === 'grid'}
          aria-label="Widok siatki"
          className={`${iconBtn} ${p.view === 'grid' ? 'border-accent text-accent' : 'text-muted hover:text-ink'}`}
        >
          <LayoutGrid className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => p.onViewChange('list')}
          aria-pressed={p.view === 'list'}
          aria-label="Widok listy"
          className={`${iconBtn} ${p.view === 'list' ? 'border-accent text-accent' : 'text-muted hover:text-ink'}`}
        >
          <List className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <button
        type="button"
        onClick={p.onOpenFilters}
        className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm text-muted hover:text-ink lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filtry{p.activeFilters > 0 && <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-bg">{p.activeFilters}</span>}
      </button>
    </div>
  );
}
