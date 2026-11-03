-- Zapobiega duplikatom na liście życzeń (ten sam tytuł, bez względu na wielkość liter i spacje na brzegach).
-- Różne wydania warto rozróżniać w tytule, np. „Gra (Edycja kolekcjonerska)”.
create unique index wishlist_title_unique_idx on public.wishlist (lower(btrim(title)));
