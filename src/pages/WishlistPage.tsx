import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Heart, PackageCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { MoveToCollectionDialog } from '@/features/wishlist/MoveToCollectionDialog';
import { WishlistFormDialog } from '@/features/wishlist/WishlistFormDialog';
import { useRemoveWishlistItem, useWishlist } from '@/features/wishlist/useWishlist';
import type { WishlistItem } from '@/features/wishlist/wishlistApi';
import { formatDate, formatPLN } from '@/lib/format';

export default function WishlistPage() {
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useWishlist();
  const remove = useRemoveWishlistItem();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const [moving, setMoving] = useState<WishlistItem | null>(null);
  const [deleting, setDeleting] = useState<WishlistItem | null>(null);

  const items = data ?? [];
  const budget = items.reduce((sum, w) => sum + (w.target_price ?? 0), 0);
  const priced = items.filter((w) => w.target_price !== null).length;

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WishlistItem) => {
    setEditing(item);
    setFormOpen(true);
  };

  const confirmRemove = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(`Usunięto „${deleting.title}” z listy życzeń.`);
      setDeleting(null);
    } catch (err) {
      setDeleting(null);
      toast.error(err instanceof Error ? `Nie udało się usunąć: ${err.message}` : 'Nie udało się usunąć pozycji.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Lista życzeń</h1>
          {data && items.length > 0 && (
            <p className="mt-1 text-sm text-muted">
              Pozycje: {items.length}. Łączna cena docelowa: {formatPLN(budget)}
              {priced < items.length && ` (podana przy ${priced} z ${items.length})`}.
            </p>
          )}
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          Dodaj do listy
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3" role="status" aria-label="Ładowanie listy życzeń">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Nie udało się wczytać listy życzeń"
          description={error instanceof Error ? error.message : undefined}
          action={<Button onClick={() => void refetch()}>Spróbuj ponownie</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Lista życzeń jest pusta"
          description="Dodaj gry, które chcesz kupić. Gry z tej listy nie wliczają się do kolekcji, dopóki ich nie przeniesiesz."
          action={<Button variant="primary" onClick={openAdd}>Dodaj pierwszą pozycję</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-card border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-0.5 text-sm text-muted">
                    Cena docelowa: {formatPLN(item.target_price)}. Dodano {formatDate(item.created_at)}.
                  </p>
                  {item.game_id && item.linked_title && (
                    <p className="mt-1 text-sm">
                      Powiązana z:{' '}
                      <Link to={`/kolekcja/${item.game_id}`} className="text-accent hover:underline">
                        {item.linked_title}
                      </Link>
                    </p>
                  )}
                  {item.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.notes}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="primary" onClick={() => setMoving(item)}>
                    <PackageCheck className="h-4 w-4" aria-hidden />
                    Kupiona
                  </Button>
                  <Button onClick={() => openEdit(item)} aria-label={`Edytuj: ${item.title}`}>
                    <Pencil className="h-4 w-4" aria-hidden />
                    <span className="sr-only sm:not-sr-only">Edytuj</span>
                  </Button>
                  <Button variant="ghost" onClick={() => setDeleting(item)} aria-label={`Usuń: ${item.title}`} className="text-cond-poor hover:text-cond-poor">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <WishlistFormDialog open={formOpen} item={editing} existing={items} onClose={() => setFormOpen(false)} />
      <MoveToCollectionDialog open={moving !== null} item={moving} onClose={() => setMoving(null)} />
      <ConfirmDialog
        open={deleting !== null}
        destructive
        busy={remove.isPending}
        title="Usunąć z listy życzeń?"
        description={deleting ? `Pozycja „${deleting.title}” zostanie usunięta z listy życzeń.` : undefined}
        confirmLabel="Usuń"
        onConfirm={() => void confirmRemove()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
