import type { GameFormValues } from '@/features/games/gameForm';

export interface CsvColumn {
  /** Klucz pola w formularzu gry. */
  key: keyof GameFormValues;
  /** Nagłówek w eksportowanym pliku. */
  header: string;
  /** Dodatkowe nazwy nagłówków akceptowane przy imporcie (np. nazwy kolumn bazy). */
  aliases: readonly string[];
}

export const CSV_COLUMNS: readonly CsvColumn[] = [
  { key: 'title', header: 'Tytuł', aliases: ['title', 'tytul'] },
  { key: 'edition', header: 'Edycja', aliases: ['edition'] },
  { key: 'releaseYear', header: 'Rok wydania', aliases: ['release_year', 'rok'] },
  { key: 'language', header: 'Język', aliases: ['language', 'jezyk'] },
  { key: 'developer', header: 'Producent', aliases: ['developer'] },
  { key: 'publisher', header: 'Wydawca', aliases: ['publisher'] },
  { key: 'polishPublisher', header: 'Polski wydawca', aliases: ['polish_publisher'] },
  { key: 'ean', header: 'EAN', aliases: ['ean'] },
  { key: 'outerSleeve', header: 'Okładka zewnętrzna', aliases: ['outer_sleeve'] },
  { key: 'discCount', header: 'Liczba płyt', aliases: ['disc_count'] },
  { key: 'discType', header: 'Rodzaj nośnika', aliases: ['disc_type', 'nosnik'] },
  { key: 'manual', header: 'Instrukcja', aliases: ['manual'] },
  { key: 'strategyGuide', header: 'Poradnik', aliases: ['strategy_guide'] },
  { key: 'posterMap', header: 'Plakat lub mapa', aliases: ['poster_map'] },
  { key: 'otherContents', header: 'Inna zawartość', aliases: ['other_contents'] },
  { key: 'purchasePrice', header: 'Cena zakupu (PLN)', aliases: ['purchase_price', 'cena'] },
  { key: 'purchaseDate', header: 'Data zakupu', aliases: ['purchase_date'] },
  { key: 'condition', header: 'Stan (1-11)', aliases: ['condition', 'stan'] },
  { key: 'notes', header: 'Notatki', aliases: ['notes'] },
  { key: 'externalUrl', header: 'Link', aliases: ['external_url', 'url'] },
];

export const FIELD_LABEL: Record<keyof GameFormValues, string> = Object.fromEntries(
  CSV_COLUMNS.map((c) => [c.key, c.header]),
) as Record<keyof GameFormValues, string>;

export const normalizeHeader = (h: string): string => h.replace(/^\uFEFF/, '').trim().toLowerCase();
