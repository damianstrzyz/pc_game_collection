import { buildCsv, buildTemplateCsv } from './csvBuild';
import { fetchAllGames, fetchAllPhotos, fetchAllWishlist } from './dataApi';
import { todayISO } from '@/lib/format';

export function download(filename: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportCsv(): Promise<number> {
  const games = await fetchAllGames();
  download(`kolekcja-gier-${todayISO()}.csv`, buildCsv(games), 'text/csv;charset=utf-8');
  return games.length;
}

/** Pełna kopia: gry, ścieżki zdjęć i lista życzeń. Same pliki zdjęć nie są w niej zawarte. */
export async function exportJson(): Promise<number> {
  const [games, photos, wishlist] = await Promise.all([fetchAllGames(), fetchAllPhotos(), fetchAllWishlist()]);
  const payload = { version: 1, exported_at: new Date().toISOString(), currency: 'PLN', games, game_photos: photos, wishlist };
  download(`kolekcja-gier-${todayISO()}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  return games.length;
}

export const downloadTemplate = (): void => download('kolekcja-gier-szablon.csv', buildTemplateCsv(), 'text/csv;charset=utf-8');
