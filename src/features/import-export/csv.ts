/** Minimalny parser i generator CSV (RFC 4180) bez zależności. */

export type Delimiter = ';' | ',' | '\t';

/** Polski Excel zapisuje średnik; wykrywamy separator po pierwszym wierszu (poza cudzysłowami). */
export function detectDelimiter(text: string): Delimiter {
  const first = (text.startsWith('\uFEFF') ? text.slice(1) : text).split(/\r?\n/, 1)[0] ?? '';
  const counts: Record<Delimiter, number> = { ';': 0, ',': 0, '\t': 0 };
  let inQuotes = false;
  for (const ch of first) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (ch === ';' || ch === ',' || ch === '\t')) counts[ch] += 1;
  }
  if (counts[';'] >= counts[','] && counts[';'] >= counts['\t']) return ';';
  return counts[','] >= counts['\t'] ? ',' : '\t';
}

export function parseCsv(text: string, delimiter: Delimiter = detectDelimiter(text)): string[][] {
  const src = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src.charAt(i);
    if (inQuotes) {
      if (c === '"') {
        if (src.charAt(i + 1) === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"' && field === '') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src.charAt(i + 1) === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** Komórki zaczynające się od znaków formuł dostają apostrof, aby Excel ich nie wykonał. */
const FORMULA_START = /^[=+\-@\t\r]/;
export const protectCell = (s: string): string => (FORMULA_START.test(s) ? `'${s}` : s);
export const unprotectCell = (s: string): string => (/^'[=+\-@\t\r]/.test(s) ? s.slice(1) : s);

function escapeCell(value: string, delimiter: Delimiter): string {
  const v = protectCell(value);
  return v.includes(delimiter) || /["\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function stringifyCsv(rows: ReadonlyArray<readonly string[]>, delimiter: Delimiter = ';'): string {
  return rows.map((r) => r.map((cell) => escapeCell(cell, delimiter)).join(delimiter)).join('\r\n') + '\r\n';
}
