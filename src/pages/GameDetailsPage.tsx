import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, SearchX, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { ConditionPicker } from '@/features/games/ConditionPicker';
import { GameDetails } from '@/features/games/GameDetails';
import { useDeleteGame, useGame, useUpdateGame } from '@/features/games/useGames';
import { PhotoGallery, type GalleryImage } from '@/features/games/PhotoGallery';
import { thumbPath } from '@/features/games/photosApi';
import { useGamePhotos, useSignedUrls } from '@/features/games/usePhotos';

export default function GameDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: game, isLoading, isError, error, refetch } = useGame(id);
  const update = useUpdateGame();
  const remove = useDeleteGame();
  const { data: photos } = useGamePhotos(id);

  const imagePaths = [...(game?.cover_image ? [game.cover_image] : []), ...(photos ?? []).map((p) => p.image_path)];
  const { data: urls } = useSignedUrls(imagePaths.flatMap((p) => [p, thumbPath(p)]));

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState(false);
  const [draftCondition, setDraftCondition] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Ładowanie gry">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        title="Nie udało się wczytać gry"
        description={error instanceof Error ? error.message : undefined}
        action={<Button onClick={() => void refetch()}>Spróbuj ponownie</Button>}
      />
    );
  }
  if (!game) {
    return (
      <EmptyState
        icon={SearchX}
        title="Nie znaleziono gry"
        description="Ta gra mogła zostać usunięta."
        action={<Link to="/kolekcja" className="text-accent">Wróć do kolekcji</Link>}
      />
    );
  }

  const saveCondition = async () => {
    try {
      await update.mutateAsync({ id: game.id, input: { condition: draftCondition } });
      toast.success('Zaktualizowano stan gry.');
      setEditingCondition(false);
    } catch (err) {
      toast.error(err instanceof Error ? `Nie udało się zapisać: ${err.message}` : 'Nie udało się zapisać stanu.');
    }
  };

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(game.id);
      toast.success(`Usunięto grę „${game.title}”.`);
      navigate('/kolekcja', { replace: true });
    } catch (err) {
      setConfirmOpen(false);
      toast.error(err instanceof Error ? `Nie udało się usunąć: ${err.message}` : 'Nie udało się usunąć gry.');
    }
  };

  // Galeria pojawia się, gdy są dodatkowe zdjęcia; okładka jest w niej pierwsza.
  const gallery: GalleryImage[] =
    (photos ?? []).length > 0
      ? [
          ...(game.cover_image
            ? [{ id: 'cover', thumbUrl: urls?.[thumbPath(game.cover_image)] ?? null, fullUrl: urls?.[game.cover_image] ?? null, alt: `Okładka: ${game.title}` }]
            : []),
          ...(photos ?? []).map((p, i) => ({
            id: p.id,
            thumbUrl: urls?.[thumbPath(p.image_path)] ?? null,
            fullUrl: urls?.[p.image_path] ?? null,
            alt: `Zdjęcie ${i + 1}: ${game.title}`,
          })),
        ]
      : [];

  return (
    <div className="space-y-5">
      <Link to="/kolekcja" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Moja kolekcja
      </Link>

      <GameDetails
        game={game}
        coverUrl={game.cover_image ? urls?.[game.cover_image] : null}
        actions={
          <>
            <Link to={`/kolekcja/${game.id}/edycja`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-bg hover:brightness-110">
              <Pencil className="h-4 w-4" aria-hidden />
              Edytuj
            </Link>
            <Button
              onClick={() => {
                setDraftCondition(game.condition);
                setEditingCondition((v) => !v);
              }}
            >
              <Star className="h-4 w-4" aria-hidden />
              Zmień stan
            </Button>
            <Button variant="ghost" onClick={() => setConfirmOpen(true)} className="text-cond-poor hover:text-cond-poor">
              <Trash2 className="h-4 w-4" aria-hidden />
              Usuń
            </Button>
          </>
        }
        conditionEditor={
          editingCondition && (
            <div className="space-y-3 rounded-card border border-line bg-surface/50 p-4">
              <ConditionPicker value={draftCondition} onChange={setDraftCondition} />
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => void saveCondition()} disabled={update.isPending}>
                  {update.isPending ? 'Zapisywanie…' : 'Zapisz stan'}
                </Button>
                <Button variant="ghost" onClick={() => setEditingCondition(false)}>
                  Anuluj
                </Button>
              </div>
            </div>
          )
        }
      />


      {gallery.length > 0 && <PhotoGallery images={gallery} />}

      <ConfirmDialog
        open={confirmOpen}
        destructive
        busy={remove.isPending}
        title="Usunąć tę grę?"
        description={`Gra „${game.title}” zostanie trwale usunięta z kolekcji. Tej operacji nie można cofnąć.`}
        confirmLabel="Usuń grę"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
