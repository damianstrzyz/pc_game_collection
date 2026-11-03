import { useState } from 'react';
import { AlertCircle, Library } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CategoryChart, type CategoryVariant } from '@/components/charts/CategoryChart';
import { ChartCard } from '@/components/charts/ChartCard';
import { TimeSeriesChart, type TimeVariant } from '@/components/charts/TimeSeriesChart';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { conditionColor } from '@/constants/chartTheme';
import { useCollectionStats } from '@/features/stats/statsApi';
import { cumulative, fillMonths, fullConditionData, MEDIA_LABEL, monthLabel } from '@/features/stats/statsTransforms';
import { formatPLN } from '@/lib/format';

const COLUMN_OR_LINE = [
  { value: 'bar', label: 'Słupki' },
  { value: 'line', label: 'Linia' },
] as const;
const LIST_VARIANTS = [
  { value: 'horizontal', label: 'Słupki' },
  { value: 'pie', label: 'Kołowy' },
] as const;
const PIE_FIRST = [
  { value: 'pie', label: 'Kołowy' },
  { value: 'bar', label: 'Słupki' },
] as const;
const CUMULATIVE_VARIANTS = [
  { value: 'area', label: 'Narastająco' },
  { value: 'bar', label: 'Nowe w miesiącu' },
] as const;
const MONEY_VARIANTS = [
  { value: 'bar', label: 'Słupki' },
  { value: 'line', label: 'Linia' },
] as const;

export default function StatsPage() {
  const { data, isLoading, isError, error, refetch } = useCollectionStats();

  const [sizeV, setSizeV] = useState<TimeVariant>('area');
  const [yearV, setYearV] = useState<CategoryVariant>('bar');
  const [devV, setDevV] = useState<CategoryVariant>('horizontal');
  const [pubV, setPubV] = useState<CategoryVariant>('horizontal');
  const [plPubV, setPlPubV] = useState<CategoryVariant>('horizontal');
  const [langV, setLangV] = useState<CategoryVariant>('pie');
  const [mediaV, setMediaV] = useState<CategoryVariant>('pie');
  const [condV, setCondV] = useState<CategoryVariant>('bar');
  const [costV, setCostV] = useState<TimeVariant>('bar');
  const [avgV, setAvgV] = useState<TimeVariant>('line');

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Ładowanie statystyk">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Nie udało się wczytać statystyk"
        description={error instanceof Error ? error.message : undefined}
        action={<Button onClick={() => void refetch()}>Spróbuj ponownie</Button>}
      />
    );
  }
  if (data.totals.count === 0) {
    return (
      <EmptyState
        icon={Library}
        title="Brak danych do statystyk"
        description="Dodaj gry do kolekcji, a wykresy powstaną z Twoich rekordów."
        action={
          <Link to="/dodaj" className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-bg">
            Dodaj grę
          </Link>
        }
      />
    );
  }

  const monthly = fillMonths(data.acquired_by_month.map((m) => ({ month: m.month, value: m.count })));
  const sizeData = (sizeV === 'area' ? cumulative(monthly) : monthly).map((p) => ({ label: monthLabel(p.month), value: p.value }));
  const costData = fillMonths(data.costs_by_month.map((m) => ({ month: m.month, value: m.total }))).map((p) => ({ label: monthLabel(p.month), value: p.value }));
  const avgData = data.avg_price_by_year.map((y) => ({ label: String(y.year), value: y.avg }));
  const media = data.by_media.map((m) => ({ label: MEDIA_LABEL[m.label] ?? m.label, count: m.count }));
  const expensive = data.most_expensive.map((g) => ({ label: g.title, count: g.purchase_price ?? 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Statystyki</h1>
        <p className="mt-1 text-sm text-muted">Wszystkie wykresy liczone są z rekordów kolekcji. Kwoty w PLN.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Wielkość kolekcji w czasie" description="Wg daty zakupu, a gdy jej brak, wg daty dodania" variants={CUMULATIVE_VARIANTS} variant={sizeV === 'bar' ? 'bar' : 'area'} onVariantChange={setSizeV}>
          <TimeSeriesChart data={sizeData} variant={sizeV} valueLabel={sizeV === 'area' ? 'Gier w kolekcji' : 'Nowych gier'} />
        </ChartCard>

        <ChartCard title="Gry wg roku wydania" variants={COLUMN_OR_LINE} variant={yearV === 'line' ? 'line' : 'bar'} onVariantChange={setYearV}>
          <CategoryChart data={data.by_year} variant={yearV} />
        </ChartCard>

        <ChartCard title="Gry wg producenta" description="20 najczęstszych" variants={LIST_VARIANTS} variant={devV === 'pie' ? 'pie' : 'horizontal'} onVariantChange={setDevV}>
          <CategoryChart data={data.by_developer} variant={devV} />
        </ChartCard>

        <ChartCard title="Gry wg wydawcy" description="20 najczęstszych" variants={LIST_VARIANTS} variant={pubV === 'pie' ? 'pie' : 'horizontal'} onVariantChange={setPubV}>
          <CategoryChart data={data.by_publisher} variant={pubV} />
        </ChartCard>

        <ChartCard title="Gry wg polskiego wydawcy" description="20 najczęstszych" variants={LIST_VARIANTS} variant={plPubV === 'pie' ? 'pie' : 'horizontal'} onVariantChange={setPlPubV}>
          <CategoryChart data={data.by_polish_publisher} variant={plPubV} />
        </ChartCard>

        <ChartCard title="Gry wg języka" variants={PIE_FIRST} variant={langV === 'bar' ? 'bar' : 'pie'} onVariantChange={setLangV}>
          <CategoryChart data={data.by_language} variant={langV} />
        </ChartCard>

        <ChartCard title="Gry wg rodzaju nośnika" variants={PIE_FIRST} variant={mediaV === 'bar' ? 'bar' : 'pie'} onVariantChange={setMediaV}>
          <CategoryChart data={media} variant={mediaV} />
        </ChartCard>

        <ChartCard title="Rozkład stanu zachowania" description="Skala 1–11" variants={[{ value: 'bar', label: 'Słupki' }, { value: 'pie', label: 'Kołowy' }]} variant={condV === 'pie' ? 'pie' : 'bar'} onVariantChange={setCondV}>
          <CategoryChart data={condV === 'pie' ? fullConditionData(data.by_condition).filter((c) => c.count > 0) : fullConditionData(data.by_condition)} variant={condV} colorFor={(label) => conditionColor(Number(label))} />
        </ChartCard>

        <ChartCard title="Koszty zakupów w czasie" description="Suma cen wg miesiąca zakupu" variants={MONEY_VARIANTS} variant={costV === 'line' ? 'line' : 'bar'} onVariantChange={setCostV}>
          <TimeSeriesChart data={costData} variant={costV} valueLabel="Wydano" formatValue={formatPLN} />
        </ChartCard>

        <ChartCard title="Średnia cena zakupu wg roku" description="Wg roku zakupu" variants={COLUMN_OR_LINE} variant={avgV === 'bar' ? 'bar' : 'line'} onVariantChange={setAvgV}>
          <TimeSeriesChart data={avgData} variant={avgV} valueLabel="Średnia cena" formatValue={formatPLN} />
        </ChartCard>

        <ChartCard title="Najdroższe gry w kolekcji" description="Wg ceny zakupu">
          <CategoryChart data={expensive} variant="horizontal" valueLabel="Cena zakupu" formatValue={formatPLN} />
        </ChartCard>
      </div>
    </div>
  );
}
