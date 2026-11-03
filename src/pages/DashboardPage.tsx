import { Link } from 'react-router-dom';
import { AlertCircle, Banknote, Disc, Disc3, Gamepad2, Library, Wallet } from 'lucide-react';
import { ChartCard } from '@/components/charts/ChartCard';
import { CategoryChart } from '@/components/charts/CategoryChart';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { StatCard } from '@/components/ui/StatCard';
import { conditionColor } from '@/constants/chartTheme';
import { GameMiniList } from '@/features/stats/GameMiniList';
import { RankList } from '@/features/stats/RankList';
import { useCollectionStats } from '@/features/stats/statsApi';
import { fullConditionData } from '@/features/stats/statsTransforms';
import { formatPLN, pluralGames } from '@/lib/format';

const catalogHref = (param: string) => (label: string) => `/kolekcja?${new URLSearchParams({ [param]: label }).toString()}`;

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useCollectionStats();

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Ładowanie dashboardu">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
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
        title="Dashboard pojawi się, gdy dodasz pierwszą grę"
        description="Statystyki są liczone z rekordów w Twojej kolekcji."
        action={
          <Link to="/dodaj" className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-bg">
            Dodaj grę
          </Link>
        }
      />
    );
  }

  const media = (type: string) => data.by_media.find((m) => m.label === type)?.count ?? 0;
  const { totals } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Przegląd całej kolekcji. Kwoty w PLN.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={Gamepad2} label="Liczba gier" value={String(totals.count)} hint={pluralGames(totals.count)} />
        <StatCard icon={Wallet} label="Łączny koszt" value={formatPLN(totals.total_cost)} hint={`Z ceną podaną przy ${totals.priced_count} z ${totals.count}`} />
        <StatCard icon={Banknote} label="Średnia cena" value={formatPLN(totals.avg_price)} />
        <StatCard icon={Disc3} label="Gry na DVD" value={String(media('DVD'))} hint={media('DVD+CD') > 0 ? `Plus ${media('DVD+CD')} na DVD + CD` : undefined} />
        <StatCard icon={Disc} label="Gry na CD" value={String(media('CD'))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Stan zachowania" description="Liczba gier w skali 1–11">
          <CategoryChart data={fullConditionData(data.by_condition)} variant="bar" colorFor={(label) => conditionColor(Number(label))} />
        </ChartCard>
        <ChartCard title="Gry wg roku wydania">
          <CategoryChart data={data.by_year} variant="bar" />
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RankList title="Producenci" items={data.by_developer} hrefFor={catalogHref('dev')} />
        <RankList title="Wydawcy" items={data.by_publisher} hrefFor={catalogHref('pub')} />
        <RankList title="Polscy wydawcy" items={data.by_polish_publisher} hrefFor={catalogHref('plpub')} />
        <RankList title="Języki" items={data.by_language} hrefFor={catalogHref('lang')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GameMiniList title="Ostatnio dodane" games={data.recent} detail="added" />
        <GameMiniList title="Ostatnie zakupy" games={data.latest_purchases} detail="purchase" />
        <GameMiniList title="Najwyższe ceny zakupu" games={data.most_expensive.slice(0, 6)} detail="price" />
      </div>
    </div>
  );
}
