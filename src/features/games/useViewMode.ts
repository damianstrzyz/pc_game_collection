import { useCallback, useState } from 'react';
import type { GameCardLayout } from './GameCard';

const KEY = 'catalog-view';

function read(): GameCardLayout {
  try {
    return window.localStorage.getItem(KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

/** Zapamiętuje wybrany widok (siatka/lista) w przeglądarce. */
export function useViewMode(): [GameCardLayout, (v: GameCardLayout) => void] {
  const [view, setView] = useState<GameCardLayout>(read);
  const update = useCallback((v: GameCardLayout) => {
    setView(v);
    try {
      window.localStorage.setItem(KEY, v);
    } catch {
      /* tryb prywatny – pomijamy zapis */
    }
  }, []);
  return [view, update];
}
