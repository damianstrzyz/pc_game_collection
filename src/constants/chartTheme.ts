import { conditionTier, type ConditionTier } from '@/constants/condition';

export const CHART = {
  accent: '#f5c518',
  grid: '#1f2d57',
  axis: '#8b97ba',
  tooltipBg: '#16224a',
  palette: ['#f5c518', '#38bdf8', '#22c55e', '#f97316', '#a78bfa', '#ef4444', '#84cc16', '#ec4899', '#14b8a6', '#eab308'],
} as const;

const TIER_HEX: Record<ConditionTier, string> = {
  poor: '#ef4444',
  below: '#f97316',
  good: '#eab308',
  great: '#84cc16',
  excellent: '#22c55e',
  mint: '#38bdf8',
};

export const conditionColor = (value: number): string => TIER_HEX[conditionTier(value)];
