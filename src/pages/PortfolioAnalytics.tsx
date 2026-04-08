import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { portfolioApi, DemoLockedError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SignalBadge } from '@/components/SignalBadge';
import LockedFeature from '@/components/LockedFeature';
import { useAuthStore } from '@/store/authStore';
import { MetricCard } from '@/components/MetricCard';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const spring = { type: 'spring', stiffness: 260, damping: 20 };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };

// ── Health gauge (circular SVG arc) ──────────────────────────
function HealthGauge({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = 54;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 270° arc
  const offset = arc - (clampedScore / 100) * arc;

  const color =
    clampedScore >= 70
      ? 'var(--status-healthy)'
      : clampedScore >= 40
      ? 'var(--status-warning)'
      : 'var(--status-critical)';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-[135deg] drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
        {/* Track */}
        <circle
          cx="90"
          cy="90"
          r={radius + 10}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={stroke + 4}
          strokeDasharray={`${arc + 40} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <circle
          cx="90"
          cy="90"
          r={radius + 10}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${arc + 40} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ 
            filter: `drop-shadow(0 0 8px ${color})`,
            strokeOpacity: 0.8
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <p className="font-mono font-bold text-4xl tracking-tight leading-none" style={{ color }}>
          {clampedScore.toFixed(0)}
        </p>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
          Health Score
        </p>
      </div>
    </div>
  );
}

export default function PortfolioAnalytics() {
  const { updateUsage, isFeatureLocked } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<{ name: string, reset: number } | null>(null);
  const isLocked = isFeatureLocked('portfolio');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEYS.PORTFOLIO,
    queryFn: portfolioApi.getPortfolio,
    refetchInterval: (query) => {
      if (query.state.error && (query.state.error as any)?.status === 503) {
        return 15000;
      }
      return INTERVALS.PORTFOLIO;
    },
    throwOnError: false,
    retry: (failCount, err: any) => {
      if (err instanceof DemoLockedError) return false;
      return failCount < 3;
    },
    enabled: !isLocked,
  });

  // Handle DemoLockedError
  if (isError && error instanceof DemoLockedError) {
    if (error.usage) updateUsage(error.usage);
    if (!lockedFeature) setLockedFeature({ name: error.feature, reset: error.resetInSeconds });
  }
  if (lockedFeature) return <LockedFeature featureName={lockedFeature.name} resetInSeconds={lockedFeature.reset} />;

  const is503 = isError && (error as any)?.status === 503;

  // Positions sorted by abs(weight) desc
  const positions = [...(data?.positions ?? [])].sort(
    (a, b) => Math.abs(b.weight) - Math.abs(a.weight)
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12 p-4 md:p-6 min-h-full pb-32"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Portfolio
          </h1>
          <p className="text-sm text-slate-400">
            Current asset distribution and risk metrics
          </p>
        </div>
      </div>

      {/* Loading States */}
      {isLoading && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {/* 503 Computing State */}
      {is503 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <div className="glass-card border-none bg-black/40 rounded-3xl p-20 flex flex-col items-center gap-8 text-center shadow-2xl backdrop-blur-xl">
             <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <Activity className="h-16 w-16 text-cyan-500 relative z-10 animate-bounce" />
             </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-bold text-white leading-none">Loading Allocation Matrix</h3>
               <p className="text-sm text-cyan-500/70">Background pipeline is computing signals (~90s on first load)</p>
            </div>
            <div className="w-full max-w-md h-1.5 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
              <motion.div
                className="h-full rounded-full bg-cyan-500"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {data && (
        <>
          {/* Top section: health gauge + metric cards */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Health gauge card */}
            <motion.div
              variants={container}
              className="lg:row-span-2"
            >
              <Card className="glass-card h-full border-none shadow-2xl relative overflow-hidden group bg-black/40 backdrop-blur-xl rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                <CardHeader className="pb-8 border-b border-white/5">
                  <CardTitle className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                    <Activity className="h-3.5 w-3.5 text-cyan-500" />
                    Strategy Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 flex flex-col items-center justify-center gap-8">
                  <div className="relative group/gauge">
                    <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full scale-150 opacity-0 group-hover/gauge:opacity-100 transition-opacity duration-1000" />
                    <HealthGauge score={data.portfolio_health_score} />
                  </div>
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-black/60 border border-white/5 shadow-2xl group-hover:border-white/10 transition-colors">
                      <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", 
                        data.portfolio_health_score >= 70 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
                        data.portfolio_health_score >= 40 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : 
                        "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                      )} />
                      <span className="text-xs font-semibold text-white uppercase">
                        Status: {data.portfolio_health_score >= 70 ? 'Normal' : data.portfolio_health_score >= 40 ? 'Caution' : 'Critical'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Metric Nodes */}
            <MetricCard
              title="Total Invested"
              value={`${(data.gross_exposure * 100).toFixed(1)}%`}
              icon={<Activity />}
              description="Sum of all positions"
            />
            <MetricCard
              title="Net Exposure"
              value={`${(data.net_exposure * 100).toFixed(1)}%`}
              icon={<Activity />}
              description="Long minus short"
              trend={{ value: 0, label: '', isPositive: data.net_exposure >= 0 }}
            />
            <MetricCard
              title="Long Positions"
              value={data.long_count}
              icon={<TrendingUp />}
              description="Active long bias"
              trend={{ value: 0, label: '', isPositive: true }}
            />
            <MetricCard
              title="Short Positions"
              value={data.short_count}
              icon={<TrendingDown />}
              description="Active short bias"
              trend={{ value: 0, label: '', isPositive: false }}
            />
            <MetricCard
              title="System Status"
              value={data.drift_state === 'hard' ? 'CRITICAL' : data.drift_state === 'soft' ? 'WARNING' : 'HEALTHY'}
              icon={<ShieldAlert />}
              description="Drift detection status"
              trend={{ value: 0, label: '', isPositive: data.drift_state === 'none' }}
            />
            <MetricCard
              title="Neutral Positions"
              value={data.neutral_count}
              icon={<Minus />}
              description="Inactive or stable"
            />
          </div>

          {/* Top 5 Preview */}
          {data.top_5_preview.length > 0 && (
             <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.32 }}
            >
              <Card className="glass-card border-none bg-black/40 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5">
                  <CardTitle className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
                    Top Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    {data.top_5_preview.map((item) => (
                      <div
                        key={item.ticker}
                        className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all group/node relative overflow-hidden shadow-xl"
                      >
                        <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover/node:opacity-100 transition-opacity" />
                        <span className="font-mono font-bold text-2xl uppercase text-white tracking-tight leading-none block mb-4">
                          {item.ticker}
                        </span>
                        <div className="flex flex-col gap-3 relative z-10">
                          <p className="text-xs font-semibold text-cyan-500/80">
                            Score: {item.score.toFixed(4)}
                          </p>
                          <div className="space-y-1">
                             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(item.weight * 100 * 5, 100)}%` }}
                                    className="h-full bg-cyan-500" 
                                />
                             </div>
                             <p className="text-[10px] text-slate-500 font-semibold">
                                Weight: {(item.weight * 100).toFixed(2)}%
                             </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Positions table */}
          {positions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.36 }}
            >
              <Card className="glass-card border-none shadow-2xl bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-white/5 p-8">
                  <CardTitle className="text-sm font-semibold text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-emerald-500" />
                      Active Holdings
                    </div>
                    <span>{positions.length} Positions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="text-left px-10 py-4 text-xs font-semibold text-slate-400">
                            Ticker
                          </th>
                          <th className="text-right px-10 py-4 text-xs font-semibold text-slate-400">
                            Current Allocation
                          </th>
                          <th className="text-right px-10 py-4 text-xs font-semibold text-slate-400">
                            Market Bias
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {positions.map((pos) => (
                          <tr
                            key={pos.ticker}
                            className="group hover:bg-cyan-500/[0.03] transition-colors"
                          >
                            <td className="px-10 py-5 font-mono font-bold uppercase text-lg text-white">
                              {pos.ticker}
                            </td>
                            <td
                              className={cn(
                                "px-10 py-5 font-mono text-right font-bold text-lg",
                                pos.weight > 0 ? "text-emerald-400" : pos.weight < 0 ? "text-rose-400" : "text-slate-500"
                              )}
                            >
                              {(pos.weight * 100).toFixed(2)}%
                            </td>
                            <td className="px-10 py-8 text-right">
                              <SignalBadge signal={pos.signal as any} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}