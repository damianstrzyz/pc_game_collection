import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART } from '@/constants/chartTheme';
import type { LabelCount } from '@/types/stats';
import { NoData } from './ChartCard';

export type CategoryVariant = 'bar' | 'horizontal' | 'pie' | 'line';

interface CategoryChartProps {
  data: readonly LabelCount[];
  variant: CategoryVariant;
  /** Nazwa wartości w podpowiedzi, np. „Liczba gier”. */
  valueLabel?: string;
  formatValue?: (value: number) => string;
  colorFor?: (label: string, index: number) => string;
}

export const tooltipStyle = {
  backgroundColor: CHART.tooltipBg,
  border: `1px solid ${CHART.grid}`,
  borderRadius: 12,
  color: '#e8ecf8',
  fontSize: 12,
} as const;

const truncate = (s: string, n = 18): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const defaultColor = (_label: string, i: number): string => CHART.palette[i % CHART.palette.length] ?? CHART.accent;

export function CategoryChart({ data, variant, valueLabel = 'Liczba gier', formatValue = String, colorFor = defaultColor }: CategoryChartProps) {
  if (data.length === 0) return <NoData />;
  const rows = data.map((d) => ({ ...d }));
  const tooltipFormatter = (value: unknown): [string, string] => [formatValue(Number(value)), valueLabel];
  const axis = { stroke: CHART.axis, fontSize: 12, tickLine: false } as const;

  if (variant === 'pie') {
    return (
      <div className="h-72" role="img" aria-label={`Wykres kołowy: ${valueLabel}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="label" innerRadius="45%" outerRadius="80%" paddingAngle={2} stroke="none">
              {rows.map((d, i) => (
                <Cell key={`${d.label}-${i}`} fill={colorFor(d.label, i)} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div style={{ height: Math.max(220, rows.length * 32 + 40) }} role="img" aria-label={`Wykres słupkowy poziomy: ${valueLabel}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke={CHART.grid} horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...axis} />
            <YAxis type="category" dataKey="label" width={130} tickFormatter={(v: string) => truncate(v)} {...axis} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} formatter={tooltipFormatter} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {rows.map((d, i) => (
                <Cell key={`${d.label}-${i}`} fill={colorFor(d.label, i)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (variant === 'line') {
    return (
      <div className="h-72" role="img" aria-label={`Wykres liniowy: ${valueLabel}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ left: 0, right: 16 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" {...axis} />
            <YAxis allowDecimals={false} width={40} {...axis} />
            <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
            <Line type="monotone" dataKey="count" stroke={CHART.accent} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-72" role="img" aria-label={`Wykres słupkowy: ${valueLabel}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: 0, right: 16 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" interval="preserveStartEnd" {...axis} />
          <YAxis allowDecimals={false} width={40} {...axis} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} formatter={tooltipFormatter} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {rows.map((d, i) => (
              <Cell key={`${d.label}-${i}`} fill={colorFor(d.label, i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
