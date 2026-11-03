import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FormSection, FormSelect, Segmented, TextArea, TextField } from '@/components/ui/fields';
import { DISC_TYPE_OPTIONS, TRI_STATE_OPTIONS } from '@/constants/options';
import type { DiscType, FilterOptions, GamePhotoRow } from '@/types/database';
import { ConditionPicker } from './ConditionPicker';
import { PhotoEditor } from './PhotoEditor';
import { NO_PHOTO_CHANGES, type PhotoChanges } from './photosApi';
import { validateGameForm, type FieldErrors, type GameFormValues } from './gameForm';

export type SubmitIntent = 'save' | 'save-and-next';

interface GameFormProps {
  initial: GameFormValues;
  mode: 'create' | 'edit';
  submitting: boolean;
  options: FilterOptions | undefined;
  cancelTo: string;
  existingCover?: string | null;
  existingPhotos?: readonly GamePhotoRow[];
  /** Zwraca błędy pól zgłoszone przez serwer (np. duplikat EAN) albo null, gdy zapis się udał. */
  onSubmit: (values: GameFormValues, intent: SubmitIntent, photos: PhotoChanges) => Promise<FieldErrors | null>;
}

function Suggestions({ id, values }: { id: string; values: readonly string[] | undefined }) {
  return (
    <datalist id={id}>
      {(values ?? []).map((v) => (
        <option key={v} value={v} />
      ))}
    </datalist>
  );
}

export function GameForm({ initial, mode, submitting, options, cancelTo, existingCover = null, existingPhotos = [], onSubmit }: GameFormProps) {
  const [values, setValues] = useState<GameFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [photos, setPhotos] = useState<PhotoChanges>(NO_PHOTO_CHANGES);
  const formRef = useRef<HTMLFormElement>(null);

  const set = <K extends keyof GameFormValues>(key: K, value: GameFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const focusFirstError = () => {
    // Odczekujemy render, aby pola miały już atrybut aria-invalid.
    window.setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
  };

  const submit = async (intent: SubmitIntent) => {
    const found = validateGameForm(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      focusFirstError();
      return;
    }
    const serverErrors = await onSubmit(values, intent, photos);
    if (serverErrors) {
      setErrors(serverErrors);
      focusFirstError();
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit('save');
  };

  return (
    <form ref={formRef} onSubmit={onFormSubmit} noValidate className="space-y-5">
      <Suggestions id="dl-language" values={options?.languages} />
      <Suggestions id="dl-developer" values={options?.developers} />
      <Suggestions id="dl-publisher" values={options?.publishers} />
      <Suggestions id="dl-polish-publisher" values={options?.polish_publishers} />

      <FormSection title="Podstawowe informacje">
        <div className="sm:col-span-2">
          <TextField label="Tytuł" required value={values.title} onChange={(v) => set('title', v)} error={errors.title} maxLength={300} autoFocus={mode === 'create'} />
        </div>
        <TextField label="Język gry i opakowania" value={values.language} onChange={(v) => set('language', v)} error={errors.language} list="dl-language" placeholder="np. polski" />
        <TextField label="EAN (kod kreskowy)" value={values.ean} onChange={(v) => set('ean', v)} error={errors.ean} inputMode="numeric" hint="8–14 cyfr; spacje i myślniki zostaną usunięte." />
        <TextField label="Producent (studio)" value={values.developer} onChange={(v) => set('developer', v)} error={errors.developer} list="dl-developer" />
        <TextField label="Wydawca" value={values.publisher} onChange={(v) => set('publisher', v)} error={errors.publisher} list="dl-publisher" />
        <TextField label="Polski wydawca" value={values.polishPublisher} onChange={(v) => set('polishPublisher', v)} error={errors.polishPublisher} list="dl-polish-publisher" />
      </FormSection>

      <FormSection title="Wydanie i edycja">
        <TextField label="Edycja" value={values.edition} onChange={(v) => set('edition', v)} error={errors.edition} placeholder="np. Edycja kolekcjonerska" />
        <TextField label="Rok wydania" value={values.releaseYear} onChange={(v) => set('releaseYear', v)} error={errors.releaseYear} inputMode="numeric" maxLength={4} placeholder="np. 2007" />
      </FormSection>

      <FormSection title="Zawartość pudełka">
        <Segmented label="Okładka zewnętrzna (outer sleeve)" value={values.outerSleeve} options={TRI_STATE_OPTIONS} onChange={(v) => set('outerSleeve', v)} />
        <Segmented label="Oryginalna instrukcja" value={values.manual} options={TRI_STATE_OPTIONS} onChange={(v) => set('manual', v)} />
        <Segmented label="Poradnik do gry" value={values.strategyGuide} options={TRI_STATE_OPTIONS} onChange={(v) => set('strategyGuide', v)} />
        <Segmented label="Plakat lub mapa" value={values.posterMap} options={TRI_STATE_OPTIONS} onChange={(v) => set('posterMap', v)} />
        <TextField label="Liczba płyt" value={values.discCount} onChange={(v) => set('discCount', v)} error={errors.discCount} inputMode="numeric" maxLength={2} />
        <FormSelect
          label="Rodzaj nośnika"
          value={values.discType}
          onChange={(v) => set('discType', v as DiscType | '')}
          options={DISC_TYPE_OPTIONS}
          error={errors.discType}
        />
        <div className="sm:col-span-2">
          <TextArea label="Inna zawartość" value={values.otherContents} onChange={(v) => set('otherContents', v)} error={errors.otherContents} rows={2} placeholder="np. soundtrack, naklejki, karta rejestracyjna" />
        </div>
      </FormSection>

      <FormSection title="Informacje o zakupie">
        <TextField label="Cena zakupu (PLN)" value={values.purchasePrice} onChange={(v) => set('purchasePrice', v)} error={errors.purchasePrice} inputMode="decimal" placeholder="np. 49,99" />
        <TextField label="Data zakupu" type="date" value={values.purchaseDate} onChange={(v) => set('purchaseDate', v)} error={errors.purchaseDate} />
      </FormSection>

      <FormSection title="Stan zachowania" description="Skala 1–11, gdzie 11 oznacza stan idealny (jak nowa).">
        <ConditionPicker value={values.condition} onChange={(v) => set('condition', v)} error={errors.condition} />
      </FormSection>

      <FormSection title="Zdjęcia">
        <PhotoEditor existingCover={existingCover} existingPhotos={existingPhotos} value={photos} onChange={setPhotos} />
      </FormSection>

      <FormSection title="Notatki i dodatkowe informacje">
        <div className="sm:col-span-2">
          <TextArea label="Notatki" value={values.notes} onChange={(v) => set('notes', v)} error={errors.notes} />
        </div>
        <div className="sm:col-span-2">
          <TextField label="Link do strony o grze" type="url" value={values.externalUrl} onChange={(v) => set('externalUrl', v)} error={errors.externalUrl} placeholder="https://" />
        </div>
      </FormSection>

      <div className="sticky bottom-16 z-20 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:-mx-8 lg:px-8">
        <Link to={cancelTo} className="inline-flex h-10 items-center rounded-xl px-4 text-sm text-muted hover:text-ink">
          Anuluj
        </Link>
        {mode === 'create' && (
          <Button onClick={() => void submit('save-and-next')} disabled={submitting}>
            Zapisz i dodaj kolejną
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Zapisywanie…' : mode === 'create' ? 'Dodaj grę' : 'Zapisz zmiany'}
        </Button>
      </div>
    </form>
  );
}
