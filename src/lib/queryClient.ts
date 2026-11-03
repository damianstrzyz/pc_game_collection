import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
      // Bez połączenia zapytania mają się kończyć błędem (z przyciskiem „Spróbuj ponownie”),
      // zamiast wisieć wstrzymane bez żadnego komunikatu.
      networkMode: 'always',
    },
    mutations: { networkMode: 'always' },
  },
});

/** Jedno miejsce na klucze zapytań – ułatwia unieważnianie cache po zmianach. */
export const queryKeys = {
  games: ['games'] as const,
  game: (id: string) => ['games', id] as const,
  wishlist: ['wishlist'] as const,
  stats: ['stats'] as const,
};
