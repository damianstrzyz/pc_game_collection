import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/fields';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ConditionPicker } from '@/features/games/ConditionPicker';
import { parsePrice } from '@/features/games/gameForm';
import { todayISO } from '@/lib/format';
import type { WishlistItem } from './wishlistApi';
import { useMoveToCollection } from './useWishlist';

interface MoveToCollectionDialogProps {
  open: boolean;
  item: WishlistItem | null;
  onClose: () => void;
}

function MoveForm({ item, onClose }: { item: WishlistItem; onClose: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const move = useMoveToCollection();

  const [price, setPrice] = useState(item.target_price === null ? '' : String(item.target_price).replace('.', ','));
  const [date, setDate] = useState(todayISO());
  const [condition, setCondition] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ price?: string; date?: string }>({});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found: { price?: string; date?: string } = {};
    if (price.trim() && parsePrice(price) === null) found.price = 'Podaj cenę w PLN, np. 49,99.';
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) found.date = 'Podaj poprawną datę.';
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    try {
      const gameId = await move.mutateAsync({
        wishlistId: item.id,
        purchasePrice: parsePrice(price),
        purchaseDate: date || null,
        condition,
      });
      toast.success(`„${item.title}” trafiła do kolekcji. Uzupełnij pozostałe szczegóły.`);
      onClose();
      navigate(`/kolekcja/${gameId}/edycja`);
    } catch (err) {
      toast.error(err instanceof Error ? `Nie udało się przenieść: ${err.message}` : 'Nie udało się przenieść gry.');
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
      <p className="text-sm text-muted">
        „{item.title}” zostanie usunięta z listy życzeń i dodana do kolekcji. Dane zakupu możesz poprawić teraz lub później.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Cena zakupu (PLN)" value={price} onChange={(v) => { setPrice(v); setErrors((x) => ({ ...x, price: undefined })); }} error={errors.price} inputMode="decimal" autoFocus />
        <TextField label="Data zakupu" type="date" value={date} onChange={(v) => { setDate(v); setErrors((x) => ({ ...x, date: undefined })); }} error={errors.date} />
      </div>
      <div>
        <span className="mb-2 block text-sm text-muted">Stan zachowania (opcjonalnie)</span>
        <ConditionPicker value={condition} onChange={setCondition} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} disabled={move.isPending}>
          Anuluj
        </Button>
        <Button type="submit" variant="primary" disabled={move.isPending}>
          {move.isPending ? 'Przenoszenie…' : 'Przenieś do kolekcji'}
        </Button>
      </div>
    </form>
  );
}

export function MoveToCollectionDialog({ open, item, onClose }: MoveToCollectionDialogProps) {
  return (
    <Modal open={open && item !== null} onClose={onClose} title="Przenieś do kolekcji">
      {item && <MoveForm item={item} onClose={onClose} />}
    </Modal>
  );
}
