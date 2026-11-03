# Kolekcja gier PC

Prywatny katalog fizycznych gier PC (React + TypeScript + Vite + Tailwind + Supabase).

## Uruchomienie

```bash
npm install
cp .env.example .env   # uzupełnij dane Supabase (patrz supabase/README.md)
npm run typecheck      # kontrola typów
npm test               # testy jednostkowe (Vitest)
npm run dev
```

Kolejność konfiguracji: najpierw `supabase/README.md` (projekt, wyłączenie rejestracji, migracje 0001–0004,
wpis administratora), potem `.env`, na końcu `npm run dev`.

## Struktura

```
src/
  app/          App, router (lazy loading tras)
  components/   layout/ i ui/ – komponenty wielokrotnego użytku
  features/     auth/, games/, wishlist/, stats/, import-export/ – logika domenowa
  pages/        strony (każda ładowana osobno)
  lib/          klient Supabase, QueryClient, formatowanie PLN
  constants/    skala stanu 1–11, opcje formularzy
  types/        typy bazy danych
supabase/       migracje SQL i instrukcja konfiguracji
```

## Stan prac

Etapy 1–12 gotowe (szkielet, schemat, RLS, Storage, logowanie, powłoka interfejsu, katalog gier, szczegóły gry, formularz dodawania i edycji, zdjęcia i galeria, lista życzeń, dashboard i statystyki, import i eksport danych, PWA, testy).
Strony poza logowaniem to jawne znaczniki „nie jest jeszcze gotowe”.

## PWA i hosting

- `public/manifest.webmanifest` – nazwa, kolory (`theme_color`, `background_color`), tryb `standalone`, ikony 192/512 px (+ maskable).
- `public/sw.js` – service worker. Cache obejmuje wyłącznie powłokę aplikacji (HTML, JS, CSS, ikony) z własnej domeny.
  Zapytania do Supabase (dane, logowanie, podpisane adresy zdjęć) są z innej domeny i **nigdy** nie trafiają do cache.
- Przy `npm run build` wtyczka w `vite.config.ts` wstawia do `dist/sw.js` identyfikator builda i listę plików,
  dzięki czemu aplikacja uruchamia się offline, a nowa wersja jest proponowana użytkownikowi (przycisk „Odśwież”).
- Service worker działa tylko w buildzie produkcyjnym i wymaga HTTPS (lub localhost): `npm run build && npm run preview`.
- Hosting musi przekierowywać wszystkie ścieżki na `index.html` (SPA). Dołączono `_redirects` (Netlify) i `vercel.json`;
  plik `sw.js` powinien być serwowany z `Cache-Control: no-cache`.

## Testy

`npm test` uruchamia testy logiki biznesowej w `src/tests/`: parser i generator CSV, walidacja formularza gry,
mapowanie i wykrywanie duplikatów przy imporcie, parametry katalogu w adresie URL, przekształcenia statystyk,
skala stanu 1–11 oraz formatowanie PLN. Testy interfejsu i zapytań do Supabase nie są objęte;
sprawdź je ręcznie według listy poniżej.

## Lista kontrolna przed użyciem

1. Rejestracja wyłączona w Supabase; w tabeli `admins` tylko Twoje konto.
2. Bez logowania żadna strona nie pokazuje danych; po zalogowaniu innym kontem (nie administratorem) dostęp jest odrzucony.
3. Dodanie gry, edycja, zmiana stanu, usunięcie (z potwierdzeniem), duplikat EAN odrzucony.
4. Zdjęcia: okładka i dodatkowe, podgląd przed zapisem, galeria, usunięcie gry czyści pliki.
5. Lista życzeń: dodanie, przeniesienie do kolekcji, usunięcie.
6. Eksport CSV otwarty w Excelu (polskie znaki), import tego samego pliku zgłasza duplikaty EAN.
7. `npm run build && npm run preview`: instalacja PWA, tryb offline pokazuje baner, brak danych w cache.
