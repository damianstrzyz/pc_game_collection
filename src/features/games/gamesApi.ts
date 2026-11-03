import { supabase } from '@/lib/supabase';
import type { FilterOptions, GameInsert, GameRow, GameUpdate } from '@/types/database';
import { PAGE_SIZE, type CatalogFilters } from './catalogParams';

const CARD_COLUMNS =
  'id,title,edition,release_year,disc_type,disc_count,purchase_price,condition,cover_image' as const;

export type CatalogGame = Pick<
  GameRow,
  'id' | 'title' | 'edition' | 'release_year' | 'disc_type' | 'disc_count' | 'purchase_price' | 'condition' | 'cover_image'
>;

export interface CatalogResult {
  games: CatalogGame[];
  total: number;
  pageCount: number;
}

/** Usuwa znaki specjalne składni PostgREST i wzorców LIKE; wyszukiwanie jest zwykłym tekstem. */
export function sanitizeSearch(raw: string): string {
  return raw.replace(/[%_\\",()*]/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function fetchGames(f: CatalogFilters): Promise<CatalogResult> {
  let query = supabase.from('games').select(CARD_COLUMNS, { count: 'exact' });

  const term = sanitizeSearch(f.q);
  if (term) {
    const pattern = `%${term}%`;
    query = query.or(`title.ilike."${pattern}",edition.ilike."${pattern}",ean.ilike."${pattern}"`);
  }
  if (f.year !== null) query = query.eq('release_year', f.year);
  if (f.developer) query = query.eq('developer', f.developer);
  if (f.publisher) query = query.eq('publisher', f.publisher);
  if (f.polishPublisher) query = query.eq('polish_publisher', f.polishPublisher);
  if (f.language) query = query.eq('language', f.language);
  if (f.discType) query = query.eq('disc_type', f.discType);
  if (f.discCount !== null) query = query.eq('disc_count', f.discCount);
  if (f.conditionMin !== null) query = query.gte('condition', f.conditionMin);
  if (f.conditionMax !== null) query = query.lte('condition', f.conditionMax);

  // Puste wartości zawsze na końcu; tytuł i id zapewniają stabilną kolejność między stronami.
  query = query.order(f.sort, { ascending: f.dir === 'asc', nullsFirst: false });
  if (f.sort !== 'title') query = query.order('title', { ascending: true });
  query = query.order('id', { ascending: true });

  const from = (f.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return { games: data, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const { data, error } = await supabase.rpc('get_filter_options');
  if (error) throw new Error(error.message);
  return data;
}

/** Rzucany, gdy EAN jest już w kolekcji (unikalny indeks games_ean_key). */
export class DuplicateEanError extends Error {
  constructor() {
    super('Gra z tym numerem EAN już istnieje w kolekcji.');
    this.name = 'DuplicateEanError';
  }
}

function toError(error: { code?: string; message: string }): Error {
  if (error.code === '23505' && error.message.includes('games_ean_key')) return new DuplicateEanError();
  return new Error(error.message);
}

export async function fetchGame(id: string): Promise<GameRow | null> {
  const { data, error } = await supabase.from('games').select('*').eq('id', id).maybeSingle();
  if (error) {
    if (error.code === '22P02') return null; // nieprawidłowy UUID w adresie
    throw new Error(error.message);
  }
  return data;
}

export async function createGame(input: GameInsert): Promise<GameRow> {
  const { data, error } = await supabase.from('games').insert(input).select('*').single();
  if (error) throw toError(error);
  return data;
}

export async function updateGame(id: string, input: GameUpdate): Promise<GameRow> {
  const { data, error } = await supabase.from('games').update(input).eq('id', id).select('*').single();
  if (error) throw toError(error);
  return data;
}

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
