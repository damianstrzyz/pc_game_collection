import { describe, expect, it } from 'vitest';
import { conditionTier, getConditionInfo } from '@/constants/condition';
import { cumulative, fillMonths, fullConditionData, monthLabel } from '@/features/stats/statsTransforms';
import { formatPLN, pluralGames } from '@/lib/format';

describe('statsTransforms', () => {
  it('uzupełnia brakujące miesiące zerami, także na przełomie roku', () => {
    const filled = fillMonths([{ month: '2023-11', value: 2 }, { month: '2024-02', value: 1 }]);
    expect(filled.map((p) => p.month)).toEqual(['2023-11', '2023-12', '2024-01', '2024-02']);
    expect(filled.map((p) => p.value)).toEqual([2, 0, 0, 1]);
    expect(fillMonths([])).toEqual([]);
  });

  it('liczy sumę narastającą', () => {
    expect(cumulative([{ month: 'a', value: 1 }, { month: 'b', value: 0 }, { month: 'c', value: 4 }]).map((p) => p.value)).toEqual([1, 1, 5]);
  });

  it('zawsze zwraca oceny 1–11', () => {
    const d = fullConditionData([{ label: '11', count: 3 }]);
    expect(d).toHaveLength(11);
    expect(d[10]).toEqual({ label: '11', count: 3 });
    expect(d[0]?.count).toBe(0);
  });

  it('formatuje etykietę miesiąca', () => {
    expect(monthLabel('2024-03')).toMatch(/24/);
  });
});

describe('skala stanu 1–11', () => {
  it('przypisuje przedziały zgodnie ze specyfikacją', () => {
    const tiers = Array.from({ length: 11 }, (_, i) => conditionTier(i + 1));
    expect(tiers).toEqual(['poor', 'poor', 'poor', 'below', 'below', 'good', 'good', 'great', 'great', 'excellent', 'mint']);
    expect(getConditionInfo(11).label).toMatch(/mint/);
  });
});

describe('format', () => {
  it('odmienia „gra” po polsku', () => {
    expect([1, 2, 5, 12, 14, 22, 25, 112].map(pluralGames)).toEqual(['1 gra', '2 gry', '5 gier', '12 gier', '14 gier', '22 gry', '25 gier', '112 gier']);
  });

  it('formatuje PLN', () => {
    expect(formatPLN(12345.5).replace(/\s/g, ' ')).toBe('12 345,50 zł');
    expect(formatPLN(1234.5).replace(/\s/g, ' ')).toBe('1234,50 zł'); // polska norma: grupowanie od 5 cyfr
    expect(formatPLN(null)).toBe('—');
  });
});
