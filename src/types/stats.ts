import type { GameRow } from '@/types/database';

export interface LabelCount {
  label: string;
  count: number;
}

export type StatGame = Pick<GameRow, 'id' | 'title' | 'edition' | 'release_year' | 'purchase_price' | 'purchase_date' | 'condition' | 'created_at'>;

export interface CollectionStats {
  totals: { count: number; total_cost: number; avg_price: number | null; priced_count: number };
  by_year: LabelCount[];
  by_developer: LabelCount[];
  by_publisher: LabelCount[];
  by_polish_publisher: LabelCount[];
  by_language: LabelCount[];
  by_media: LabelCount[];
  by_condition: LabelCount[];
  acquired_by_month: Array<{ month: string; count: number }>;
  costs_by_month: Array<{ month: string; total: number; count: number }>;
  avg_price_by_year: Array<{ year: number; avg: number; count: number }>;
  recent: StatGame[];
  latest_purchases: StatGame[];
  most_expensive: StatGame[];
}
