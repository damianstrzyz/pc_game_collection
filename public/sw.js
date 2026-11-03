/* Service worker: tylko powłoka aplikacji (HTML, JS, CSS, ikony).
 *
 * BEZPIECZEŃSTWO: obsługujemy wyłącznie żądania GET do własnej domeny.
 * Zapytania do Supabase (dane, logowanie, zdjęcia z podpisanymi URL) są
 * z innej domeny, więc nigdy nie przechodzą przez cache tego workera.
 * W cache trafia kod aplikacji, który i tak jest publiczny, bez danych kolekcji.
 */
const BUILD_ID = '__BUILD_ID__'; // podmieniane podczas `vite build`
const PRECACHE_ASSETS = /*__PRECACHE__*/[]; // lista plików z assets/, wstawiana podczas `vite build`

const SHELL_CACHE = `kolekcja-shell-${BUILD_ID}`;
const STATIC_PATHS = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/icons/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.add('/'); // powłoka jest wymagana; błąd przerywa instalację
      await Promise.allSettled([...STATIC_PATHS, ...PRECACHE_ASSETS.map((a) => `/${a}`)].map((u) => cache.add(u)));
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('kolekcja-shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// Aktualizacja jest stosowana dopiero po kliknięciu „Odśwież” w aplikacji, żeby nie przerwać pracy nad formularzem.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function shellNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && (response.headers.get('content-type') || '').includes('text/html')) {
      cache.put('/', response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match('/');
    return cached || new Response('Brak połączenia z internetem.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase i inne domeny: bez cache

  if (request.mode === 'navigate') {
    event.respondWith(shellNavigation(request));
    return;
  }
  if (url.pathname.startsWith('/assets/') || STATIC_PATHS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
