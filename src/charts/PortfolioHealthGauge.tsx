import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatPercent } from '@/lib/utils';

interface PortfolioHealthGaugeProps {
  score: number;
}

export function PortfolioHealthGauge({ score }: PortfolioHealthGaugeProps) {
  // Normalize score between 0 and 1
  const healthValue = Math.max(0, Math.min(1, score));
  
  const data = [
    { name: 'Health', value: healthValue },
    { name: 'Risk', value: 1 - healthValue },
  ];

  const COLORS = ['#22d3ee', '#0f172a']; // Cyan for health (MS Brand), dark slate for empty

  if (healthValue < 0.4) {
    COLORS[0] = '#f43f5e'; // Rose
  } else if (healthValue < 0.7) {
    COLORS[0] = '#f59e0b'; // Amber
  }

  return (
    <div className="h-48 w-full flex flex-col items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-6 flex flex-col items-center">
        <span className="text-5xl font-black tracking-tighter italic text-white drop-shadow-2xl">{formatPercent(healthValue)}</span>
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">SYSTEM_DNA_INTEGRITY</span>
      </div>
    </div>
  );
}
