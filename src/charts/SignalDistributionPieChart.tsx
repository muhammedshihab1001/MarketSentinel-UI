import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';

interface SignalDistributionPieChartProps {
  longCount: number;
  shortCount: number;
  neutralCount: number;
}

export function SignalDistributionPieChart({ 
  longCount, 
  shortCount, 
  neutralCount 
}: SignalDistributionPieChartProps) {
  
  const data = [
    { name: 'Long', value: longCount },
    { name: 'Short', value: shortCount },
    { name: 'Neutral', value: neutralCount },
  ];

  const COLORS = ['#22d3ee', '#f43f5e', '#475569']; // Cyan (Long), Rose (Short), Slate (Neutral)

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
