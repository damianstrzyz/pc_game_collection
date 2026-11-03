import { IMAGES_BUCKET, supabase } from '@/lib/supabase';
import { processImage } from '@/lib/imageProcessing';
import type { GamePhotoRow } from '@/types/database';

export const MAX_EXTRA_PHOTOS = 20;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Zmiany zdjęć zebrane w formularzu; zapisywane dopiero po zapisie samej gry. */
export interface PhotoChanges {
  newCover: File | null;
  removeCover: boolean;
  newPhotos: File[];
  removedPhotoIds: string[];
}

export const NO_PHOTO_CHANGES: PhotoChanges = { newCover: null, removeCover: false, newPhotos: [], removedPhotoIds: [] };

export const hasPhotoChanges = (c: PhotoChanges): boolean =>
  c.newCover !== null || c.removeCover || c.newPhotos.length > 0 || c.removedPhotoIds.length > 0;

const bucket = () => supabase.storage.from(IMAGES_BUCKET);

/** Miniatura leży obok pełnego zdjęcia i ma sufiks _thumb. */
export const thumbPath = (path: string): string => path.replace(/\.(webp|jpg)$/, '_thumb.$1');

export async function fetchGamePhotos(gameId: string): Promise<GamePhotoRow[]> {
  const { data, error } = await supabase
    .from('game_photos')
    .select('*')
    .eq('game_id', gameId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

/** Podpisane adresy URL (bucket jest prywatny). Zwraca mapę ścieżka → adres. */
export async function fetchSignedUrls(paths: readonly string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await bucket().createSignedUrls([...paths], SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error(error.message);
  const result: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) result[item.path] = item.signedUrl;
  }
  return result;
}

async function uploadProcessed(gameId: string, file: File): Promise<string> {
  const image = await processImage(file);
  const path = `${gameId}/${crypto.randomUUID()}.${image.ext}`;
  const options = { contentType: image.contentType, cacheControl: '31536000', upsert: false } as const;

  const full = await bucket().upload(path, image.full, options);
  if (full.error) throw new Error(`Wysyłanie zdjęcia nie powiodło się: ${full.error.message}`);
  const thumb = await bucket().upload(thumbPath(path), image.thumb, options);
  if (thumb.error) {
    await removeFiles([path]);
    throw new Error(`Wysyłanie miniatury nie powiodło się: ${thumb.error.message}`);
  }
  return path;
}

/** Usuwa pliki i ich miniatury. Błędy są tylko logowane, bo to sprzątanie. */
export async function removeFiles(paths: readonly string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await bucket().remove(paths.flatMap((p) => [p, thumbPath(p)]));
  if (error) console.warn('Nie udało się usunąć plików ze Storage:', error.message);
}

/** Usuwa wszystkie pliki gry (folder o nazwie id gry), także osierocone. */
export async function removeGameFolder(gameId: string): Promise<void> {
  const { data, error } = await bucket().list(gameId, { limit: 1000 });
  if (error) {
    console.warn('Nie udało się odczytać plików gry:', error.message);
    return;
  }
  const names = data.map((f) => `${gameId}/${f.name}`);
  if (names.length === 0) return;
  const { error: rmError } = await bucket().remove(names);
  if (rmError) console.warn('Nie udało się usunąć plików gry:', rmError.message);
}

export interface ExistingPhotos {
  coverImage: string | null;
  photos: GamePhotoRow[];
}

/**
 * Wysyła nowe pliki, potem aktualizuje bazę, a na końcu usuwa zastąpione pliki.
 * Jeśli błąd wystąpi przed pierwszą zmianą w bazie, świeżo wysłane pliki są wycofywane.
 */
export async function savePhotoChanges(gameId: string, existing: ExistingPhotos, changes: PhotoChanges): Promise<void> {
  const uploaded: string[] = [];
  let dbTouched = false;
  let newCoverPath: string | null | undefined; // undefined = bez zmian
  const removedPhotos = existing.photos.filter((p) => changes.removedPhotoIds.includes(p.id));

  try {
    if (changes.newCover) {
      newCoverPath = await uploadProcessed(gameId, changes.newCover);
      uploaded.push(newCoverPath);
    } else if (changes.removeCover && existing.coverImage) {
      newCoverPath = null;
    }

    const newPhotoPaths: string[] = [];
    for (const file of changes.newPhotos) {
      const path = await uploadProcessed(gameId, file);
      uploaded.push(path);
      newPhotoPaths.push(path);
    }

    if (newPhotoPaths.length > 0) {
      const lastOrder = existing.photos.reduce((max, p) => Math.max(max, p.sort_order), -1);
      const rows = newPhotoPaths.map((image_path, i) => ({ game_id: gameId, image_path, sort_order: lastOrder + 1 + i }));
      const { error } = await supabase.from('game_photos').insert(rows);
      if (error) throw new Error(error.message);
      dbTouched = true;
    }
    if (newCoverPath !== undefined) {
      const { error } = await supabase.from('games').update({ cover_image: newCoverPath }).eq('id', gameId);
      if (error) throw new Error(error.message);
      dbTouched = true;
    }
    if (removedPhotos.length > 0) {
      const { error } = await supabase.from('game_photos').delete().in('id', removedPhotos.map((p) => p.id));
      if (error) throw new Error(error.message);
      dbTouched = true;
    }
  } catch (err) {
    if (!dbTouched) await removeFiles(uploaded);
    throw err;
  }

  const stale = removedPhotos.map((p) => p.image_path);
  if (newCoverPath !== undefined && existing.coverImage) stale.push(existing.coverImage);
  await removeFiles(stale);
}
