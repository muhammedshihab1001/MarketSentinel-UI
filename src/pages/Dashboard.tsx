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


const spring = { type: 'spring', stiffness: 260, damping: 20 };

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { updateUsage } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

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
  });

  // Handle DemoLockedError — show LockedFeature instead of generic error card
  if (isError && error instanceof DemoLockedError) {
    if (error.usage) updateUsage(error.usage);
    if (!lockedFeature) setLockedFeature(error.feature);
  }
  if (lockedFeature) return <LockedFeature featureName={lockedFeature} />;

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
    .slice(0, 5);

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
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter italic uppercase text-[var(--text-primary)]">
            Dashboard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
            {snapshot?.snapshot_date ?? '—'} · {meta?.model_version ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
          <NeuralScanner />
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={isFetching || refreshMutation.isPending}
              className="border-[var(--border-subtle)] hover:border-[var(--border-active)] bg-[var(--bg-surface)] h-[42px]"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-20 glass-card rounded-2xl border-[var(--border-subtle)] text-center">
          <p className="text-lg font-mono text-[var(--accent-primary)] mb-6">
            Computing market signals — this takes ~60s on first load.
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
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
                description="Weight > 0"
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
                description="Weight < 0"
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
                description="Near-zero weight"
              />
            </motion.div>

            {/* Avg Hybrid Score */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.16 }}
            >
              <MetricCard
                title="Avg Hybrid Score"
                value={
                  meta?.avg_hybrid_score != null
                    ? meta.avg_hybrid_score.toFixed(4)
                    : '—'
                }
                icon={<Zap className="h-4 w-4 text-[var(--accent-primary)]" />}
                description="Cross-sectional mean"
              />
            </motion.div>

            {/* Gross Exposure */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.20 }}
            >
              <MetricCard
                title="Gross Exposure"
                value={`${(grossExposure * 100).toFixed(1)}%`}
                icon={<BarChart2 className="h-4 w-4 text-[var(--accent-primary)]" />}
                description="Sum of |weights|"
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
                description="Long minus short"
              />
            </motion.div>

            {/* Portfolio Bias */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.28 }}
            >
              <MetricCard
                title="Portfolio Bias"
                value={summary?.portfolio_bias ?? '—'}
                icon={<Activity className="h-4 w-4 text-[var(--text-secondary)]" />}
                description="Market direction"
              />
            </motion.div>

            {/* Drift State */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.32 }}
            >
              <MetricCard
                title="Drift State"
                value={driftState.toUpperCase()}
                icon={<ShieldAlert className={`h-4 w-4 ${driftColor}`} />}
                description={`Severity: ${driftSeverity}`}
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
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Signal Distribution
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
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Exposure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* ExposureBarChart expects ExposureData[]; render a simple gross/net display */}
                  <div className="flex flex-col gap-4 py-4">
                    {[
                      { label: 'GROSS', value: `${(grossExposure * 100).toFixed(1)}%`, color: 'bg-[var(--accent-primary)]', pct: grossExposure },
                      { label: 'NET', value: `${(netExposure * 100).toFixed(1)}%`, color: netExposure >= 0 ? 'bg-[var(--status-healthy)]' : 'bg-rose-500', pct: Math.abs(netExposure) },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">{item.label}</span>
                          <span className="font-mono font-black italic text-xl md:text-2xl text-[var(--text-data)]">{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--bg-overlay)]">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(item.pct * 100, 100)}%` }} />
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
              <CardHeader className="pb-2">
                <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Top Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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