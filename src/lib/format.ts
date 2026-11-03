const pln = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
const date = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' });

export const formatPLN = (value: number | null | undefined): string =>
  value == null ? '—' : pln.format(value);

export const formatDate = (iso: string | null | undefined): string =>
  iso ? date.format(new Date(iso)) : '—';

/** Polska odmiana: 1 gra, 2–4 gry, 5+ gier (z wyjątkiem 12–14). */
export function pluralGames(n: number): string {
  if (n === 1) return '1 gra';
  const lastTwo = n % 100;
  const last = n % 10;
  const few = last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
  return `${n} ${few ? 'gry' : 'gier'}`;
}

/** Dzisiejsza data lokalna w formacie RRRR-MM-DD (do pól typu date). */
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
