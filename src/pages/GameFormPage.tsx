import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { GameForm, type SubmitIntent } from '@/features/games/GameForm';
import { EMPTY_FORM, formFromGame, toGameInsert, type FieldErrors, type GameFormValues } from '@/features/games/gameForm';
import { DuplicateEanError } from '@/features/games/gamesApi';
import { useCreateGame, useFilterOptions, useGame, useUpdateGame } from '@/features/games/useGames';
import { hasPhotoChanges, type PhotoChanges } from '@/features/games/photosApi';
import { useGamePhotos, useSavePhotos } from '@/features/games/usePhotos';

/** Przy dodawaniu kolejnych gier z rzędu zachowujemy dane zwykle wspólne dla serii. */
function carryOver(v: GameFormValues): GameFormValues {
  return { ...EMPTY_FORM, language: v.language, publisher: v.publisher, polishPublisher: v.polishPublisher, discType: v.discType };
}

export default function GameFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const gameQuery = useGame(id);
  const { data: options } = useFilterOptions();
  const create = useCreateGame();
  const update = useUpdateGame();
  const photosQuery = useGamePhotos(id);
  const savePhotos = useSavePhotos();

  const [formKey, setFormKey] = useState(0);
  const [blank, setBlank] = useState<GameFormValues>(EMPTY_FORM);

  const handleSubmit = async (values: GameFormValues, intent: SubmitIntent, photos: PhotoChanges): Promise<FieldErrors | null> => {
    try {
      const input = toGameInsert(values);
      if (id) {
        await update.mutateAsync({ id, input });
        if (hasPhotoChanges(photos)) {
          try {
            await savePhotos.mutateAsync({
              gameId: id,
              existing: { coverImage: gameQuery.data?.cover_image ?? null, photos: photosQuery.data ?? [] },
              changes: photos,
            });
          } catch (err) {
            toast.error(`Dane gry zapisano, ale zdjęć nie udało się zaktualizować: ${err instanceof Error ? err.message : 'nieznany błąd'}`);
            return null;
          }
        }
        toast.success('Zapisano zmiany.');
        navigate(`/kolekcja/${id}`);
      } else {
        const created = await create.mutateAsync(input);
        if (hasPhotoChanges(photos)) {
          try {
            await savePhotos.mutateAsync({ gameId: created.id, existing: { coverImage: null, photos: [] }, changes: photos });
          } catch (err) {
            toast.error(`Dodano grę, ale nie udało się wysłać zdjęć: ${err instanceof Error ? err.message : 'nieznany błąd'}. Spróbuj ponownie w edycji.`);
            navigate(`/kolekcja/${created.id}/edycja`);
            return null;
          }
        }
        toast.success(`Dodano grę „${created.title}”.`);
        if (intent === 'save-and-next') {
          setBlank(carryOver(values));
          setFormKey((k) => k + 1);
          window.scrollTo({ top: 0 });
        } else {
          navigate(`/kolekcja/${created.id}`);
        }
      }
      return null;
    } catch (err) {
      if (err instanceof DuplicateEanError) {
        toast.error(err.message);
        return { ean: err.message };
      }
      toast.error(err instanceof Error ? `Nie udało się zapisać: ${err.message}` : 'Nie udało się zapisać gry.');
      return null;
    }
  };

  if (isEdit && gameQuery.isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Ładowanie formularza">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isEdit && (gameQuery.isError || !gameQuery.data)) {
    return (
      <EmptyState
        icon={SearchX}
        title="Nie znaleziono gry"
        description="Ta gra mogła zostać usunięta."
        action={<Link to="/kolekcja" className="text-accent">Wróć do kolekcji</Link>}
      />
    );
  }

  const initial = gameQuery.data ? formFromGame(gameQuery.data) : blank;
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-semibold">{isEdit ? 'Edytuj grę' : 'Dodaj grę'}</h1>
      <GameForm
        key={isEdit ? id : formKey}
        initial={initial}
        mode={isEdit ? 'edit' : 'create'}
        submitting={create.isPending || update.isPending || savePhotos.isPending}
        existingCover={gameQuery.data?.cover_image ?? null}
        existingPhotos={photosQuery.data ?? []}
        options={options}
        cancelTo={isEdit && id ? `/kolekcja/${id}` : '/kolekcja'}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
