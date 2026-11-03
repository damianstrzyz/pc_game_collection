import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import type { WishlistInsert } from '@/types/database';
import {
  addWishlistItem,
  fetchWishlist,
  moveToCollection,
  removeWishlistItem,
  searchGamesForLink,
  updateWishlistItem,
  type MoveToCollectionArgs,
} from './wishlistApi';

export function useWishlist() {
  return useQuery({ queryKey: queryKeys.wishlist, queryFn: fetchWishlist });
}

export function useAddWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WishlistInsert) => addWishlistItem(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wishlist }),
  });
}

export function useUpdateWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<WishlistInsert> }) => updateWishlistItem(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wishlist }),
  });
}

export function useRemoveWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeWishlistItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wishlist }),
  });
}

/** Przeniesienie zmienia obie strony: znika z listy życzeń, pojawia się w kolekcji i statystykach. */
export function useMoveToCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: MoveToCollectionArgs) => moveToCollection(args),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.wishlist }),
        qc.invalidateQueries({ queryKey: queryKeys.games }),
        qc.invalidateQueries({ queryKey: queryKeys.stats }),
      ]),
  });
}

export function useLinkableGames(term: string) {
  return useQuery({
    queryKey: [...queryKeys.games, 'link-search', term],
    queryFn: () => searchGamesForLink(term),
    enabled: term.trim().length >= 2,
    staleTime: 30_000,
  });
}
