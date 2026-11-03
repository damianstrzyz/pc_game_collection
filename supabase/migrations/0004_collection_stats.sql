-- Wszystkie statystyki liczone w bazie z prawdziwych rekordów (jedno wywołanie dla dashboardu i statystyk).
-- security invoker: obowiązuje RLS, wynik dostanie tylko administrator.
-- Czas „nabycia” gry = data zakupu, a gdy jej brak, data dodania do katalogu.
create or replace function public.get_collection_stats()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with g as (
    select id, title, edition, release_year, developer, publisher, polish_publisher, language,
           disc_type, disc_count, purchase_price, purchase_date, condition, cover_image, created_at
    from public.games
  )
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'count', count(*),
        'total_cost', coalesce(sum(purchase_price), 0),
        'avg_price', round(avg(purchase_price), 2),
        'priced_count', count(purchase_price)
      ) from g
    ),
    'by_year', coalesce((
      select jsonb_agg(jsonb_build_object('label', y::text, 'count', c) order by y)
      from (select release_year as y, count(*) as c from g where release_year is not null group by release_year) s
    ), '[]'::jsonb),
    'by_developer', coalesce((
      select jsonb_agg(jsonb_build_object('label', l, 'count', c) order by c desc, l)
      from (select developer as l, count(*) as c from g where developer is not null and developer <> '' group by developer order by count(*) desc, developer limit 20) s
    ), '[]'::jsonb),
    'by_publisher', coalesce((
      select jsonb_agg(jsonb_build_object('label', l, 'count', c) order by c desc, l)
      from (select publisher as l, count(*) as c from g where publisher is not null and publisher <> '' group by publisher order by count(*) desc, publisher limit 20) s
    ), '[]'::jsonb),
    'by_polish_publisher', coalesce((
      select jsonb_agg(jsonb_build_object('label', l, 'count', c) order by c desc, l)
      from (select polish_publisher as l, count(*) as c from g where polish_publisher is not null and polish_publisher <> '' group by polish_publisher order by count(*) desc, polish_publisher limit 20) s
    ), '[]'::jsonb),
    'by_language', coalesce((
      select jsonb_agg(jsonb_build_object('label', l, 'count', c) order by c desc, l)
      from (select language as l, count(*) as c from g where language is not null and language <> '' group by language order by count(*) desc, language limit 20) s
    ), '[]'::jsonb),
    'by_media', coalesce((
      select jsonb_agg(jsonb_build_object('label', l, 'count', c) order by c desc, l)
      from (select disc_type::text as l, count(*) as c from g where disc_type is not null group by disc_type) s
    ), '[]'::jsonb),
    'by_condition', coalesce((
      select jsonb_agg(jsonb_build_object('label', cond::text, 'count', c) order by cond)
      from (select condition as cond, count(*) as c from g where condition is not null group by condition) s
    ), '[]'::jsonb),
    'acquired_by_month', coalesce((
      select jsonb_agg(jsonb_build_object('month', m, 'count', c) order by m)
      from (
        select to_char(coalesce(purchase_date, (created_at at time zone 'Europe/Warsaw')::date), 'YYYY-MM') as m, count(*) as c
        from g group by 1
      ) s
    ), '[]'::jsonb),
    'costs_by_month', coalesce((
      select jsonb_agg(jsonb_build_object('month', m, 'total', t, 'count', c) order by m)
      from (
        select to_char(purchase_date, 'YYYY-MM') as m, sum(purchase_price) as t, count(*) as c
        from g where purchase_date is not null and purchase_price is not null group by 1
      ) s
    ), '[]'::jsonb),
    'avg_price_by_year', coalesce((
      select jsonb_agg(jsonb_build_object('year', y, 'avg', a, 'count', c) order by y)
      from (
        select extract(year from purchase_date)::int as y, round(avg(purchase_price), 2) as a, count(*) as c
        from g where purchase_date is not null and purchase_price is not null group by 1
      ) s
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.created_at desc)
      from (select * from g order by created_at desc limit 6) s
    ), '[]'::jsonb),
    'latest_purchases', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.purchase_date desc, s.created_at desc)
      from (select * from g where purchase_date is not null order by purchase_date desc, created_at desc limit 6) s
    ), '[]'::jsonb),
    'most_expensive', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.purchase_price desc, s.title)
      from (select * from g where purchase_price is not null order by purchase_price desc, title limit 10) s
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.get_collection_stats() from public;
grant execute on function public.get_collection_stats() to authenticated;
