import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { formatPercent } from '@/lib/utils';

interface EquityCurvePoint {
  date: string;
  strategy: number;
  benchmark: number;
}

interface EquityCurveChartProps {
  data: EquityCurvePoint[];
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  // A dark theme standard configuration for recharts
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            tickMargin={10} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            tickFormatter={(val) => formatPercent(val)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
            formatter={(value: number) => formatPercent(value)}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line 
            type="monotone" 
            name="STRATEGY_ALPHA" 
            dataKey="strategy" 
            stroke="#22d3ee" 
            strokeWidth={4} 
            dot={false}
            activeDot={{ r: 8, fill: '#22d3ee', stroke: '#020617', strokeWidth: 3 }}
          />
          <Line 
            type="monotone" 
            name="BENCHMARK_BETA" 
            dataKey="benchmark" 
            stroke="#475569" 
            strokeWidth={2} 
            strokeDasharray="8 4"
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
