import { parsePrice } from '@/features/games/gameForm';
import type { WishlistInsert } from '@/types/database';
import type { WishlistItem } from './wishlistApi';

export interface WishlistFormValues {
  title: string;
  targetPrice: string;
  notes: string;
  gameId: string | null;
  gameTitle: string | null;
}

export type WishlistErrors = Partial<Record<'title' | 'targetPrice' | 'notes', string>>;

export const EMPTY_WISHLIST_FORM: WishlistFormValues = { title: '', targetPrice: '', notes: '', gameId: null, gameTitle: null };

export function wishlistFormFromItem(item: WishlistItem): WishlistFormValues {
  return {
    title: item.title,
    targetPrice: item.target_price === null ? '' : String(item.target_price).replace('.', ','),
    notes: item.notes ?? '',
    gameId: item.game_id,
    gameTitle: item.linked_title,
  };
}

export const normalizeTitle = (t: string): string => t.trim().toLowerCase();

export function validateWishlistForm(v: WishlistFormValues): WishlistErrors {
  const e: WishlistErrors = {};
  const title = v.title.trim();
  if (!title) e.title = 'Podaj tytuł gry.';
  else if (title.length > 300) e.title = 'Tytuł może mieć maksymalnie 300 znaków.';
  if (v.targetPrice.trim() && parsePrice(v.targetPrice) === null) e.targetPrice = 'Podaj cenę w PLN, np. 79,99 (bez ujemnych wartości).';
  if (v.notes.length > 5000) e.notes = 'Maksymalnie 5000 znaków.';
  return e;
}

export function toWishlistInsert(v: WishlistFormValues): WishlistInsert {
  return {
    title: v.title.trim(),
    target_price: parsePrice(v.targetPrice),
    notes: v.notes.trim() === '' ? null : v.notes.trim(),
    game_id: v.gameId,
  };
}
