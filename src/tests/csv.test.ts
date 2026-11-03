import { describe, expect, it } from 'vitest';
import { detectDelimiter, parseCsv, protectCell, stringifyCsv, unprotectCell } from '@/features/import-export/csv';

describe('csv', () => {
  it('odtwarza dane po eksporcie i imporcie (cudzysłowy, separator, nowe linie, polskie znaki)', () => {
    const rows = [
      ['Tytuł', 'Notatki'],
      ['Gra; "x"', '- uszkodzony\nróg'],
      ['=SUM(1)', 'zażółć gęślą jaźń'],
    ];
    const back = parseCsv('\uFEFF' + stringifyCsv(rows)).map((r) => r.map(unprotectCell));
    expect(back).toEqual(rows);
  });

  it('chroni komórki zaczynające się od znaków formuł', () => {
    expect(protectCell('=1+1')).toBe("'=1+1");
    expect(protectCell('@x')).toBe("'@x");
    expect(protectCell('zwykły')).toBe('zwykły');
    expect(unprotectCell("'=1+1")).toBe('=1+1');
    expect(unprotectCell("'zwykły")).toBe("'zwykły");
  });

  it('wykrywa separator', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
    expect(detectDelimiter('"a,b";c;d')).toBe(';');
  });

  it('pomija puste wiersze i obsługuje CRLF', () => {
    expect(parseCsv('a;b\r\n\r\n1;2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
});
