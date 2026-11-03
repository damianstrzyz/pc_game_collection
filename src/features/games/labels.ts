import type { DiscType, TriState } from '@/types/database';

export const DISC_TYPE_LABEL: Record<DiscType, string> = {
  DVD: 'DVD',
  CD: 'CD',
  'DVD+CD': 'DVD + CD',
  other: 'Inny nośnik',
};

export const TRI_STATE_LABEL: Record<TriState, string> = {
  yes: 'Tak',
  no: 'Nie',
  unknown: 'Nie wiem',
};

export function discSummary(discType: DiscType | null, discCount: number | null): string | null {
  if (!discType) return discCount ? `${discCount} szt.` : null;
  const type = DISC_TYPE_LABEL[discType];
  return discCount ? `${discCount} × ${type}` : type;
}
