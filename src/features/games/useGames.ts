import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GameInsert, GameUpdate } from '@/types/database';
import { queryKeys } from '@/lib/queryClient';
import type { CatalogFilters } from './catalogParams';
import { removeGameFolder } from './photosApi';
import { createGame, deleteGame, fetchFilterOptions, fetchGame, fetchGames, updateGame } from './gamesApi';

export function useCatalog(filters: CatalogFilters) {
  return useQuery({
    queryKey: [...queryKeys.games, 'list', filters],
    queryFn: () => fetchGames(filters),
    // Poprzednia strona wyników zostaje widoczna w trakcie ładowania nowej.
    placeholderData: keepPreviousData,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: [...queryKeys.games, 'filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60_000,
  });
}

export function useGame(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.game(id) : [...queryKeys.games, 'none'],
    queryFn: () => fetchGame(id as string),
    enabled: Boolean(id),
  });
}

/** Wszystkie klucze gier zaczynają się od ['games'], więc jedno unieważnienie odświeża listy, szczegóły i filtry. */
function useInvalidateGames() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.games }),
      qc.invalidateQueries({ queryKey: queryKeys.stats }),
    ]);
}

export function useCreateGame() {
  const invalidate = useInvalidateGames();
  return useMutation({ mutationFn: (input: GameInsert) => createGame(input), onSuccess: invalidate });
}

export function useUpdateGame() {
  const invalidate = useInvalidateGames();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: GameUpdate }) => updateGame(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteGame() {
  const invalidate = useInvalidateGames();
  return useMutation({ mutationFn: async (id: string) => {
      await deleteGame(id); // wiersze game_photos znikają kaskadowo
      await removeGameFolder(id); // sprzątanie plików (błędy tylko logowane)
    },
    onSuccess: invalidate, });
}
