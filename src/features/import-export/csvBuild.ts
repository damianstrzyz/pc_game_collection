import { DISC_TYPE_LABEL, TRI_STATE_LABEL } from '@/features/games/labels';
import type { GameRow } from '@/types/database';
import { stringifyCsv } from './csv';
import { CSV_COLUMNS } from './csvColumns';

function gameToCells(g: GameRow): string[] {
  const text = (v: string | number | null): string => (v === null ? '' : String(v));
  const byKey: Record<string, string> = {
    title: g.title,
    edition: text(g.edition),
    releaseYear: text(g.release_year),
    language: text(g.language),
    developer: text(g.developer),
    publisher: text(g.publisher),
    polishPublisher: text(g.polish_publisher),
    ean: text(g.ean),
    outerSleeve: TRI_STATE_LABEL[g.outer_sleeve],
    discCount: text(g.disc_count),
    discType: g.disc_type ? DISC_TYPE_LABEL[g.disc_type] : '',
    manual: TRI_STATE_LABEL[g.manual],
    strategyGuide: TRI_STATE_LABEL[g.strategy_guide],
    posterMap: TRI_STATE_LABEL[g.poster_map],
    otherContents: text(g.other_contents),
    purchasePrice: g.purchase_price === null ? '' : String(g.purchase_price).replace('.', ','),
    purchaseDate: text(g.purchase_date),
    condition: text(g.condition),
    notes: text(g.notes),
    externalUrl: text(g.external_url),
  };
  return CSV_COLUMNS.map((c) => byKey[c.key] ?? '');
}

/** CSV z BOM (UTF-8) i średnikiem, żeby polski Excel poprawnie wyświetlił polskie znaki i kolumny. */
export function buildCsv(games: readonly GameRow[]): string {
  return '\uFEFF' + stringifyCsv([CSV_COLUMNS.map((c) => c.header), ...games.map(gameToCells)]);
}

export function buildTemplateCsv(): string {
  const example: Record<string, string> = {
    title: 'Przykładowa gra', edition: 'Edycja kolekcjonerska', releaseYear: '2007', language: 'polski', developer: 'Studio',
    publisher: 'Wydawca', polishPublisher: 'Polski wydawca', ean: '5908305200000', outerSleeve: 'Tak', discCount: '2',
    discType: 'DVD', manual: 'Tak', strategyGuide: 'Nie', posterMap: 'Nie wiem', otherContents: 'Soundtrack',
    purchasePrice: '49,99', purchaseDate: '2024-05-17', condition: '9', notes: 'Drobne otarcia pudełka', externalUrl: 'https://example.com',
  };
  return '\uFEFF' + stringifyCsv([CSV_COLUMNS.map((c) => c.header), CSV_COLUMNS.map((c) => example[c.key] ?? '')]);
}
