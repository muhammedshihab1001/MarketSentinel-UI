import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { portfolioApi, DemoLockedError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SignalBadge } from '@/components/SignalBadge';
import LockedFeature from '@/components/LockedFeature';
import { useAuthStore } from '@/store/authStore';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { motion } from 'framer-motion';


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
    <div className="flex flex-col items-center gap-2">
      <svg width="136" height="136" viewBox="0 0 136 136" className="-rotate-[135deg]">
        {/* Track */}
        <circle
          cx="68"
          cy="68"
          r={radius}
          fill="none"
          stroke="var(--bg-overlay)"
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <circle
          cx="68"
          cy="68"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: 28 }}>
        <p className="font-mono font-black text-4xl italic" style={{ color }}>
          {clampedScore.toFixed(0)}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">
          Health
        </p>
      </div>
    </div>
  );
}

export default function PortfolioAnalytics() {
  const { updateUsage } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

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
  });

  // Handle DemoLockedError
  if (isError && error instanceof DemoLockedError) {
    if (error.usage) updateUsage(error.usage);
    if (!lockedFeature) setLockedFeature(error.feature);
  }
  if (lockedFeature) return <LockedFeature featureName={lockedFeature} />;

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
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter italic uppercase text-[var(--text-primary)]">
          Portfolio
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
          {data?.snapshot_date ?? '—'}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && !is503 && !(error instanceof DemoLockedError) && (
        <Card className="glass-card border-rose-500/30">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
            <div>
              <p className="font-semibold text-rose-500">Portfolio data unavailable</p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Backend not responding. Retrying…
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 503 Computing State */}
      {is503 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <div className="glass-card border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-2xl p-10 flex flex-col items-center gap-6 text-center">
            <div className="font-mono text-[var(--accent-primary)] text-lg">
              Loading portfolio — waiting for market snapshot
            </div>
            <div className="w-full max-w-sm h-1.5 rounded-full bg-[var(--bg-overlay)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-cyan-300"
                animate={{ scaleX: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{ originX: 0 }}
              />
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              Background pipeline is computing signals (~90s on first load)
            </div>
          </div>
        </motion.div>
      )}

      {data && (
        <>
          {/* Top section: health gauge + metric cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Health gauge card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.04 }}
              className="lg:row-span-2"
            >
              <Card className="glass-card h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">
                    Portfolio Health
                  </p>
                  <div className="relative flex items-center justify-center">
                    <HealthGauge score={data.portfolio_health_score} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-[var(--status-healthy)]" />
                    <span className="text-xs font-mono text-[var(--text-secondary)]">
                      {data.portfolio_health_score >= 70
                        ? 'Healthy'
                        : data.portfolio_health_score >= 40
                        ? 'Moderate'
                        : 'At Risk'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 6 metric cards */}
            {[
              {
                label: 'GROSS EXPOSURE',
                value: `${(data.gross_exposure * 100).toFixed(1)}%`,
                icon: <Activity className="h-4 w-4 text-[var(--accent-primary)]" />,
                delay: 0.08,
              },
              {
                label: 'NET EXPOSURE',
                value: `${(data.net_exposure * 100).toFixed(1)}%`,
                icon: <Activity className="h-4 w-4 text-[var(--text-secondary)]" />,
                delay: 0.12,
              },
              {
                label: 'LONG POSITIONS',
                value: data.long_count,
                icon: <TrendingUp className="h-4 w-4 text-[var(--status-healthy)]" />,
                valueColor: 'text-[var(--status-healthy)]',
                delay: 0.16,
              },
              {
                label: 'SHORT POSITIONS',
                value: data.short_count,
                icon: <TrendingDown className="h-4 w-4 text-rose-500" />,
                valueColor: 'text-rose-500',
                delay: 0.20,
              },
              {
                label: 'DRIFT STATE',
                value: data.drift_state.toUpperCase(),
                icon: (
                  <ShieldAlert
                    className={`h-4 w-4 ${
                      data.drift_state === 'hard'
                        ? 'text-rose-500'
                        : data.drift_state === 'soft'
                        ? 'text-[var(--status-warning)]'
                        : 'text-[var(--status-healthy)]'
                    }`}
                  />
                ),
                valueColor:
                  data.drift_state === 'hard'
                    ? 'text-rose-500'
                    : data.drift_state === 'soft'
                    ? 'text-[var(--status-warning)]'
                    : 'text-[var(--status-healthy)]',
                delay: 0.24,
              },
              {
                label: 'NEUTRAL',
                value: data.neutral_count,
                icon: <Minus className="h-4 w-4 text-[var(--signal-neutral)]" />,
                delay: 0.28,
              },
            ].map((m) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: m.delay }}
              >
                <Card className="glass-card group" style={{ cursor: 'default' }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {m.icon}
                      <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">
                        {m.label}
                      </span>
                    </div>
                    <p
                      className={`font-mono font-black text-2xl italic ${
                        (m as any).valueColor ?? 'text-[var(--text-data)]'
                      }`}
                    >
                      {String(m.value)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Top 5 Preview */}
          {data.top_5_preview.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.32 }}
            >
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Top 5 Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {data.top_5_preview.map((item) => (
                      <div
                        key={item.ticker}
                        className="glass-card p-3 rounded-xl border border-[var(--border-subtle)] flex flex-col gap-1"
                      >
                        <span className="font-mono font-black text-sm uppercase text-[var(--text-primary)]">
                          {item.ticker}
                        </span>
                        <p className="font-mono text-xs text-[var(--accent-primary)]">
                          {item.score.toFixed(4)}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          wt: {(item.weight * 100).toFixed(2)}%
                        </p>
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
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Positions ({positions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)]">
                          <th className="text-left px-4 py-2 font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            Ticker
                          </th>
                          <th className="text-right px-4 py-2 font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            Weight
                          </th>
                          <th className="text-right px-4 py-2 font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            Signal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos, i) => (
                          <tr
                            key={pos.ticker}
                            className={`border-b border-[var(--border-subtle)] last:border-0 ${
                              i % 2 === 0 ? '' : 'bg-[var(--bg-overlay)]/30'
                            } hover:bg-[var(--bg-overlay)] transition-colors`}
                          >
                            <td className="px-4 py-2 font-mono font-black uppercase text-[var(--text-primary)]">
                              {pos.ticker}
                            </td>
                            <td
                              className={`px-4 py-2 font-mono text-right font-bold ${
                                pos.weight > 0
                                  ? 'text-[var(--status-healthy)]'
                                  : pos.weight < 0
                                  ? 'text-rose-500'
                                  : 'text-[var(--text-muted)]'
                              }`}
                            >
                              {(pos.weight * 100).toFixed(2)}%
                            </td>
                            <td className="px-4 py-2 text-right">
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