import type { CollectionStats } from '@/types/stats';

export type TriState = 'yes' | 'no' | 'unknown';
export type DiscType = 'DVD' | 'CD' | 'DVD+CD' | 'other';

export interface GameRow {
  id: string;
  title: string;
  edition: string | null;
  release_year: number | null;
  language: string | null;
  developer: string | null;
  publisher: string | null;
  polish_publisher: string | null;
  outer_sleeve: TriState;
  disc_count: number | null;
  disc_type: DiscType | null;
  manual: TriState;
  strategy_guide: TriState;
  poster_map: TriState;
  other_contents: string | null;
  ean: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  condition: number | null;
  notes: string | null;
  external_url: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export type GameInsert = Partial<Omit<GameRow, 'id' | 'created_at' | 'updated_at'>> & { title: string };
export type GameUpdate = Partial<GameInsert>;

export interface GamePhotoRow {
  id: string;
  game_id: string;
  image_path: string;
  sort_order: number;
  created_at: string;
}
export type GamePhotoInsert = Pick<GamePhotoRow, 'game_id' | 'image_path'> & Partial<Pick<GamePhotoRow, 'sort_order'>>;

export interface WishlistRow {
  id: string;
  game_id: string | null;
  title: string;
  target_price: number | null;
  notes: string | null;
  created_at: string;
}
export type WishlistInsert = Partial<Omit<WishlistRow, 'id' | 'created_at'>> & { title: string };

export interface FilterOptions {
  years: number[];
  developers: string[];
  publishers: string[];
  polish_publishers: string[];
  languages: string[];
  disc_counts: number[];
}

export interface SettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      games: { Row: GameRow; Insert: GameInsert; Update: GameUpdate; Relationships: [] };
      game_photos: {
        Row: GamePhotoRow;
        Insert: GamePhotoInsert;
        Update: Partial<GamePhotoInsert>;
        Relationships: [
          { foreignKeyName: 'game_photos_game_id_fkey'; columns: ['game_id']; isOneToOne: false; referencedRelation: 'games'; referencedColumns: ['id'] },
        ];
      };
      wishlist: {
        Row: WishlistRow;
        Insert: WishlistInsert;
        Update: Partial<WishlistInsert>;
        Relationships: [
          { foreignKeyName: 'wishlist_game_id_fkey'; columns: ['game_id']; isOneToOne: false; referencedRelation: 'games'; referencedColumns: ['id'] },
        ];
      };
      settings: {
        Row: SettingRow;
        Insert: { key: string; value: unknown };
        Update: { value?: unknown };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      get_collection_stats: { Args: Record<string, never>; Returns: CollectionStats };
      get_filter_options: { Args: Record<string, never>; Returns: FilterOptions };
      move_wishlist_to_collection: {
        Args: {
          p_wishlist_id: string;
          p_purchase_price: number | null;
          p_purchase_date: string | null;
          p_condition: number | null;
        };
        Returns: string;
      };
    };
    Enums: { tri_state: TriState; disc_type: DiscType };
    CompositeTypes: Record<string, never>;
  };
}
