-- =============================================================================
-- Kolekcja gier PC – schemat bazy, RLS i Storage (Supabase / PostgreSQL)
-- Model dostępu: jeden administrator. Brak rejestracji. Wszystko zablokowane
-- dla roli anon; dostęp ma wyłącznie użytkownik wpisany do tabeli public.admins.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------- Typy ----------
create type public.tri_state as enum ('yes', 'no', 'unknown');
create type public.disc_type as enum ('DVD', 'CD', 'DVD+CD', 'other');

-- ---------- Administrator ----------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
alter table public.admins force row level security;
-- Celowo brak polityk: tabelę czyta tylko funkcja is_admin() (security definer).
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------- Trigger updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- games ----------
create table public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  edition text check (char_length(edition) <= 300),
  release_year smallint check (release_year between 1970 and 2100),
  language text check (char_length(language) <= 100),
  developer text check (char_length(developer) <= 200),
  publisher text check (char_length(publisher) <= 200),
  polish_publisher text check (char_length(polish_publisher) <= 200),
  outer_sleeve public.tri_state not null default 'unknown',
  disc_count smallint check (disc_count between 1 and 99),
  disc_type public.disc_type,
  manual public.tri_state not null default 'unknown',
  strategy_guide public.tri_state not null default 'unknown',
  poster_map public.tri_state not null default 'unknown',
  other_contents text check (char_length(other_contents) <= 2000),
  ean text check (ean ~ '^[0-9]{8,14}$'),               -- tekst, zachowuje zera wiodące
  purchase_price numeric(10, 2) check (purchase_price >= 0),  -- zawsze PLN
  purchase_date date,
  condition smallint check (condition between 1 and 11),
  notes text check (char_length(notes) <= 10000),
  external_url text check (external_url ~* '^https?://' and char_length(external_url) <= 2000),
  cover_image text,                                       -- ścieżka w buckecie game-images
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger games_set_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

-- Unikalny EAN (wiele pustych wartości dozwolone).
create unique index games_ean_key on public.games (ean) where ean is not null;
-- Wyszukiwanie po tytule/edycji (ILIKE '%tekst%') oraz sortowanie.
create index games_title_trgm_idx on public.games using gin (title extensions.gin_trgm_ops);
create index games_edition_trgm_idx on public.games using gin (edition extensions.gin_trgm_ops);
create index games_title_sort_idx on public.games (lower(title));
-- Pola filtrowane i sortowane.
create index games_release_year_idx on public.games (release_year);
create index games_developer_idx on public.games (developer);
create index games_publisher_idx on public.games (publisher);
create index games_polish_publisher_idx on public.games (polish_publisher);
create index games_language_idx on public.games (language);
create index games_disc_type_idx on public.games (disc_type);
create index games_disc_count_idx on public.games (disc_count);
create index games_condition_idx on public.games (condition);
create index games_purchase_date_idx on public.games (purchase_date);
create index games_purchase_price_idx on public.games (purchase_price);
create index games_created_at_idx on public.games (created_at desc);

-- ---------- game_photos ----------
create table public.game_photos (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  image_path text not null,                               -- ścieżka w buckecie game-images
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index game_photos_game_sort_idx on public.game_photos (game_id, sort_order);

-- ---------- wishlist ----------
create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games (id) on delete set null,  -- opcjonalne powiązanie z katalogiem
  title text not null check (char_length(btrim(title)) between 1 and 300),
  target_price numeric(10, 2) check (target_price >= 0),         -- PLN
  notes text check (char_length(notes) <= 5000),
  created_at timestamptz not null default now()
);
create index wishlist_game_id_idx on public.wishlist (game_id);
create index wishlist_created_at_idx on public.wishlist (created_at desc);

-- ---------- settings ----------
create table public.settings (
  key text primary key check (char_length(key) <= 100),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------- Przeniesienie z listy życzeń do kolekcji (jedna transakcja) ----------
create or replace function public.move_wishlist_to_collection(
  p_wishlist_id uuid,
  p_purchase_price numeric,
  p_purchase_date date,
  p_condition smallint
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  w public.wishlist%rowtype;
  new_id uuid;
begin
  select * into w from public.wishlist where id = p_wishlist_id for update;
  if not found then
    raise exception 'Nie znaleziono pozycji listy życzeń';
  end if;

  insert into public.games (title, notes, purchase_price, purchase_date, condition)
  values (w.title, w.notes, p_purchase_price, p_purchase_date, p_condition)
  returning id into new_id;

  delete from public.wishlist where id = p_wishlist_id;
  return new_id;
end;
$$;
revoke all on function public.move_wishlist_to_collection(uuid, numeric, date, smallint) from public;
grant execute on function public.move_wishlist_to_collection(uuid, numeric, date, smallint) to authenticated;

-- ---------- RLS: tylko administrator ----------
alter table public.games enable row level security;
alter table public.game_photos enable row level security;
alter table public.wishlist enable row level security;
alter table public.settings enable row level security;

revoke all on public.games, public.game_photos, public.wishlist, public.settings from anon;
grant select, insert, update, delete on public.games, public.game_photos, public.wishlist, public.settings to authenticated;

create policy games_admin_all on public.games
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy game_photos_admin_all on public.game_photos
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy wishlist_admin_all on public.wishlist
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy settings_admin_all on public.settings
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Publiczny katalog tylko do odczytu jest domyślnie WYŁĄCZONY (brak polityk dla anon).

-- ---------- Storage: prywatny bucket na zdjęcia ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-images', 'game-images', false, 8 * 1024 * 1024,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy game_images_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'game-images' and (select public.is_admin()));

create policy game_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'game-images' and (select public.is_admin()));

create policy game_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'game-images' and (select public.is_admin()))
  with check (bucket_id = 'game-images' and (select public.is_admin()));

create policy game_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'game-images' and (select public.is_admin()));
