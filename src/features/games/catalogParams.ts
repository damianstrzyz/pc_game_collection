import type { DiscType } from '@/types/database';

export const PAGE_SIZE = 24;

export type SortKey = 'title' | 'release_year' | 'purchase_price' | 'purchase_date' | 'condition';
export type SortDir = 'asc' | 'desc';

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'title', label: 'Tytuł' },
  { value: 'release_year', label: 'Rok wydania' },
  { value: 'purchase_price', label: 'Cena zakupu' },
  { value: 'purchase_date', label: 'Data zakupu' },
  { value: 'condition', label: 'Stan' },
];

const DISC_TYPES: readonly DiscType[] = ['DVD', 'CD', 'DVD+CD', 'other'];

export interface CatalogFilters {
  q: string;
  year: number | null;
  developer: string;
  publisher: string;
  polishPublisher: string;
  language: string;
  discType: DiscType | null;
  discCount: number | null;
  conditionMin: number | null;
  conditionMax: number | null;
  sort: SortKey;
  dir: SortDir;
  page: number;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  q: '',
  year: null,
  developer: '',
  publisher: '',
  polishPublisher: '',
  language: '',
  discType: null,
  discCount: null,
  conditionMin: null,
  conditionMax: null,
  sort: 'title',
  dir: 'asc',
  page: 1,
};

function intParam(value: string | null, min: number, max: number): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n >= min && n <= max ? n : null;
}

export function parseFilters(params: URLSearchParams): CatalogFilters {
  const sort = params.get('sort');
  const disc = params.get('disc');
  return {
    q: params.get('q')?.slice(0, 100) ?? '',
    year: intParam(params.get('year'), 1970, 2100),
    developer: params.get('dev') ?? '',
    publisher: params.get('pub') ?? '',
    polishPublisher: params.get('plpub') ?? '',
    language: params.get('lang') ?? '',
    discType: DISC_TYPES.find((t) => t === disc) ?? null,
    discCount: intParam(params.get('discs'), 1, 99),
    conditionMin: intParam(params.get('cmin'), 1, 11),
    conditionMax: intParam(params.get('cmax'), 1, 11),
    sort: SORT_OPTIONS.find((o) => o.value === sort)?.value ?? DEFAULT_FILTERS.sort,
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
    page: intParam(params.get('page'), 1, 100000) ?? 1,
  };
}

/** Zapisuje tylko wartości różne od domyślnych, żeby adresy były krótkie. */
export function toSearchParams(f: CatalogFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.year !== null) p.set('year', String(f.year));
  if (f.developer) p.set('dev', f.developer);
  if (f.publisher) p.set('pub', f.publisher);
  if (f.polishPublisher) p.set('plpub', f.polishPublisher);
  if (f.language) p.set('lang', f.language);
  if (f.discType) p.set('disc', f.discType);
  if (f.discCount !== null) p.set('discs', String(f.discCount));
  if (f.conditionMin !== null) p.set('cmin', String(f.conditionMin));
  if (f.conditionMax !== null) p.set('cmax', String(f.conditionMax));
  if (f.sort !== DEFAULT_FILTERS.sort) p.set('sort', f.sort);
  if (f.dir !== DEFAULT_FILTERS.dir) p.set('dir', f.dir);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
}

/** Liczba aktywnych filtrów (bez wyszukiwania, sortowania i strony). */
export function countActiveFilters(f: CatalogFilters): number {
  return [
    f.year !== null,
    f.developer !== '',
    f.publisher !== '',
    f.polishPublisher !== '',
    f.language !== '',
    f.discType !== null,
    f.discCount !== null,
    f.conditionMin !== null,
    f.conditionMax !== null,
  ].filter(Boolean).length;
}

export const hasAnyCriteria = (f: CatalogFilters): boolean => f.q !== '' || countActiveFilters(f) > 0;
