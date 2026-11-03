import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART } from '@/constants/chartTheme';
import { NoData } from './ChartCard';
import { tooltipStyle } from './CategoryChart';

export type TimeVariant = 'line' | 'area' | 'bar';

interface TimeSeriesChartProps {
  data: ReadonlyArray<{ label: string; value: number }>;
  variant: TimeVariant;
  valueLabel: string;
  formatValue?: (value: number) => string;
}

export function TimeSeriesChart({ data, variant, valueLabel, formatValue = String }: TimeSeriesChartProps) {
  if (data.length === 0) return <NoData />;
  const rows = data.map((d) => ({ ...d }));
  const tooltipFormatter = (value: unknown): [string, string] => [formatValue(Number(value)), valueLabel];
  const axis = { stroke: CHART.axis, fontSize: 12, tickLine: false } as const;
  const common = { data: rows, margin: { left: 0, right: 16 } } as const;
  const grid = <CartesianGrid stroke={CHART.grid} vertical={false} />;
  const x = <XAxis dataKey="label" minTickGap={24} {...axis} />;
  const y = <YAxis width={54} tickFormatter={(v: number) => formatValue(v)} {...axis} />;
  const tip = <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} formatter={tooltipFormatter} />;

  return (
    <div className="h-72" role="img" aria-label={`Wykres w czasie: ${valueLabel}`}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'bar' ? (
          <BarChart {...common}>
            {grid}
            {x}
            {y}
            {tip}
            <Bar dataKey="value" fill={CHART.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : variant === 'area' ? (
          <AreaChart {...common}>
            {grid}
            {x}
            {y}
            {tip}
            <Area type="monotone" dataKey="value" stroke={CHART.accent} fill={CHART.accent} fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        ) : (
          <LineChart {...common}>
            {grid}
            {x}
            {y}
            {tip}
            <Line type="monotone" dataKey="value" stroke={CHART.accent} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
