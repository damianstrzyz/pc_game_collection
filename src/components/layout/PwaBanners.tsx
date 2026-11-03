import { RefreshCw, WifiOff } from 'lucide-react';
import { applyUpdate, usePwaState } from '@/lib/pwa';

/** Pasek braku połączenia oraz propozycja odświeżenia po wydaniu nowej wersji. */
export function PwaBanners() {
  const { online, waiting } = usePwaState();
  return (
    <>
      {!online && (
        <div role="status" className="flex items-center justify-center gap-2 bg-cond-below/20 px-4 py-2 text-sm text-cond-below">
          <WifiOff className="h-4 w-4" aria-hidden />
          Brak połączenia z internetem. Dane kolekcji są niedostępne, dopóki połączenie nie wróci.
        </div>
      )}
      {waiting && (
        <div role="status" className="flex flex-wrap items-center justify-center gap-3 bg-accent/15 px-4 py-2 text-sm">
          <span>Dostępna jest nowa wersja aplikacji.</span>
          <button type="button" onClick={applyUpdate} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1 font-medium text-bg">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Odśwież
          </button>
        </div>
      )}
    </>
  );
}
