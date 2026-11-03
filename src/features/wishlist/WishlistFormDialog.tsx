import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/fields';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { GamePicker } from './GamePicker';
import { DuplicateWishlistError, type WishlistItem } from './wishlistApi';
import {
  EMPTY_WISHLIST_FORM,
  normalizeTitle,
  toWishlistInsert,
  validateWishlistForm,
  wishlistFormFromItem,
  type WishlistErrors,
  type WishlistFormValues,
} from './wishlistForm';
import { useAddWishlistItem, useUpdateWishlistItem } from './useWishlist';

interface WishlistFormDialogProps {
  open: boolean;
  /** null = dodawanie nowej pozycji. */
  item: WishlistItem | null;
  existing: readonly WishlistItem[];
  onClose: () => void;
}

function WishlistForm({ item, existing, onClose }: Omit<WishlistFormDialogProps, 'open'>) {
  const toast = useToast();
  const add = useAddWishlistItem();
  const update = useUpdateWishlistItem();
  const [values, setValues] = useState<WishlistFormValues>(item ? wishlistFormFromItem(item) : EMPTY_WISHLIST_FORM);
  const [errors, setErrors] = useState<WishlistErrors>({});
  const busy = add.isPending || update.isPending;

  const set = <K extends keyof WishlistFormValues>(key: K, value: WishlistFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateWishlistForm(values);
    const duplicate = existing.some((w) => w.id !== item?.id && normalizeTitle(w.title) === normalizeTitle(values.title));
    if (duplicate) found.title = 'Ta gra jest już na liście życzeń.';
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    try {
      const input = toWishlistInsert(values);
      if (item) {
        await update.mutateAsync({ id: item.id, input });
        toast.success('Zapisano zmiany.');
      } else {
        await add.mutateAsync(input);
        toast.success(`Dodano „${input.title}” do listy życzeń.`);
      }
      onClose();
    } catch (err) {
      if (err instanceof DuplicateWishlistError) setErrors({ title: err.message });
      else toast.error(err instanceof Error ? `Nie udało się zapisać: ${err.message}` : 'Nie udało się zapisać.');
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
      <TextField label="Tytuł" required autoFocus value={values.title} onChange={(v) => set('title', v)} error={errors.title} maxLength={300} hint="Różne wydania rozróżnij w tytule, np. „(Edycja kolekcjonerska)”." />
      <TextField label="Docelowa cena zakupu (PLN)" value={values.targetPrice} onChange={(v) => set('targetPrice', v)} error={errors.targetPrice} inputMode="decimal" placeholder="np. 79,99" />
      <TextArea label="Notatki" rows={3} value={values.notes} onChange={(v) => set('notes', v)} error={errors.notes} />
      <div className="text-sm">
        <span className="mb-1 block text-muted">Powiązana gra z kolekcji (opcjonalnie)</span>
        <GamePicker value={values.gameId && values.gameTitle ? { id: values.gameId, title: values.gameTitle } : null} onChange={(g) => setValues((v) => ({ ...v, gameId: g?.id ?? null, gameTitle: g?.title ?? null }))} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Anuluj
        </Button>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Zapisywanie…' : item ? 'Zapisz zmiany' : 'Dodaj do listy'}
        </Button>
      </div>
    </form>
  );
}

export function WishlistFormDialog({ open, item, existing, onClose }: WishlistFormDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edytuj pozycję' : 'Dodaj do listy życzeń'}>
      <WishlistForm item={item} existing={existing} onClose={onClose} />
    </Modal>
  );
}
