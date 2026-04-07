import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { performanceApi, DemoLockedError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import LockedFeature from '@/components/LockedFeature';
import { useAuthStore } from '@/store/authStore';
import {
  Trophy,
  TrendingDown,
  AlertCircle,
  BarChart2,
  RefreshCw,
  Zap,
  Target,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { motion } from 'framer-motion';

const spring = { type: 'spring', stiffness: 260, damping: 20 };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: spring } };

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

function MetricPill({
  label,
  value,
  valueColor,
  icon,
}: {
  label: string;
  value: string;
  valueColor?: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div variants={item}>
      <Card className="glass-card group h-full">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">
              {label}
            </span>
          </div>
          <p className={`font-mono font-black italic text-xl md:text-2xl ${valueColor ?? 'text-[var(--text-data)]'}`}>
            {value}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function StrategyPerformance() {
  const { updateUsage } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

  const { data: perf, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: QUERY_KEYS.PERFORMANCE(),
    queryFn: () => performanceApi.getPerformance(undefined, 252),
    refetchInterval: INTERVALS.PERFORMANCE,
    retry: (failCount: number, err: any) => {
      if (err instanceof DemoLockedError) return false;
      return failCount < 3;
    },
  });

  // Handle DemoLockedError
  if (isError && error instanceof DemoLockedError) {
    if (error.usage) updateUsage(error.usage);
    if (!lockedFeature) setLockedFeature(error.feature);
  }
  if (lockedFeature) return <LockedFeature featureName={lockedFeature} />;

  const m = perf?.metrics;

  // Derive color for return/drawdown values
  const returnColor = (v: number | undefined | null) => {
    if (v == null) return '';
    return v >= 0 ? 'text-[var(--status-healthy)]' : 'text-rose-500';
  };

  if (isError && !(error instanceof DemoLockedError)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-[40vh] flex-col items-center justify-center p-8 border rounded-2xl glass-card text-center space-y-6 border-rose-500/30 bg-rose-500/5 m-6"
      >
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--text-primary)] italic">
            Performance Unavailable
          </h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto text-sm">
            Strategy performance data could not be loaded. The backend may still be running inference.
          </p>
        </div>
        <Button
          variant="destructive"
          size="lg"
          className="font-bold tracking-widest px-8 h-12 rounded-xl"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter italic uppercase text-[var(--text-primary)]">
            Performance
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
            252-day lookback · {perf?.tickers_computed ?? '—'} tickers computed
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-active)] transition-colors text-sm text-[var(--text-secondary)] cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      )}

      {perf && m && (
        <>
          {/* 8 metric cards */}
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <MetricPill
              label="Cumulative Return"
              value={fmtPct4(m.cumulative_return)}
              valueColor={returnColor(m.cumulative_return)}
              icon={<Trophy className="h-4 w-4 text-amber-500" />}
            />
            <MetricPill
              label="Sharpe Ratio"
              value={fmt4(m.sharpe_ratio)}
              icon={<Zap className="h-4 w-4 text-[var(--accent-primary)]" />}
            />
            <MetricPill
              label="Sortino Ratio"
              value={fmt4(m.sortino_ratio)}
              icon={<Activity className="h-4 w-4 text-[var(--accent-primary)]" />}
            />
            <MetricPill
              label="Calmar Ratio"
              value={fmt4(m.calmar_ratio)}
              icon={<Target className="h-4 w-4 text-[var(--text-secondary)]" />}
            />
            <MetricPill
              label="Max Drawdown"
              value={fmtPct4(m.max_drawdown)}
              valueColor={returnColor(m.max_drawdown)}
              icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
            />
            <MetricPill
              label="Annual Return"
              value={fmt4((m as any).annual_return ?? m.cumulative_return)}
              valueColor={returnColor((m as any).annual_return ?? m.cumulative_return)}
              icon={<TrendingUp className="h-4 w-4 text-[var(--status-healthy)]" />}
            />
            <MetricPill
              label="Hit Rate"
              value={fmtPct4((m as any).hit_rate ?? m.win_rate)}
              icon={<BarChart2 className="h-4 w-4 text-indigo-400" />}
            />
            <MetricPill
              label="Annual Volatility"
              value={fmtPct4((m as any).annual_volatility ?? m.volatility_ann)}
              icon={<Activity className="h-4 w-4 text-[var(--text-secondary)]" />}
            />
          </motion.div>


          {/* Info card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.36 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Data Source
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Source</span>
                  <span className="font-mono text-sm text-[var(--text-data)]">{perf.data_source}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Lookback</span>
                  <span className="font-mono text-sm text-[var(--text-data)]">{perf.lookback_days} days</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Tickers Requested</span>
                  <span className="font-mono text-sm text-[var(--text-data)]">{perf.tickers_requested}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Tickers Computed</span>
                  <span className="font-mono text-sm text-[var(--text-data)]">{perf.tickers_computed}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
