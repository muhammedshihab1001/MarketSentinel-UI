import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
} from 'recharts';
import { formatPercent } from '@/lib/utils';

interface ExposureData {
  sector: string;
  long: number;
  short: number;
  net: number;
}

interface ExposureBarChartProps {
  data: ExposureData[];
}

export function ExposureBarChart({ data }: ExposureBarChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
          <XAxis 
            type="number"
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            tickFormatter={(val) => formatPercent(val)}
            domain={[-1, 1]}
          />
          <YAxis 
            dataKey="sector"
            type="category"
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            width={100}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
            formatter={(value: number) => formatPercent(value)}
            cursor={{ fill: '#1e293b' }}
          />
          <Legend />
          <Bar dataKey="long" name="LONG_EXPOSURE" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={12} />
          <Bar dataKey="short" name="SHORT_EXPOSURE" fill="#475569" radius={[4, 0, 0, 4]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
