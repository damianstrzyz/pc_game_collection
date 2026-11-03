import type { FilterOptions } from '@/types/database';
import { DISC_TYPE_OPTIONS } from '@/constants/options';
import { SelectField } from '@/components/ui/SelectField';
import type { CatalogFilters as Filters } from './catalogParams';
import type { DiscType } from '@/types/database';

interface CatalogFiltersProps {
  filters: Filters;
  options: FilterOptions | undefined;
  onChange: (patch: Partial<Filters>) => void;
}

const strings = (values: readonly string[] | undefined) => (values ?? []).map((v) => ({ value: v, label: v }));
const numbers = (values: readonly number[] | undefined) => (values ?? []).map((v) => ({ value: String(v), label: String(v) }));
const toNumber = (v: string): number | null => (v === '' ? null : Number(v));
const CONDITION_CHOICES = Array.from({ length: 11 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

export function CatalogFilters({ filters, options, onChange }: CatalogFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <SelectField label="Rok wydania" value={filters.year?.toString() ?? ''} options={numbers(options?.years)} onChange={(v) => onChange({ year: toNumber(v) })} />
      <SelectField label="Producent (studio)" value={filters.developer} options={strings(options?.developers)} onChange={(v) => onChange({ developer: v })} />
      <SelectField label="Wydawca" value={filters.publisher} options={strings(options?.publishers)} onChange={(v) => onChange({ publisher: v })} />
      <SelectField label="Polski wydawca" value={filters.polishPublisher} options={strings(options?.polish_publishers)} onChange={(v) => onChange({ polishPublisher: v })} />
      <SelectField label="Język" value={filters.language} options={strings(options?.languages)} onChange={(v) => onChange({ language: v })} />
      <SelectField
        label="Nośnik"
        value={filters.discType ?? ''}
        options={DISC_TYPE_OPTIONS}
        onChange={(v) => onChange({ discType: v === '' ? null : (v as DiscType) })}
      />
      <SelectField label="Liczba płyt" value={filters.discCount?.toString() ?? ''} options={numbers(options?.disc_counts)} onChange={(v) => onChange({ discCount: toNumber(v) })} allLabel="Dowolna" />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Stan od" value={filters.conditionMin?.toString() ?? ''} options={CONDITION_CHOICES} onChange={(v) => onChange({ conditionMin: toNumber(v) })} allLabel="1" />
        <SelectField label="Stan do" value={filters.conditionMax?.toString() ?? ''} options={CONDITION_CHOICES} onChange={(v) => onChange({ conditionMax: toNumber(v) })} allLabel="11" />
      </div>
    </div>
  );
}
