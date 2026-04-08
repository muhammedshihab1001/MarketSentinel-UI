import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { predictionApi, DemoLockedError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { MetricCard } from '@/components/MetricCard';
import LockedFeature from '@/components/LockedFeature';

import { SignalDistributionPieChart } from '@/charts/SignalDistributionPieChart';
import { SignalCard } from '@/components/SignalCard';

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  ShieldAlert,
  BarChart2,
} from 'lucide-react';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import NeuralScanner from '@/components/NeuralScanner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';


const spring = { type: 'spring', stiffness: 260, damping: 20 };

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { updateUsage, isFeatureLocked } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<{ name: string, reset: number } | null>(null);
  const isLocked = isFeatureLocked('snapshot');

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: QUERY_KEYS.SNAPSHOT,
    queryFn: predictionApi.getSnapshot,
    throwOnError: false,
    retry: (failCount, err: any) => {
      if (err instanceof DemoLockedError) return false;
      return failCount < 3;
    },
    refetchInterval: (query) => {
      const resp = query.state.data as any;
      if (resp && (resp.served_from_cache === false || resp.metadata?.served_from_cache === false || !resp.snapshot?.signals?.length)) {
        return 15000;
      }
      return INTERVALS.SNAPSHOT;
    },
    enabled: !isLocked,
  });

  // Handle DemoLockedError — show LockedFeature instead of generic error card
  if (isError && error instanceof DemoLockedError) {
    if (error.usage) updateUsage(error.usage);
    if (!lockedFeature) setLockedFeature({ name: error.feature, reset: error.resetInSeconds });
  }
  if (lockedFeature) return <LockedFeature featureName={lockedFeature.name} resetInSeconds={lockedFeature.reset} />;

  const refreshMutation = useMutation({
    mutationFn: predictionApi.getSnapshot,
    onSuccess: (newData) => {
      queryClient.setQueryData(QUERY_KEYS.SNAPSHOT, newData);
    },
  });

  // ── FIX: Read from correct nested fields ────────────────
  // Old code read phantom fields: snapshot.top_5, snapshot.agents, decision_report
  // Correct structure: meta + executive_summary + snapshot.signals[]

  // Cast as any to navigate type conflict between api.ts and types/index.ts SnapshotResponse
  const d = data as any;
  const meta = d?.meta ?? d?.metadata;
  const summary = d?.executive_summary;
  const snapshot = d?.snapshot;
  const signals = snapshot?.signals ?? d?.signals ?? [];
  const drift = snapshot?.drift;

  const isComputing = d?.served_from_cache === false || meta?.served_from_cache === false || (data && signals.length === 0);

  // Signal counts derived from weight — no agents sub-object
  const longSignals = signals.filter((s: any) => s.weight > 0.01);
  const shortSignals = signals.filter((s: any) => s.weight < -0.01);
  const neutralSignals = signals.filter(
    (s: any) => s.weight >= -0.01 && s.weight <= 0.01
  );

  // Top 5 by raw_model_score descending
  const top5 = [...signals]
    .sort((a: any, b: any) => b.raw_model_score - a.raw_model_score)
    .slice(0, 5)
    .map(s => ({ ...s, signal: s.weight > 0.01 ? 'LONG' : s.weight < -0.01 ? 'SHORT' : 'NEUTRAL' }));

  // Gross/net exposure from executive_summary
  const grossExposure = summary?.gross_exposure ?? 0;
  const netExposure = summary?.net_exposure ?? 0;

  // Drift state from snapshot.drift
  const driftState = drift?.drift_state ?? 'none';
  const driftSeverity = drift?.severity_score ?? 0;

  const driftColor =
    driftState === 'hard'
      ? 'text-[var(--status-critical)]'
      : driftState === 'soft'
      ? 'text-[var(--status-warning)]'
      : 'text-[var(--status-healthy)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="space-y-8 p-4 md:p-6 min-h-full pb-32 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Dashboard Summary
          </h1>
          <p className="text-sm text-slate-400">
            Live market analysis and system status
          </p>
        </div>
        <div className="flex items-center gap-4">
          <NeuralScanner className="hidden md:flex" />
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={isFetching || refreshMutation.isPending}
              className="border-[var(--border-subtle)] hover:border-cyan-500/50 hover:text-cyan-400 bg-black/40 h-10 px-6 rounded-xl font-semibold text-sm border-none shadow-xl backdrop-blur-xl transition-all group"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 transition-transform group-hover:rotate-180 duration-700 ${isFetching ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <Card className="glass-card border-[var(--status-critical)]/30">
          <CardContent className="p-6 flex items-center gap-4">
            <ShieldAlert className="h-8 w-8 text-[var(--status-critical)]" />
            <div>
              <p className="font-semibold text-[var(--status-critical)]">
                Snapshot unavailable
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Backend is not responding or model is loading. Retrying…
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Computing State */}
      {isComputing && !isError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-10 glass-card rounded-2xl border-[var(--border-subtle)] text-center min-h-[40vh]">
          <p className="text-lg font-medium text-[var(--accent-primary)] mb-6">
            Loading results... this may take a moment.
          </p>
          <div className="w-64 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[var(--accent-primary)]" 
              animate={{ scaleX: [0, 1, 0.5, 1], originX: 0 }} 
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
            />
          </div>
        </motion.div>
      )}

      {/* Metric Cards */}
      {data && !isComputing && (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Long Signals */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.04 }}
            >
              <MetricCard
                title="Long Signals"
                value={longSignals.length}
                icon={<TrendingUp className="h-4 w-4 text-[var(--signal-long)]" />}
                description="Bullish signals"
                trend={{ value: 0, label: '', isPositive: true }}
              />
            </motion.div>

            {/* Short Signals */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.08 }}
            >
              <MetricCard
                title="Short Signals"
                value={shortSignals.length}
                icon={<TrendingDown className="h-4 w-4 text-[var(--signal-short)]" />}
                description="Bearish signals"
                trend={{ value: 0, label: '', isPositive: false }}
              />
            </motion.div>

            {/* Neutral */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.12 }}
            >
              <MetricCard
                title="Neutral"
                value={neutralSignals.length}
                icon={<Minus className="h-4 w-4 text-[var(--signal-neutral)]" />}
                description="Neutral bias"
              />
            </motion.div>

            {/* Avg Score */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.16 }}
            >
              <MetricCard
                title="Average Score"
                value={
                  meta?.avg_hybrid_score != null
                    ? meta.avg_hybrid_score.toFixed(4)
                    : '—'
                }
                icon={<Zap className="h-4 w-4 text-[var(--accent-primary)]" />}
                description="Overall signal strength"
              />
            </motion.div>

            {/* Total Exposure */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.20 }}
            >
              <MetricCard
                title="Total Exposure"
                value={`${(grossExposure * 100).toFixed(1)}%`}
                icon={<BarChart2 className="h-4 w-4 text-[var(--accent-primary)]" />}
                description="Invested capital"
              />
            </motion.div>

            {/* Net Exposure */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.24 }}
            >
              <MetricCard
                title="Net Exposure"
                value={`${(netExposure * 100).toFixed(1)}%`}
                icon={<Activity className="h-4 w-4 text-[var(--accent-primary)]" />}
                description="Directional bias"
              />
            </motion.div>

            {/* Overall Trend */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.28 }}
            >
              <MetricCard
                title="Overall Trend"
                value={summary?.portfolio_bias ?? '—'}
                icon={<Activity className="h-4 w-4 text-[var(--text-secondary)]" />}
                description="Current market bias"
              />
            </motion.div>

            {/* System Stability */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.32 }}
            >
              <MetricCard
                title="System Status"
                value={driftState === 'hard' ? 'CRITICAL' : driftState === 'soft' ? 'WARNING' : 'HEALTHY'}
                icon={<ShieldAlert className={`h-4 w-4 ${driftColor}`} />}
                description={`Alert State: ${driftSeverity}/10`}
                className={driftState === 'hard' ? 'border-rose-500/20' : driftState === 'soft' ? 'border-amber-500/20' : ''}
              />
            </motion.div>
          </div>

          {/* Charts row */}
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.36 }}
            >
              <Card className="glass-card h-full">
                <CardHeader className="pb-6 border-b border-white/5">
                  <CardTitle className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-500" />
                    Market Bias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SignalDistributionPieChart
                    longCount={longSignals.length}
                    shortCount={shortSignals.length}
                    neutralCount={neutralSignals.length}
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.40 }}
            >
              <Card className="glass-card h-full">
                <CardHeader className="pb-6 border-b border-white/5">
                  <CardTitle className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Position Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-6 py-6">
                    {[
                      { label: 'Total Invested', value: `${(grossExposure * 100).toFixed(1)}%`, color: 'bg-[var(--accent-primary)]', pct: grossExposure },
                      { label: 'Directional Net', value: `${(netExposure * 100).toFixed(1)}%`, color: netExposure >= 0 ? 'bg-[var(--status-healthy)]' : 'bg-rose-500', pct: Math.abs(netExposure) },
                    ].map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-semibold text-[var(--text-muted)]">{item.label}</span>
                          <span className="font-semibold text-2xl text-[var(--text-primary)] leading-none">{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden shadow-inner flex gap-0.5 p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(item.pct * 100, 100)}%` }}
                            className={cn("h-full rounded-full transition-all duration-1000", item.color)} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Top 5 signals */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.44 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-6 border-b border-white/5">
                <CardTitle className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Top Opportunities
              </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {top5.map((signal, i) => (
                    <motion.div
                      key={signal.ticker}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring, delay: 0.44 + i * 0.04 }}
                    >
                      <SignalCard signal={signal as any} />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}