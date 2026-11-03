import { supabase } from '@/lib/supabase';
import type { GameInsert, GamePhotoRow, GameRow, WishlistRow } from '@/types/database';
import type { ExistingKeys } from './importMapping';
import { existingTitleKey } from './importMapping';

const PAGE = 1000; // domyślny limit wierszy PostgREST

async function collect<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const chunk = data ?? [];
    all.push(...chunk);
    if (chunk.length < PAGE) return all;
  }
}

export const fetchAllGames = (): Promise<GameRow[]> =>
  collect((f, t) => supabase.from('games').select('*').order('created_at', { ascending: true }).order('id', { ascending: true }).range(f, t));

export const fetchAllPhotos = (): Promise<GamePhotoRow[]> =>
  collect((f, t) => supabase.from('game_photos').select('*').order('game_id', { ascending: true }).order('sort_order', { ascending: true }).order('id', { ascending: true }).range(f, t));

export const fetchAllWishlist = (): Promise<WishlistRow[]> =>
  collect((f, t) => supabase.from('wishlist').select('*').order('created_at', { ascending: true }).order('id', { ascending: true }).range(f, t));

export async function fetchExistingKeys(): Promise<ExistingKeys> {
  const rows = await collect((f, t) => supabase.from('games').select('id,ean,title,edition').order('id', { ascending: true }).range(f, t));
  const eans = new Set<string>();
  const titles = new Set<string>();
  for (const r of rows) {
    if (r.ean) eans.add(r.ean);
    titles.add(existingTitleKey(r.title, r.edition ?? ''));
  }
  return { eans, titles };
}

export interface InsertFailure {
  title: string;
  message: string;
}

export interface InsertResult {
  imported: number;
  failures: InsertFailure[];
}


/** Wstawia paczkami po 100; gdy paczka się nie powiedzie, ponawia wiersz po wierszu, by wskazać winnych. */
export async function insertGames(items: readonly GameInsert[], onProgress: (done: number, total: number) => void): Promise<InsertResult> {
  const CHUNK = 100;
  let imported = 0;
  const failures: InsertFailure[] = [];

  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const { error } = await supabase.from('games').insert(chunk);
    if (!error) {
      imported += chunk.length;
    } else {
      for (const item of chunk) {
        const single = await supabase.from('games').insert(item);
        if (single.error) {
          const dup = single.error.code === '23505' && single.error.message.includes('games_ean_key');
          failures.push({ title: item.title, message: dup ? 'EAN już istnieje w kolekcji.' : single.error.message });
        } else imported += 1;
      }
    }
    onProgress(Math.min(i + CHUNK, items.length), items.length);
  }
  return { imported, failures };
}
