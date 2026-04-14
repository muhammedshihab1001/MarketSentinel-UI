import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { performanceApi, DemoLockedError } from '@/lib/api';
import { AlertCircle, RefreshCw, Trophy, Zap, Activity, Target, TrendingDown, TrendingUp, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LockedFeature from '@/components/LockedFeature';
import { useAuthStore } from '@/store/authStore';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { MetricCard } from '@/components/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };

// Format a number to 4 decimal places
function fmt4(v: number | undefined | null): string {
  if (v == null) return '—';
  return v.toFixed(4);
}

// Format as percent with 4 decimal places
function fmtPct4(v: number | undefined | null): string {
  if (v == null) return '—';
  return `${(v * 100).toFixed(4)}%`;
}

export default function StrategyPerformance() {
  const { updateUsage, isFeatureLocked } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<{ name: string; reset: number } | null>(null);
  const isLocked = isFeatureLocked('performance');

  const { data: perf, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: QUERY_KEYS.PERFORMANCE(),
    queryFn: () => performanceApi.getPerformance(undefined, 252),
    refetchInterval: INTERVALS.PERFORMANCE,
    retry: (failCount: number, err: any) => {
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

  const m = perf?.metrics;

  if (isError && !(error instanceof DemoLockedError)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center p-12 text-center space-y-10">
        <div className="h-24 w-24 bg-rose-500/10 border-2 border-rose-500/20 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.2)]">
           <AlertCircle className="h-12 w-12 text-rose-500 animate-pulse" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-bold tracking-tight text-white mb-2">Connection Error</h3>
          <p className="text-slate-400 max-w-md mx-auto text-sm font-medium">
            Unable to connect to the data service. Please check your network and try again.
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="h-16 px-12 rounded-2xl border-rose-500/30 text-rose-500 font-bold hover:bg-rose-500 hover:text-white transition-all shadow-2xl group"
          onClick={() => refetch()}
        >
          <RefreshCw className={cn("h-5 w-5 mr-4 transition-transform group-active:rotate-180", isFetching && "animate-spin")} />
          Reconnect
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12 p-4 md:p-6 min-h-full pb-32"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Performance Metrics
          </h1>
          <p className="text-sm text-slate-400">
            Historical returns and risk assessment
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-16 px-10 rounded-2xl bg-black/40 border border-white/5 hover:border-cyan-500/50 transition-all flex items-center gap-4 group shadow-2xl backdrop-blur-xl"
        >
          <RefreshCw className={cn("h-5 w-5 text-cyan-500 transition-transform group-hover:rotate-180", isFetching && "animate-spin")} />
          <span className="text-xs font-semibold text-slate-400 group-hover:text-white">Refresh</span>
        </motion.button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[2rem] bg-white/5" />
          ))}
        </div>
      )}

      {perf && m && (
        <>
          {/* Main Matrix */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Return"
              value={fmtPct4(m.cumulative_return)}
              icon={<Trophy className="text-amber-500" />}
              description="Overall growth"
            />
            <MetricCard
              title="Risk Score"
              value={fmt4(m.sharpe_ratio)}
              icon={<Zap className="text-cyan-400" />}
              description="Efficiency ratio"
            />
            <MetricCard
              title="Downside Protection"
              value={fmt4(m.sortino_ratio)}
              icon={<Activity className="text-indigo-400" />}
              description="Security rank"
            />
            <MetricCard
              title="Recovery Speed"
              value={fmt4(m.calmar_ratio)}
              icon={<Target className="text-emerald-400" />}
              description="Speed of rebound"
            />
            <MetricCard
              title="Max Loss"
              value={fmtPct4(m.max_drawdown)}
              icon={<TrendingDown className="text-rose-500" />}
              description="Worst case drop"
            />
            <MetricCard
              title="Annual Yield"
              value={fmtPct4((m as any).annual_return ?? null)}
              icon={<TrendingUp className="text-cyan-400" />}
              description="Yearly output"
            />
            <MetricCard
              title="Success Rate"
              value={fmtPct4((m as any).hit_rate)}
              icon={<BarChart2 className="text-indigo-400" />}
              description="Accuracy level"
            />
            <MetricCard
              title="Volatility"
              value={fmtPct4((m as any).annual_volatility ?? m.volatility_ann)}
              icon={<Activity className="text-slate-500" />}
              description="Stability index"
            />
          </div>

          {/* System Logs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-[2.5rem] overflow-hidden p-10">
                <div className="flex flex-wrap gap-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source</p>
                    <p className="font-mono text-lg font-bold text-white uppercase">{perf.data_source}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timeframe</p>
                    <p className="font-mono text-lg font-bold text-white uppercase">{perf.lookback_days} Days</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tickers</p>
                    <p className="font-mono text-lg font-bold text-white uppercase">{perf.tickers_requested}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Records</p>
                    <p className="font-mono text-lg font-bold text-white uppercase">{perf.tickers_computed}</p>
                  </div>
                </div>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// CN helper removed as it's now imported from utils
