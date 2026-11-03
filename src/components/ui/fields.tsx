import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

const control =
  'w-full rounded-xl border bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-accent/60';

interface FieldShellProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FieldShell({ id, label, required, hint, error, children }: FieldShellProps) {
  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block text-muted">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-cond-poor">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}

export function TextField({ label, value, onChange, hint, error, required, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error}>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        required={required}
        className={`${control} h-10 ${error ? 'border-cond-poor' : 'border-line'}`}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}

export function TextArea({ label, value, onChange, hint, error, required, rows = 4, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={`${control} py-2 ${error ? 'border-cond-poor' : 'border-line'}`}
        {...rest}
      />
    </FieldShell>
  );
}

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  emptyLabel?: string;
  error?: string;
}

export function FormSelect({ label, value, onChange, options, emptyLabel = 'Nie wybrano', error }: FormSelectProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`${control} h-10 ${error ? 'border-cond-poor' : 'border-line'}`}
      >
        <option value="">{emptyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

/** Przełącznik typu Tak / Nie / Nie wiem. */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  const id = useId();
  return (
    <div className="text-sm">
      <span id={id} className="mb-1 block text-muted">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={id} className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl border border-line bg-surface p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`h-8 rounded-lg px-2 text-sm transition-colors ${
              value === o.value ? 'bg-raised text-accent' : 'text-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-card border border-line bg-surface/50 p-5">
      <legend className="px-2 text-base font-semibold">{title}</legend>
      {description && <p className="mb-4 text-sm text-muted">{description}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
