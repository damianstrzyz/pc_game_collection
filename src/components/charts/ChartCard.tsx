import type { ReactNode } from 'react';

interface ChartCardProps<T extends string> {
  title: string;
  description?: string;
  variants?: ReadonlyArray<{ value: T; label: string }>;
  variant?: T;
  onVariantChange?: (value: T) => void;
  children: ReactNode;
}

export function ChartCard<T extends string>({ title, description, variants, variant, onVariantChange, children }: ChartCardProps<T>) {
  return (
    <section className="rounded-card border border-line bg-surface/50 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        {variants && variant && onVariantChange && (
          <div role="group" aria-label={`Typ wykresu: ${title}`} className="flex gap-1 rounded-lg border border-line p-0.5">
            {variants.map((v) => (
              <button
                key={v.value}
                type="button"
                aria-pressed={variant === v.value}
                onClick={() => onVariantChange(v.value)}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${variant === v.value ? 'bg-raised text-accent' : 'text-muted hover:text-ink'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

export function NoData({ text = 'Brak danych do wyświetlenia.' }: { text?: string }) {
  return <p className="grid h-40 place-items-center text-sm text-muted">{text}</p>;
}
