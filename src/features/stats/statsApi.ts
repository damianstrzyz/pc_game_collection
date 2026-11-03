import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import type { CollectionStats } from '@/types/stats';

export async function fetchCollectionStats(): Promise<CollectionStats> {
  const { data, error } = await supabase.rpc('get_collection_stats');
  if (error) throw new Error(error.message);
  return data;
}

/** Wspólny cache dla dashboardu i statystyk; unieważniany po każdej zmianie w kolekcji. */
export function useCollectionStats() {
  return useQuery({ queryKey: queryKeys.stats, queryFn: fetchCollectionStats });
}
