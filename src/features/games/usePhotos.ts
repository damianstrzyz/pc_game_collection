import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { fetchGamePhotos, fetchSignedUrls, savePhotoChanges, type ExistingPhotos, type PhotoChanges } from './photosApi';

export function useGamePhotos(gameId: string | undefined) {
  return useQuery({
    queryKey: gameId ? [...queryKeys.game(gameId), 'photos'] : [...queryKeys.games, 'photos-none'],
    queryFn: () => fetchGamePhotos(gameId as string),
    enabled: Boolean(gameId),
  });
}

/** Adresy ważne godzinę; cache odświeża je z zapasem, zanim wygasną. */
export function useSignedUrls(paths: readonly string[]) {
  const unique = Array.from(new Set(paths)).sort();
  return useQuery({
    queryKey: ['signed-urls', unique],
    queryFn: () => fetchSignedUrls(unique),
    enabled: unique.length > 0,
    staleTime: 45 * 60_000,
    gcTime: 55 * 60_000,
  });
}

export function useSavePhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { gameId: string; existing: ExistingPhotos; changes: PhotoChanges }) =>
      savePhotoChanges(args.gameId, args.existing, args.changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.games }),
  });
}
