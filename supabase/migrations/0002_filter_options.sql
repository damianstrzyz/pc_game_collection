-- Wartości do rozwijanych list filtrów katalogu, pobierane jednym zapytaniem.
-- security invoker: obowiązują polityki RLS (wynik dostanie tylko administrator).
create or replace function public.get_filter_options()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'years', coalesce((select jsonb_agg(v order by v desc) from (select distinct release_year as v from public.games where release_year is not null) s), '[]'::jsonb),
    'developers', coalesce((select jsonb_agg(v order by lower(v)) from (select distinct developer as v from public.games where developer is not null and developer <> '') s), '[]'::jsonb),
    'publishers', coalesce((select jsonb_agg(v order by lower(v)) from (select distinct publisher as v from public.games where publisher is not null and publisher <> '') s), '[]'::jsonb),
    'polish_publishers', coalesce((select jsonb_agg(v order by lower(v)) from (select distinct polish_publisher as v from public.games where polish_publisher is not null and polish_publisher <> '') s), '[]'::jsonb),
    'languages', coalesce((select jsonb_agg(v order by lower(v)) from (select distinct language as v from public.games where language is not null and language <> '') s), '[]'::jsonb),
    'disc_counts', coalesce((select jsonb_agg(v order by v) from (select distinct disc_count as v from public.games where disc_count is not null) s), '[]'::jsonb)
  );
$$;
revoke all on function public.get_filter_options() from public;
grant execute on function public.get_filter_options() to authenticated;
