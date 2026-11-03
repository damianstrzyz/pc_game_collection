import { CONDITION_MAX, CONDITION_MIN, getConditionInfo } from '@/constants/condition';

interface ConditionPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string;
}

const VALUES = Array.from({ length: CONDITION_MAX - CONDITION_MIN + 1 }, (_, i) => CONDITION_MIN + i);

export function ConditionPicker({ value, onChange, error }: ConditionPickerProps) {
  const info = value === null ? null : getConditionInfo(value);
  return (
    <div className="sm:col-span-2">
      <div role="radiogroup" aria-label="Stan zachowania w skali 1–11" className="flex flex-wrap gap-1.5">
        {VALUES.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? null : n)}
              className={`h-10 w-10 rounded-xl border text-sm font-semibold transition-colors ${getConditionInfo(n).badgeClass} ${
                selected ? 'ring-2 ring-ink' : 'opacity-60 hover:opacity-100'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {info ? `${value}/${CONDITION_MAX}: ${info.label}` : 'Nie oceniono. Kliknij ocenę, a ponowne kliknięcie ją usunie.'}
      </p>
      <p className="mt-1 text-xs text-muted">Ocena dotyczy całości: pudełka, zawartości i nośników.</p>
      {error && <p role="alert" className="mt-1 text-xs text-cond-poor">{error}</p>}
    </div>
  );
}
