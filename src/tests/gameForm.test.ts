import { describe, expect, it } from 'vitest';
import { EMPTY_FORM, normalizeEan, parsePrice, toGameInsert, validateGameForm } from '@/features/games/gameForm';

const valid = { ...EMPTY_FORM, title: 'Wiedźmin' };

describe('validateGameForm', () => {
  it('wymaga tylko tytułu', () => {
    expect(validateGameForm(valid)).toEqual({});
    expect(validateGameForm({ ...valid, title: '   ' }).title).toBeDefined();
  });

  it('sprawdza EAN, rok, liczbę płyt, cenę, datę, stan i link', () => {
    const e = validateGameForm({
      ...valid, ean: '12AB', releaseYear: '1850', discCount: '0', purchasePrice: '-5', purchaseDate: '2024-02-30', condition: 12, externalUrl: 'ftp://x',
    });
    expect(Object.keys(e).sort()).toEqual(['condition', 'discCount', 'ean', 'externalUrl', 'purchaseDate', 'purchasePrice', 'releaseYear']);
  });

  it('akceptuje poprawne wartości graniczne', () => {
    expect(validateGameForm({ ...valid, ean: '01234567', releaseYear: '1970', discCount: '99', purchasePrice: '0', condition: 1 })).toEqual({});
    expect(validateGameForm({ ...valid, ean: '12345678901234', releaseYear: '2100', condition: 11, purchaseDate: '2024-02-29' })).toEqual({});
  });
});

describe('parsePrice / EAN', () => {
  it('rozumie przecinek i kropkę, odrzuca więcej niż 2 miejsca i wartości ujemne', () => {
    expect(parsePrice('49,99')).toBe(49.99);
    expect(parsePrice('49.9')).toBe(49.9);
    expect(parsePrice('1 299,00')).toBe(1299);
    expect(parsePrice('49,999')).toBeNull();
    expect(parsePrice('-1')).toBeNull();
    expect(parsePrice('')).toBeNull();
  });

  it('EAN zachowuje zera wiodące jako tekst', () => {
    expect(normalizeEan(' 0590-8305 2000 ')).toBe('05908305' + '2000');
    expect(toGameInsert({ ...valid, ean: '00012345' }).ean).toBe('00012345');
  });
});

describe('toGameInsert', () => {
  it('puste pola zapisuje jako null, a tekst przycina', () => {
    const r = toGameInsert({ ...valid, title: '  Gra  ', edition: ' ', purchasePrice: '10,5', discType: '' });
    expect(r.title).toBe('Gra');
    expect(r.edition).toBeNull();
    expect(r.purchase_price).toBe(10.5);
    expect(r.disc_type).toBeNull();
    expect(r.condition).toBeNull();
  });
});
