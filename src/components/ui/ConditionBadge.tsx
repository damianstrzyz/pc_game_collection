import { CONDITION_MAX, getConditionInfo } from '@/constants/condition';

interface ConditionBadgeProps {
  value: number | null | undefined;
  /** Pokaż też opis słowny (np. na stronie szczegółów). */
  showLabel?: boolean;
}

export function ConditionBadge({ value, showLabel = false }: ConditionBadgeProps) {
  if (value == null) {
    return <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">Brak oceny</span>;
  }
  const info = getConditionInfo(value);
  return (
    <span
      title={`Stan: ${value} z ${CONDITION_MAX} (${info.label})`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${info.badgeClass}`}
    >
      {value}/{CONDITION_MAX}
      {showLabel && <span className="font-medium">{info.label}</span>}
    </span>
  );
}
