import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { driftApi, DemoLockedError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/MetricCard';
import { AlertTriangle, ShieldCheck, RefreshCw, Clock, Activity, Zap } from 'lucide-react';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { motion } from 'framer-motion';
import type {} from '@/types';
import LockedFeature from '@/components/LockedFeature';
import { useAuthStore } from '@/store/authStore';

const spring = { type: 'spring', stiffness: 260, damping: 20 };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };

// ── Severity color ─────────────────────────────────────────
function getSeverityColor(score: number): string {
  if (score >= 13) return 'text-rose-500';
  if (score >= 9) return 'text-orange-500';
  if (score >= 5) return 'text-amber-400';
  return 'text-emerald-400';
}

function getSeverityBg(score: number): string {
  if (score >= 13) return 'bg-rose-500';
  if (score >= 9) return 'bg-orange-500';
  if (score >= 5) return 'bg-amber-400';
  return 'bg-emerald-400';
}

function getSeverityCardBg(score: number): string {
  if (score >= 13) return 'bg-rose-500/10 border-rose-500/30';
  if (score >= 9) return 'bg-orange-500/10 border-orange-500/30';
  if (score >= 5) return 'bg-amber-400/10 border-amber-400/30';
  return 'bg-emerald-400/10 border-emerald-400/30';
}

// ── Drift state badge ──────────────────────────────────────
function DriftStateBadge({ score, state }: { score: number; state: string }) {
  const color = getSeverityColor(score);
  const bg = getSeverityBg(score);
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold ${bg}/10 ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${bg}`} />
      {state.toUpperCase().replace('_', ' ')}
    </span>
  );
}

// ── Live countdown timer ────────────────────────────────────
function CooldownTimer({ initialSeconds }: { initialSeconds: number }) {
  // FIX: Single useState and useEffect — no duplicate declarations
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    setRemaining(initialSeconds);
    if (initialSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialSeconds]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <span className="font-mono text-amber-400 font-bold text-lg">
      {formatTime(remaining)}
    </span>
  );
}

export default function Drift() {
  const { updateUsage } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: QUERY_KEYS.DRIFT,
      queryFn: driftApi.getDrift,
      refetchInterval: INTERVALS.DRIFT,
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

  const severityScore = data?.severity_score ?? 0;
  const driftState = data?.drift_state ?? 'none';
  const severityColor = getSeverityColor(severityScore);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter italic uppercase text-[var(--text-primary)]">
              Concept Drift
            </h1>
            {data?.served_from_cache === false && (
               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-[#d97706] bg-[#fef3c7] border border-[#fcd34d]">
                 <RefreshCw className="w-3 h-3 animate-spin" />
                 Computing...
               </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Distribution shift detection across model features
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-active)] transition-colors text-sm text-[var(--text-secondary)]"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <Card className="glass-card border-[var(--status-critical)]/30">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-[var(--status-critical)]" />
            <p className="text-sm text-[var(--text-muted)]">
              Drift detection unavailable. Check backend logs.
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {data.baseline_exists === false && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
              <Card className="glass-card border-amber-400/30 bg-amber-400/5">
                <CardContent className="p-4 flex items-center gap-4">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                  <p className="text-sm font-medium text-amber-400">
                    No drift baseline found — retrain the model to establish one.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Severity score — large display */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.05 }}
          >
            <Card className={`glass-card border ${getSeverityCardBg(severityScore)}`}>
              <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="text-center md:w-48 shrink-0">
                  <p className="text-xs font-sans uppercase tracking-widest text-[var(--text-muted)] mb-2">
                    Drift Score
                  </p>
                  <p className={`font-mono font-black text-4xl leading-none ${severityColor}`}>
                    {severityScore}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-2 font-mono">/ 15</p>
                  
                  {/* Progress bar */}
                  <div className="mt-4 h-1.5 w-full bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getSeverityBg(severityScore)} transition-all duration-1000 ease-out`}
                      style={{ width: `${(severityScore / 15) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Drift State</span>
                    <DriftStateBadge score={severityScore} state={driftState} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Drift Detected</span>
                    <span className={`font-mono text-xs font-bold ${data.drift_detected ? 'text-[var(--status-warning)]' : 'text-[var(--status-healthy)]'}`}>
                      {data.drift_detected ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Snapshot Date</span>
                    <span className="font-mono text-xs text-[var(--text-data)]">
                      {(data as any).snapshot_date === 'unknown' || (data as any).snapshot_date === 'computed_live' 
                         ? <span className="text-amber-400">Live computation</span>
                         : (data as any).snapshot_date ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Confidence</span>
                    <span className="font-mono text-xs text-[var(--text-data)]">
                      {((data as any).drift_confidence != null
                        ? ((data as any).drift_confidence * 100).toFixed(1)
                        : '—')}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Exposure Scale</span>
                    <span className="font-mono text-xs text-[var(--text-data)]">
                      {(data.exposure_scale * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Metric cards row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.10 }}>
              <MetricCard
                title="Baseline"
                value={data.baseline_exists ? 'PRESENT' : 'MISSING'}
                icon={<ShieldCheck className="h-4 w-4" />}
                description="Drift reference point"
                className={data.baseline_exists ? 'border-[var(--status-healthy)]/20' : 'border-rose-500/20'}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.14 }}>
              <MetricCard
                title="Model Version"
                value={data.model_version || '—'}
                icon={<Zap className="h-4 w-4 text-[var(--accent-primary)]" />}
                description="Active artifact"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.18 }}>
              <MetricCard
                title="Status"
                value={data.retrain_required ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold leading-none bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    RETRAIN NEEDED
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold leading-none bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                    STABLE
                  </span>
                )}
                icon={<Activity className="h-4 w-4" />}
                description={data.retrain_required ? "Threshold severity ≥ 8" : "No retrain required"}
                className={data.retrain_required ? 'border-rose-500/20' : ''}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.22 }}>
              <MetricCard
                title="Source"
                value={data.served_from_cache ? 'CACHED' : 'LIVE'}
                icon={<Activity className="h-4 w-4 text-[var(--text-secondary)]" />}
                description={`${data.latency_ms}ms`}
              />
            </motion.div>
          </div>

          {/* Retrain warning banner */}
          {data.retrain_required && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring}
            >
              <Card className="glass-card border-[var(--status-critical)]/30 bg-[var(--status-critical)]/5">
                <CardContent className="p-5 flex items-center gap-4">
                  <AlertTriangle className="h-6 w-6 text-[var(--status-critical)] shrink-0" />
                  <div>
                    <p className="font-mono font-bold text-sm text-[var(--status-critical)] uppercase tracking-widest">
                      Retrain Required
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Drift severity exceeds the retrain threshold. Run:{' '}
                      <code className="font-mono text-[var(--text-data)]">
                        docker-compose run --rm -e SKIP_SYNC=1 training
                      </code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Cooldown timer — FIX: live countdown */}
          {data.cooldown_active && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.26 }}
            >
              <Card className="glass-card border-[var(--status-warning)]/30">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-[var(--status-warning)]" />
                    <div>
                      <p className="font-mono font-bold text-sm text-[var(--status-warning)] uppercase tracking-widest">
                        Retrain Cooldown Active
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        A retrain was triggered recently. Waiting before allowing another.
                      </p>
                    </div>
                  </div>
                  {/* FIX: live countdown using cooldown_remaining_seconds */}
                  <CooldownTimer initialSeconds={data.cooldown_remaining_seconds} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}