import type { LabelCount } from '@/types/stats';

export interface Point {
  label: string;
  value: number;
}

/** „2024-03” → „mar 24”. */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' });
}

function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const next = new Date((y ?? 0), (m ?? 1), 1); // m jest 1-based, więc to kolejny miesiąc
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

/** Uzupełnia brakujące miesiące zerami, żeby oś czasu była równomierna. */
export function fillMonths(points: ReadonlyArray<{ month: string; value: number }>): Array<{ month: string; value: number }> {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return [];
  const byMonth = new Map(points.map((p) => [p.month, p.value]));
  const result: Array<{ month: string; value: number }> = [];
  for (let m = first.month; m <= last.month; m = nextMonth(m)) {
    result.push({ month: m, value: byMonth.get(m) ?? 0 });
  }
  return result;
}

export function cumulative(points: ReadonlyArray<{ month: string; value: number }>): Array<{ month: string; value: number }> {
  let sum = 0;
  return points.map((p) => ({ month: p.month, value: (sum += p.value) }));
}

/** Zawsze wszystkie oceny 1–11, także z zerowymi liczbami. */
export function fullConditionData(rows: readonly LabelCount[]): LabelCount[] {
  const byLabel = new Map(rows.map((r) => [r.label, r.count]));
  return Array.from({ length: 11 }, (_, i) => ({ label: String(i + 1), count: byLabel.get(String(i + 1)) ?? 0 }));
}

export const MEDIA_LABEL: Record<string, string> = { DVD: 'DVD', CD: 'CD', 'DVD+CD': 'DVD + CD', other: 'Inny' };
