import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface GalleryImage {
  id: string;
  thumbUrl: string | null;
  fullUrl: string | null;
  alt: string;
}

export function PhotoGallery({ images }: { images: readonly GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) dialog.showModal();
    if (index === null && dialog.open) dialog.close();
  }, [index]);

  const step = (delta: number) => setIndex((i) => (i === null ? i : (i + delta + images.length) % images.length));
  const current = index === null ? null : images[index];

  return (
    <section aria-label="Zdjęcia" className="rounded-card border border-line bg-surface/50 p-5">
      <h2 className="mb-3 text-base font-semibold">Zdjęcia ({images.length})</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Powiększ zdjęcie ${i + 1} z ${images.length}`}
            className="overflow-hidden rounded-xl border border-line bg-raised transition-colors hover:border-accent/60"
          >
            {img.thumbUrl ? (
              <img src={img.thumbUrl} alt={img.alt} loading="lazy" decoding="async" className="aspect-[5/7] w-full object-cover" />
            ) : (
              <div className="aspect-[5/7] w-full animate-pulse bg-raised" />
            )}
          </button>
        ))}
      </div>

      <dialog
        ref={ref}
        onClose={() => setIndex(null)}
        onClick={(e) => {
          if (e.target === ref.current) setIndex(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') step(-1);
          if (e.key === 'ArrowRight') step(1);
        }}
        className="m-auto max-h-[95vh] w-[min(96vw,64rem)] max-w-none border-0 bg-transparent p-0 text-ink backdrop:bg-black/85"
      >
        {current && (
          <div className="relative flex flex-col items-center">
            {current.fullUrl ? (
              <img src={current.fullUrl} alt={current.alt} className="max-h-[85vh] max-w-full rounded-xl object-contain" />
            ) : (
              <div className="h-64 w-full animate-pulse rounded-xl bg-raised" />
            )}
            <p className="mt-2 text-sm text-muted">
              {(index ?? 0) + 1} / {images.length}
            </p>
            <button type="button" onClick={() => setIndex(null)} aria-label="Zamknij podgląd" className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white">
              <X className="h-5 w-5" aria-hidden />
            </button>
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label="Poprzednie zdjęcie" className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white">
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Następne zdjęcie" className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white">
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </section>
  );
}
