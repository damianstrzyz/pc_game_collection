export type ConditionTier = 'poor' | 'below' | 'good' | 'great' | 'excellent' | 'mint';

export interface ConditionInfo {
  tier: ConditionTier;
  label: string;
  /** Pełne nazwy klas, aby Tailwind je wykrył podczas budowania. */
  badgeClass: string;
}

const TIERS: Record<ConditionTier, Omit<ConditionInfo, 'tier'>> = {
  poor: { label: 'Zły stan', badgeClass: 'bg-cond-poor/15 text-cond-poor border-cond-poor/40' },
  below: { label: 'Poniżej przeciętnego', badgeClass: 'bg-cond-below/15 text-cond-below border-cond-below/40' },
  good: { label: 'Dobry', badgeClass: 'bg-cond-good/15 text-cond-good border-cond-good/40' },
  great: { label: 'Bardzo dobry', badgeClass: 'bg-cond-great/15 text-cond-great border-cond-great/40' },
  excellent: { label: 'Doskonały', badgeClass: 'bg-cond-excellent/15 text-cond-excellent border-cond-excellent/40' },
  mint: { label: 'Jak nowa (mint)', badgeClass: 'bg-cond-mint/15 text-cond-mint border-cond-mint/40' },
};

export const CONDITION_MIN = 1;
export const CONDITION_MAX = 11;

export function conditionTier(value: number): ConditionTier {
  if (value <= 3) return 'poor';
  if (value <= 5) return 'below';
  if (value <= 7) return 'good';
  if (value <= 9) return 'great';
  if (value === 10) return 'excellent';
  return 'mint';
}

export function getConditionInfo(value: number): ConditionInfo {
  const tier = conditionTier(value);
  return { tier, ...TIERS[tier] };
}
