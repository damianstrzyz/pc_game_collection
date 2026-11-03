/** Przetwarzanie zdjęć w przeglądarce: zmniejszenie, korekta orientacji EXIF i dwa rozmiary (pełny + miniatura). */

export const ACCEPTED_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

const FULL_MAX_DIM = 1600;
const THUMB_MAX_DIM = 480;
const FULL_QUALITY = 0.85;
const THUMB_QUALITY = 0.8;

export interface ProcessedImage {
  full: Blob;
  thumb: Blob;
  ext: 'webp' | 'jpg';
  contentType: 'image/webp' | 'image/jpeg';
}

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `Plik „${file.name}” ma nieobsługiwany format. Użyj JPG, PNG lub WebP.`;
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return `Plik „${file.name}” jest większy niż 25 MB.`;
  }
  return null;
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

async function encode(bitmap: ImageBitmap, maxDim: number, quality: number): Promise<{ blob: Blob; ext: 'webp' | 'jpg' }> {
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Przeglądarka nie obsługuje przetwarzania obrazów.');
  ctx.drawImage(bitmap, 0, 0, width, height);

  const webp = await toBlob(canvas, 'image/webp', quality);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };

  // Zapasowo JPEG (np. starsze przeglądarki); przezroczystość zastępujemy białym tłem.
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  const jpeg = await toBlob(canvas, 'image/jpeg', quality);
  if (!jpeg) throw new Error('Nie udało się przetworzyć zdjęcia.');
  return { blob: jpeg, ext: 'jpg' };
}

export async function processImage(file: File): Promise<ProcessedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`Nie można odczytać pliku „${file.name}”. Użyj JPG, PNG lub WebP.`);
  }
  try {
    const full = await encode(bitmap, FULL_MAX_DIM, FULL_QUALITY);
    const thumb = await encode(bitmap, THUMB_MAX_DIM, THUMB_QUALITY);
    const ext = full.ext;
    return { full: full.blob, thumb: thumb.blob, ext, contentType: ext === 'webp' ? 'image/webp' : 'image/jpeg' };
  } finally {
    bitmap.close();
  }
}
