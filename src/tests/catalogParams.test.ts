import { describe, expect, it } from 'vitest';
import { countActiveFilters, DEFAULT_FILTERS, hasAnyCriteria, parseFilters, toSearchParams } from '@/features/games/catalogParams';

describe('catalogParams', () => {
  it('domyślne filtry dają pusty adres, a parsowanie pustego adresu domyślne wartości', () => {
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe('');
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  it('odtwarza filtry po zapisie i odczycie z adresu (w tym DVD+CD)', () => {
    const f = { ...DEFAULT_FILTERS, q: 'diablo', year: 2000, developer: 'Blizzard', discType: 'DVD+CD' as const, conditionMin: 6, sort: 'condition' as const, dir: 'desc' as const, page: 3 };
    expect(parseFilters(new URLSearchParams(toSearchParams(f).toString()))).toEqual(f);
  });

  it('odrzuca nieprawidłowe wartości z adresu', () => {
    const f = parseFilters(new URLSearchParams('year=abc&cmin=99&disc=zip&sort=hack&page=-2&dir=sideways'));
    expect(f).toEqual(DEFAULT_FILTERS);
  });

  it('liczy aktywne filtry bez wyszukiwania i sortowania', () => {
    expect(countActiveFilters({ ...DEFAULT_FILTERS, q: 'x', year: 1999, language: 'pl', sort: 'condition' })).toBe(2);
    expect(hasAnyCriteria({ ...DEFAULT_FILTERS, q: 'x' })).toBe(true);
    expect(hasAnyCriteria(DEFAULT_FILTERS)).toBe(false);
  });
});
