import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ACCEPTED_IMAGE_TYPES, validateImageFile } from '@/lib/imageProcessing';
import type { GamePhotoRow } from '@/types/database';
import { MAX_EXTRA_PHOTOS, thumbPath, type PhotoChanges } from './photosApi';
import { useSignedUrls } from './usePhotos';

interface PhotoEditorProps {
  existingCover: string | null;
  existingPhotos: readonly GamePhotoRow[];
  value: PhotoChanges;
  onChange: (value: PhotoChanges) => void;
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

function Tile({ src, alt, dimmed, children }: { src: string | null; alt: string; dimmed?: boolean; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-raised">
      {src ? (
        <img src={src} alt={alt} className={`aspect-[5/7] w-full object-cover ${dimmed ? 'opacity-30' : ''}`} />
      ) : (
        <div className="aspect-[5/7] w-full animate-pulse bg-raised" />
      )}
      <div className="absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/70 to-transparent p-1.5">{children}</div>
    </div>
  );
}

const tileBtn = 'grid h-8 w-8 place-items-center rounded-lg bg-black/60 text-white hover:bg-black/80';

function NewPhotoTile({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useObjectUrl(file);
  return (
    <Tile src={url} alt={`Podgląd: ${file.name}`}>
      <button type="button" onClick={onRemove} aria-label={`Usuń ${file.name}`} className={tileBtn}>
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </Tile>
  );
}

export function PhotoEditor({ existingCover, existingPhotos, value, onChange }: PhotoEditorProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const coverInput = useRef<HTMLInputElement>(null);
  const photosInput = useRef<HTMLInputElement>(null);

  const paths = [...(existingCover ? [thumbPath(existingCover)] : []), ...existingPhotos.map((p) => thumbPath(p.image_path))];
  const { data: urls } = useSignedUrls(paths);

  const coverPreview = useObjectUrl(value.newCover);
  const existingCoverUrl = existingCover ? (urls?.[thumbPath(existingCover)] ?? null) : null;
  const showExistingCover = Boolean(existingCover) && !value.removeCover && !value.newCover;
  const coverSrc = value.newCover ? coverPreview : showExistingCover ? existingCoverUrl : null;
  const hasCover = Boolean(value.newCover) || showExistingCover;

  const keptExisting = existingPhotos.filter((p) => !value.removedPhotoIds.includes(p.id)).length;
  const slotsLeft = MAX_EXTRA_PHOTOS - keptExisting - value.newPhotos.length;

  const pickCover = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const problem = validateImageFile(file);
    setErrors(problem ? [problem] : []);
    if (!problem) onChange({ ...value, newCover: file, removeCover: false });
    if (coverInput.current) coverInput.current.value = '';
  };

  const pickPhotos = (files: FileList | null) => {
    if (!files) return;
    const problems: string[] = [];
    const accepted: File[] = [];
    for (const file of Array.from(files)) {
      const problem = validateImageFile(file);
      if (problem) problems.push(problem);
      else if (accepted.length >= slotsLeft) {
        problems.push(`Limit dodatkowych zdjęć na grę to ${MAX_EXTRA_PHOTOS}.`);
        break;
      } else accepted.push(file);
    }
    setErrors(problems);
    if (accepted.length > 0) onChange({ ...value, newPhotos: [...value.newPhotos, ...accepted] });
    if (photosInput.current) photosInput.current.value = '';
  };

  const removeCover = () => {
    if (value.newCover) onChange({ ...value, newCover: null });
    else onChange({ ...value, removeCover: true });
  };

  const accept = ACCEPTED_IMAGE_TYPES.join(',');

  return (
    <div className="space-y-6 sm:col-span-2">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-36 shrink-0">
          <div className="overflow-hidden rounded-xl border border-dashed border-line bg-raised">
            {coverSrc ? (
              <img src={coverSrc} alt="Podgląd okładki" className="aspect-[5/7] w-full object-cover" />
            ) : (
              <div className="grid aspect-[5/7] w-full place-items-center text-muted">
                <ImagePlus className="h-8 w-8" aria-hidden />
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Okładka</h3>
          <p className="max-w-sm text-sm text-muted">Główne zdjęcie pudełka. Obrazy są zmniejszane przed wysłaniem (JPG, PNG lub WebP, do 25 MB).</p>
          <input ref={coverInput} type="file" accept={accept} className="hidden" onChange={(e) => pickCover(e.target.files)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => coverInput.current?.click()}>{hasCover ? 'Zmień okładkę' : 'Wybierz okładkę'}</Button>
            {hasCover && (
              <Button variant="ghost" onClick={removeCover}>
                Usuń okładkę
              </Button>
            )}
            {value.removeCover && existingCover && (
              <Button variant="ghost" onClick={() => onChange({ ...value, removeCover: false })}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                Przywróć
              </Button>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-medium">Dodatkowe zdjęcia</h3>
          <input ref={photosInput} type="file" accept={accept} multiple className="hidden" onChange={(e) => pickPhotos(e.target.files)} />
          <Button onClick={() => photosInput.current?.click()} disabled={slotsLeft <= 0}>
            <ImagePlus className="h-4 w-4" aria-hidden />
            Dodaj zdjęcia
          </Button>
        </div>
        {existingPhotos.length + value.newPhotos.length === 0 ? (
          <p className="text-sm text-muted">Brak dodatkowych zdjęć (tył pudełka, zawartość, płyty itp.).</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {existingPhotos.map((p) => {
              const removed = value.removedPhotoIds.includes(p.id);
              return (
                <Tile key={p.id} src={urls?.[thumbPath(p.image_path)] ?? null} alt="Zdjęcie gry" dimmed={removed}>
                  {removed ? (
                    <button type="button" onClick={() => onChange({ ...value, removedPhotoIds: value.removedPhotoIds.filter((id) => id !== p.id) })} aria-label="Przywróć zdjęcie" className={tileBtn}>
                      <RotateCcw className="h-4 w-4" aria-hidden />
                    </button>
                  ) : (
                    <button type="button" onClick={() => onChange({ ...value, removedPhotoIds: [...value.removedPhotoIds, p.id] })} aria-label="Usuń zdjęcie" className={tileBtn}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </Tile>
              );
            })}
            {value.newPhotos.map((file, i) => (
              <NewPhotoTile key={`${file.name}-${file.lastModified}-${i}`} file={file} onRemove={() => onChange({ ...value, newPhotos: value.newPhotos.filter((_, idx) => idx !== i) })} />
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-muted">Zdjęcia zostaną wysłane po kliknięciu „Zapisz”.</p>
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-cond-poor">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
