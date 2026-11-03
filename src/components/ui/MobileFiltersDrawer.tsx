import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface MobileFiltersDrawerProps {
  open: boolean;
  onClose: () => void;
  onClear?: () => void;
  children: ReactNode;
}

/** Wysuwany panel filtrów na telefonie. Zawartość (pola filtrów) dostarcza katalog w etapie 4. */
export function MobileFiltersDrawer({ open, onClose, onClear, children }: MobileFiltersDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85vh] w-full max-w-none rounded-t-card border border-line bg-surface p-0 text-ink backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-base font-semibold">Filtry</h2>
        <button type="button" onClick={onClose} aria-label="Zamknij filtry" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-ink">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-4 py-4">{children}</div>
      <div className="flex gap-2 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {onClear && (
          <Button variant="ghost" onClick={onClear} className="flex-1">
            Wyczyść filtry
          </Button>
        )}
        <Button variant="primary" onClick={onClose} className="flex-1">
          Pokaż wyniki
        </Button>
      </div>
    </dialog>
  );
}
