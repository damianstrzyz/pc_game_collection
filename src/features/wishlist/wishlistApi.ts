import { supabase } from '@/lib/supabase';
import { sanitizeSearch } from '@/features/games/gamesApi';
import type { WishlistInsert, WishlistRow } from '@/types/database';

export interface WishlistItem extends WishlistRow {
  /** Tytuł powiązanej gry z kolekcji (jeśli pozycja jest z nią połączona). */
  linked_title: string | null;
}

export class DuplicateWishlistError extends Error {
  constructor() {
    super('Ta gra jest już na liście życzeń.');
    this.name = 'DuplicateWishlistError';
  }
}

function toError(error: { code?: string; message: string }): Error {
  if (error.code === '23505' && error.message.includes('wishlist_title_unique_idx')) return new DuplicateWishlistError();
  return new Error(error.message);
}

export async function fetchWishlist(): Promise<WishlistItem[]> {
  const { data, error } = await supabase.from('wishlist').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const ids = Array.from(new Set(data.flatMap((w) => (w.game_id ? [w.game_id] : []))));
  const titles = new Map<string, string>();
  if (ids.length > 0) {
    const { data: games, error: gamesError } = await supabase.from('games').select('id,title').in('id', ids);
    if (gamesError) throw new Error(gamesError.message);
    for (const g of games) titles.set(g.id, g.title);
  }
  return data.map((w) => ({ ...w, linked_title: w.game_id ? (titles.get(w.game_id) ?? null) : null }));
}

export async function addWishlistItem(input: WishlistInsert): Promise<WishlistRow> {
  const { data, error } = await supabase.from('wishlist').insert(input).select('*').single();
  if (error) throw toError(error);
  return data;
}

export async function updateWishlistItem(id: string, input: Partial<WishlistInsert>): Promise<WishlistRow> {
  const { data, error } = await supabase.from('wishlist').update(input).eq('id', id).select('*').single();
  if (error) throw toError(error);
  return data;
}

export async function removeWishlistItem(id: string): Promise<void> {
  const { error } = await supabase.from('wishlist').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export interface MoveToCollectionArgs {
  wishlistId: string;
  purchasePrice: number | null;
  purchaseDate: string | null;
  condition: number | null;
}

/** Jedna transakcja w bazie: tworzy grę w kolekcji i usuwa pozycję z listy życzeń. Zwraca id nowej gry. */
export async function moveToCollection(args: MoveToCollectionArgs): Promise<string> {
  const { data, error } = await supabase.rpc('move_wishlist_to_collection', {
    p_wishlist_id: args.wishlistId,
    p_purchase_price: args.purchasePrice,
    p_purchase_date: args.purchaseDate,
    p_condition: args.condition,
  });
  if (error) throw new Error(error.message);
  return data;
}

export interface LinkableGame {
  id: string;
  title: string;
  edition: string | null;
}

export async function searchGamesForLink(term: string): Promise<LinkableGame[]> {
  const clean = sanitizeSearch(term);
  if (clean.length < 2) return [];
  const { data, error } = await supabase
    .from('games')
    .select('id,title,edition')
    .ilike('title', `%${clean}%`)
    .order('title', { ascending: true })
    .limit(8);
  if (error) throw new Error(error.message);
  return data;
}
