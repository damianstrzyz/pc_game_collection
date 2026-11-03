import type { DiscType, GameInsert, GameRow, TriState } from '@/types/database';

/** Wartości formularza trzymamy jako tekst, a dopiero przy zapisie zamieniamy na typy bazy. */
export interface GameFormValues {
  title: string;
  edition: string;
  releaseYear: string;
  language: string;
  developer: string;
  publisher: string;
  polishPublisher: string;
  ean: string;
  outerSleeve: TriState;
  discCount: string;
  discType: DiscType | '';
  manual: TriState;
  strategyGuide: TriState;
  posterMap: TriState;
  otherContents: string;
  purchasePrice: string;
  purchaseDate: string;
  condition: number | null;
  notes: string;
  externalUrl: string;
}

export type FieldErrors = Partial<Record<keyof GameFormValues, string>>;

export const EMPTY_FORM: GameFormValues = {
  title: '',
  edition: '',
  releaseYear: '',
  language: '',
  developer: '',
  publisher: '',
  polishPublisher: '',
  ean: '',
  outerSleeve: 'unknown',
  discCount: '',
  discType: '',
  manual: 'unknown',
  strategyGuide: 'unknown',
  posterMap: 'unknown',
  otherContents: '',
  purchasePrice: '',
  purchaseDate: '',
  condition: null,
  notes: '',
  externalUrl: '',
};

export function formFromGame(g: GameRow): GameFormValues {
  return {
    title: g.title,
    edition: g.edition ?? '',
    releaseYear: g.release_year?.toString() ?? '',
    language: g.language ?? '',
    developer: g.developer ?? '',
    publisher: g.publisher ?? '',
    polishPublisher: g.polish_publisher ?? '',
    ean: g.ean ?? '',
    outerSleeve: g.outer_sleeve,
    discCount: g.disc_count?.toString() ?? '',
    discType: g.disc_type ?? '',
    manual: g.manual,
    strategyGuide: g.strategy_guide,
    posterMap: g.poster_map,
    otherContents: g.other_contents ?? '',
    purchasePrice: g.purchase_price === null ? '' : String(g.purchase_price).replace('.', ','),
    purchaseDate: g.purchase_date ?? '',
    condition: g.condition,
    notes: g.notes ?? '',
    externalUrl: g.external_url ?? '',
  };
}

export const normalizeEan = (raw: string): string => raw.replace(/[\s-]/g, '');

/** Akceptuje przecinek lub kropkę, maks. 2 miejsca po przecinku. Zwraca null dla pustego lub błędnego. */
export function parsePrice(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(s)) return null;
  return Number(s);
}

function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Reguły odpowiadają ograniczeniom CHECK w bazie (0001_init.sql). */
export function validateGameForm(v: GameFormValues): FieldErrors {
  const e: FieldErrors = {};
  const title = v.title.trim();
  if (!title) e.title = 'Podaj tytuł gry.';
  else if (title.length > 300) e.title = 'Tytuł może mieć maksymalnie 300 znaków.';

  if (v.edition.length > 300) e.edition = 'Maksymalnie 300 znaków.';
  if (v.language.length > 100) e.language = 'Maksymalnie 100 znaków.';
  if (v.developer.length > 200) e.developer = 'Maksymalnie 200 znaków.';
  if (v.publisher.length > 200) e.publisher = 'Maksymalnie 200 znaków.';
  if (v.polishPublisher.length > 200) e.polishPublisher = 'Maksymalnie 200 znaków.';

  if (v.releaseYear.trim()) {
    const y = Number(v.releaseYear);
    if (!/^\d{4}$/.test(v.releaseYear.trim()) || y < 1970 || y > 2100) e.releaseYear = 'Podaj rok z zakresu 1970–2100.';
  }

  const ean = normalizeEan(v.ean);
  if (ean && !/^\d{8,14}$/.test(ean)) e.ean = 'EAN to 8–14 cyfr (same cyfry, bez liter).';

  if (v.discCount.trim()) {
    const n = Number(v.discCount);
    if (!/^\d+$/.test(v.discCount.trim()) || n < 1 || n > 99) e.discCount = 'Podaj liczbę płyt od 1 do 99.';
  }
  if (v.otherContents.length > 2000) e.otherContents = 'Maksymalnie 2000 znaków.';

  if (v.purchasePrice.trim() && parsePrice(v.purchasePrice) === null) {
    e.purchasePrice = 'Podaj cenę w PLN, np. 49,99 (bez ujemnych wartości).';
  }
  if (v.purchaseDate && !isValidDate(v.purchaseDate)) e.purchaseDate = 'Podaj poprawną datę.';

  if (v.condition !== null && (!Number.isInteger(v.condition) || v.condition < 1 || v.condition > 11)) {
    e.condition = 'Stan musi mieścić się w skali 1–11.';
  }
  if (v.notes.length > 10000) e.notes = 'Maksymalnie 10 000 znaków.';
  if (v.externalUrl.trim()) {
    if (!isHttpUrl(v.externalUrl.trim())) e.externalUrl = 'Podaj pełny adres zaczynający się od http:// lub https://.';
    else if (v.externalUrl.trim().length > 2000) e.externalUrl = 'Adres jest zbyt długi.';
  }
  return e;
}

const orNull = (s: string): string | null => (s.trim() === '' ? null : s.trim());

/** Zakłada, że walidacja przeszła. Puste pola zapisujemy jako NULL. */
export function toGameInsert(v: GameFormValues): GameInsert {
  return {
    title: v.title.trim(),
    edition: orNull(v.edition),
    release_year: v.releaseYear.trim() ? Number(v.releaseYear) : null,
    language: orNull(v.language),
    developer: orNull(v.developer),
    publisher: orNull(v.publisher),
    polish_publisher: orNull(v.polishPublisher),
    ean: normalizeEan(v.ean) || null,
    outer_sleeve: v.outerSleeve,
    disc_count: v.discCount.trim() ? Number(v.discCount) : null,
    disc_type: v.discType === '' ? null : v.discType,
    manual: v.manual,
    strategy_guide: v.strategyGuide,
    poster_map: v.posterMap,
    other_contents: orNull(v.otherContents),
    purchase_price: parsePrice(v.purchasePrice),
    purchase_date: v.purchaseDate || null,
    condition: v.condition,
    notes: orNull(v.notes),
    external_url: orNull(v.externalUrl),
  };
}
