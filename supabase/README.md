# Konfiguracja Supabase

1. Utwórz projekt w Supabase.
2. **Authentication → Providers → Email**: wyłącz „Allow new users to sign up”
   (to blokuje rejestrację z zewnątrz; bez tego każdy mógłby założyć konto).
3. **Authentication → Users → Add user**: dodaj własne konto (e-mail + hasło).
4. **SQL Editor**: wklej i uruchom `migrations/0001_init.sql`.
4b. Uruchom też kolejno `migrations/0002_filter_options.sql` (listy filtrów katalogu), `migrations/0003_wishlist_unique.sql` (unikalność tytułów na liście życzeń) i `migrations/0004_collection_stats.sql` (statystyki).
5. W SQL Editor wpisz swoje konto jako administratora (podmień e-mail):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'twoj@email.pl';
   ```

6. Skopiuj `.env.example` do `.env` i wpisz URL oraz klucz **anon** z
   Project Settings → API. Klucza `service_role` nigdy nie używamy we froncie.

## Jak działa zabezpieczenie

- Wszystkie tabele mają włączone RLS; rola `anon` nie ma żadnych uprawnień.
- Każda polityka wymaga `public.is_admin()`, czyli wpisu w `public.admins`.
  Zalogowany, ale niebędący administratorem użytkownik nic nie odczyta ani nie zmieni.
- Bucket `game-images` jest prywatny. Zdjęcia będą pobierane przez podpisane
  adresy URL (signed URLs) w etapie 6.
