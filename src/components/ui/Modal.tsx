import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Okno modalne na natywnym <dialog>. Zawartość jest montowana tylko po otwarciu, więc formularze startują od zera. */
export function Modal({ open, title, onClose, children }: ModalProps) {
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
      className="m-auto max-h-[92vh] w-[min(94vw,34rem)] overflow-y-auto rounded-card border border-line bg-surface p-0 text-ink backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Zamknij" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-ink">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
