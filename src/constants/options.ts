import type { DiscType, TriState } from '@/types/database';

export const TRI_STATE_OPTIONS: ReadonlyArray<{ value: TriState; label: string }> = [
  { value: 'yes', label: 'Tak' },
  { value: 'no', label: 'Nie' },
  { value: 'unknown', label: 'Nie wiem' },
];

export const DISC_TYPE_OPTIONS: ReadonlyArray<{ value: DiscType; label: string }> = [
  { value: 'DVD', label: 'DVD' },
  { value: 'CD', label: 'CD' },
  { value: 'DVD+CD', label: 'DVD + CD' },
  { value: 'other', label: 'Inny' },
];

export const CURRENCY = 'PLN';
