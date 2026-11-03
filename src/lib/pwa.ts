import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  /** Nowa wersja aplikacji czeka na aktywację. */
  waiting: ServiceWorker | null;
  /** Zdarzenie instalacji przechwycone z przeglądarki (Chrome, Edge, Android). */
  installEvent: BeforeInstallPromptEvent | null;
  online: boolean;
  installed: boolean;
}

const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

let state: PwaState = { waiting: null, installEvent: null, online: navigator.onLine, installed: isStandalone() };
const listeners = new Set<() => void>();

function setState(patch: Partial<PwaState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

window.addEventListener('online', () => setState({ online: true }));
window.addEventListener('offline', () => setState({ online: false }));
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  setState({ installEvent: e as BeforeInstallPromptEvent });
});
window.addEventListener('appinstalled', () => setState({ installEvent: null, installed: true }));

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setState({ waiting: reg.waiting });
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setState({ waiting: worker });
          });
        });
        // Okresowe sprawdzanie aktualizacji dla długo otwartej aplikacji.
        window.setInterval(() => void reg.update(), 60 * 60 * 1000);
      })
      .catch((err: unknown) => console.warn('Nie udało się zarejestrować service workera:', err));
  });
}

export const applyUpdate = (): void => state.waiting?.postMessage({ type: 'SKIP_WAITING' });

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = state.installEvent;
  if (!event) return 'unavailable';
  await event.prompt();
  const { outcome } = await event.userChoice;
  setState({ installEvent: null });
  return outcome;
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function usePwaState(): PwaState {
  return useSyncExternalStore(subscribe, () => state);
}
