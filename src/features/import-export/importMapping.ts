import { EMPTY_FORM, normalizeEan, toGameInsert, validateGameForm, type GameFormValues } from '@/features/games/gameForm';
import type { DiscType, GameInsert, TriState } from '@/types/database';
import { unprotectCell } from './csv';
import { CSV_COLUMNS, FIELD_LABEL, normalizeHeader } from './csvColumns';

export const MAX_IMPORT_ROWS = 5000;

export interface ImportRow {
  /** Numer wiersza w pliku (nagłówek = 1). */
  line: number;
  values: GameFormValues;
  insert: GameInsert | null;
  errors: string[];
  warnings: string[];
}

export interface ParsedImport {
  rows: ImportRow[];
  ignoredColumns: string[];
  titleColumnFound: boolean;
}

export interface ExistingKeys {
  eans: ReadonlySet<string>;
  /** Klucze „tytuł|edycja” małymi literami. */
  titles: ReadonlySet<string>;
}

const TRI: Record<string, TriState> = {
  tak: 'yes', t: 'yes', yes: 'yes', y: 'yes', true: 'yes', '1': 'yes',
  nie: 'no', n: 'no', no: 'no', false: 'no', '0': 'no',
  'nie wiem': 'unknown', nieznane: 'unknown', unknown: 'unknown', '?': 'unknown',
};

const DISC: Record<string, DiscType> = {
  dvd: 'DVD', cd: 'CD', 'dvd+cd': 'DVD+CD', 'dvd + cd': 'DVD+CD', inny: 'other', 'inny nośnik': 'other', other: 'other',
};

function parseDate(raw: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const pl = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(raw);
  const [y, m, d] = iso ? [iso[1], iso[2], iso[3]] : pl ? [pl[3], pl[2], pl[1]] : [undefined, undefined, undefined];
  if (!y || !m || !d) return null;
  const s = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const date = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === s ? s : null;
}

const existingTitleKey = (title: string, edition: string): string => `${title.trim().toLowerCase()}|${edition.trim().toLowerCase()}`;
export { existingTitleKey };

export function mapCsvRows(table: readonly string[][]): ParsedImport {
  const header = table[0] ?? [];
  const normalized = header.map(normalizeHeader);

  const indexByKey = new Map<string, number>();
  for (const col of CSV_COLUMNS) {
    const names = [col.header, ...col.aliases].map(normalizeHeader);
    const idx = normalized.findIndex((h) => names.includes(h));
    if (idx >= 0) indexByKey.set(col.key, idx);
  }
  const used = new Set(indexByKey.values());
  const ignoredColumns = header.filter((h, i) => h.trim() !== '' && !used.has(i)).map((h) => h.trim());

  const rows: ImportRow[] = table.slice(1).map((cells, i) => {
    const get = (key: keyof GameFormValues): string => {
      const idx = indexByKey.get(key);
      return idx === undefined ? '' : unprotectCell((cells[idx] ?? '').trim());
    };
    const errors: string[] = [];

    const tri = (key: 'outerSleeve' | 'manual' | 'strategyGuide' | 'posterMap'): TriState => {
      const raw = get(key);
      if (raw === '') return 'unknown';
      const parsed = TRI[raw.toLowerCase()];
      if (!parsed) errors.push(`${FIELD_LABEL[key]}: nieznana wartość „${raw}” (użyj Tak, Nie lub Nie wiem).`);
      return parsed ?? 'unknown';
    };

    let discType: DiscType | '' = '';
    const discRaw = get('discType');
    if (discRaw !== '') {
      const parsed = DISC[discRaw.toLowerCase()];
      if (parsed) discType = parsed;
      else errors.push(`${FIELD_LABEL.discType}: nieznana wartość „${discRaw}” (DVD, CD, DVD + CD lub Inny).`);
    }

    let purchaseDate = '';
    const dateRaw = get('purchaseDate');
    if (dateRaw !== '') {
      const parsed = parseDate(dateRaw);
      if (parsed) purchaseDate = parsed;
      else errors.push(`${FIELD_LABEL.purchaseDate}: nieprawidłowa data „${dateRaw}” (użyj RRRR-MM-DD lub DD.MM.RRRR).`);
    }

    let condition: number | null = null;
    const condRaw = get('condition');
    if (condRaw !== '') {
      if (/^\d+$/.test(condRaw)) condition = Number(condRaw);
      else errors.push(`${FIELD_LABEL.condition}: „${condRaw}” nie jest liczbą całkowitą 1–11.`);
    }

    const eanRaw = get('ean');
    if (/e\+?\d+$/i.test(eanRaw) && /^[\d.,]+e/i.test(eanRaw)) {
      errors.push(`${FIELD_LABEL.ean}: „${eanRaw}” wygląda na zapis naukowy z Excela. Zapisz kolumnę EAN jako tekst.`);
    }

    const values: GameFormValues = {
      ...EMPTY_FORM,
      title: get('title'),
      edition: get('edition'),
      releaseYear: get('releaseYear'),
      language: get('language'),
      developer: get('developer'),
      publisher: get('publisher'),
      polishPublisher: get('polishPublisher'),
      ean: eanRaw,
      outerSleeve: tri('outerSleeve'),
      discCount: get('discCount'),
      discType,
      manual: tri('manual'),
      strategyGuide: tri('strategyGuide'),
      posterMap: tri('posterMap'),
      otherContents: get('otherContents'),
      purchasePrice: get('purchasePrice').replace(/\s*(zł|pln)\s*$/i, ''),
      purchaseDate,
      condition,
      notes: get('notes'),
      externalUrl: get('externalUrl'),
    };

    for (const [key, message] of Object.entries(validateGameForm(values))) {
      errors.push(`${FIELD_LABEL[key as keyof GameFormValues]}: ${message}`);
    }

    const warnings: string[] = [];
    if (normalizeEan(values.ean) === '') warnings.push('Brak EAN, więc duplikaty nie zostaną wykryte.');

    return { line: i + 2, values, insert: errors.length === 0 ? toGameInsert(values) : null, errors, warnings };
  });

  return { rows, ignoredColumns, titleColumnFound: indexByKey.has('title') };
}

/** Oznacza duplikaty EAN w pliku i względem kolekcji (błędy) oraz powtórzone tytuły (ostrzeżenia). */
export function flagDuplicates(rows: readonly ImportRow[], existing: ExistingKeys): ImportRow[] {
  const seenEans = new Map<string, number>();
  return rows.map((row) => {
    const errors = [...row.errors];
    const warnings = [...row.warnings];
    const ean = normalizeEan(row.values.ean);

    if (ean) {
      const firstLine = seenEans.get(ean);
      if (firstLine !== undefined) errors.push(`Duplikat EAN ${ean} w pliku (pierwszy raz w wierszu ${firstLine}).`);
      else seenEans.set(ean, row.line);
      if (existing.eans.has(ean)) errors.push(`EAN ${ean} jest już w kolekcji.`);
    }
    if (row.values.title.trim() && existing.titles.has(existingTitleKey(row.values.title, row.values.edition)) && !existing.eans.has(ean)) {
      warnings.push('W kolekcji jest już gra o tym tytule i edycji.');
    }
    return { ...row, errors, warnings, insert: errors.length === 0 ? row.insert ?? toGameInsert(row.values) : null };
  });
}
