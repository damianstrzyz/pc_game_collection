import { describe, expect, it } from 'vitest';
import { parseCsv } from '@/features/import-export/csv';
import { buildTemplateCsv } from '@/features/import-export/csvBuild';
import { flagDuplicates, mapCsvRows } from '@/features/import-export/importMapping';

const none = { eans: new Set<string>(), titles: new Set<string>() };

function run(csv: string, existing = none) {
  const parsed = mapCsvRows(parseCsv(csv));
  return { parsed, rows: flagDuplicates(parsed.rows, existing) };
}

describe('import CSV', () => {
  it('importuje własny szablon bez błędów', () => {
    const { rows } = run(buildTemplateCsv());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.errors).toEqual([]);
    expect(rows[0]?.insert?.purchase_price).toBe(49.99);
    expect(rows[0]?.insert?.disc_type).toBe('DVD');
    expect(rows[0]?.insert?.manual).toBe('yes');
  });

  it('akceptuje nagłówki angielskie, ceny z „zł” i datę DD.MM.RRRR', () => {
    const { rows } = run('title;purchase_price;purchase_date;disc_type\nGra;49,99 zł;17.05.2024;dvd + cd');
    expect(rows[0]?.errors).toEqual([]);
    expect(rows[0]?.insert).toMatchObject({ title: 'Gra', purchase_price: 49.99, purchase_date: '2024-05-17', disc_type: 'DVD+CD' });
  });

  it('zgłasza błędne wartości po polsku', () => {
    const { rows } = run('Tytuł;Stan (1-11);Instrukcja;Data zakupu\nGra;15;może;31.02.2024');
    const errors = rows[0]?.errors.join(' | ') ?? '';
    expect(errors).toMatch(/Stan/);
    expect(errors).toMatch(/Instrukcja/);
    expect(errors).toMatch(/Data zakupu/);
    expect(rows[0]?.insert).toBeNull();
  });

  it('wykrywa duplikaty EAN w pliku i w kolekcji', () => {
    const csv = 'Tytuł;EAN\nA;5901234567890\nB;5901234567890\nC;5909999999999';
    const { rows } = run(csv, { eans: new Set(['5909999999999']), titles: new Set() });
    expect(rows[0]?.errors).toEqual([]);
    expect(rows[1]?.errors.join()).toMatch(/Duplikat EAN/);
    expect(rows[2]?.errors.join()).toMatch(/już w kolekcji/);
  });

  it('ostrzega o braku EAN i o powtórzonym tytule z edycją', () => {
    const { rows } = run('Tytuł;Edycja\nGra;GOTY', { eans: new Set(), titles: new Set(['gra|goty']) });
    expect(rows[0]?.errors).toEqual([]);
    expect(rows[0]?.warnings).toHaveLength(2);
  });

  it('wykrywa EAN zapisany naukowo i brak kolumny tytułu', () => {
    expect(run('Tytuł;EAN\nGra;5,9E+12').rows[0]?.errors.join()).toMatch(/zapis naukowy/);
    expect(mapCsvRows(parseCsv('Edycja\nX')).titleColumnFound).toBe(false);
  });

  it('zachowuje zera wiodące w EAN i raportuje nieznane kolumny', () => {
    const { parsed, rows } = run('Tytuł;EAN;Kolor\nGra;00012345;zielony');
    expect(rows[0]?.insert?.ean).toBe('00012345');
    expect(parsed.ignoredColumns).toEqual(['Kolor']);
  });
});
