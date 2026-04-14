import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { driftApi, DemoLockedError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/MetricCard';
import { AlertTriangle, ShieldCheck, RefreshCw, Clock, Activity, Zap } from 'lucide-react';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
  const { updateUsage, isFeatureLocked } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<{ name: string; reset: number } | null>(null);
  const isLocked = isFeatureLocked('drift');

  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: QUERY_KEYS.DRIFT,
      queryFn: driftApi.getDrift,
      refetchInterval: INTERVALS.DRIFT,
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

  const severityScore = data?.severity_score ?? 0;
  const driftState = data?.drift_state ?? 'none';
  const severityColor = getSeverityColor(severityScore);

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
            System Stability
          </h1>
          <p className="text-sm text-slate-400">
            Monitoring AI model performance and data consistency
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => refetch()}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500/50 hover:text-cyan-400 transition-all font-semibold text-sm text-slate-300 backdrop-blur-xl group"
        >
          <RefreshCw className={`h-4 w-4 transition-transform group-hover:rotate-180 duration-700 ${isFetching ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh
        </motion.button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
              Analysis unavailable. Please try again later.
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
                    No stability baseline found — a system update may be required.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Severity score — large display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: 0.05 }}
          >
            <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden relative">
              <div className={cn("absolute top-0 left-0 w-1 h-full", getSeverityBg(severityScore))} />
              <CardContent className="p-10 flex flex-col md:flex-row items-center gap-12">
                <div className="text-center md:w-64 shrink-0 relative group">
                  <div className={cn("absolute inset-0 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity", getSeverityBg(severityScore))} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                    Stability Score
                  </p>
                  <p className={cn("font-mono font-bold text-5xl leading-none", severityColor)}>
                    {severityScore.toFixed(1)}
                  </p>
                  <div className="mt-8 flex gap-1 relative z-10">
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "h-2 w-full rounded-sm transition-all duration-500",
                          i < (severityScore / 15) * 20 ? getSeverityBg(severityScore) : "bg-white/5"
                        )} 
                        style={{ transitionDelay: `${i * 30}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-4 font-semibold">Max Threshold: 15.0</p>
                </div>
                <div className="flex-1 space-y-6 w-full">
                  {[
                    { label: 'System Status', value: driftState === 'hard' ? 'CRITICAL' : driftState === 'soft' ? 'WARNING' : 'HEALTHY', color: severityColor },
                    { label: 'Issue Detected', value: data.drift_detected ? 'Alert' : 'None', color: data.drift_detected ? 'text-rose-500' : 'text-emerald-400' },
                    { label: 'Confidence Score', value: `${((data as any).drift_confidence != null ? ((data as any).drift_confidence * 100).toFixed(1) : '—')}%` },
                    { label: 'Impact Scale', value: `${(data.exposure_scale * 100).toFixed(0)}%` },
                    { label: 'Response Time', value: `${data.latency_ms}ms`, color: 'text-cyan-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between group/row border-b border-white/5 pb-4">
                      <span className="text-xs font-semibold text-slate-500 group-hover/row:text-slate-300 transition-colors">{item.label}</span>
                      <span className={cn("font-mono text-sm font-bold", item.color ?? "text-white")}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Metric cards row */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.10 }}>
              <MetricCard
                title="Reference Data"
                value={data.baseline_exists ? 'Active' : 'Missing'}
                icon={<ShieldCheck className="h-4 w-4" />}
                description="Stability baseline state"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.14 }}>
              <MetricCard
                title="Model Version"
                value={data.model_version || '01'}
                icon={<Zap className="h-4 w-4 text-cyan-500" />}
                description="Current analysis engine"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.18 }}>
              <MetricCard
                title="Model Status"
                value={data.retrain_required ? 'Warning' : 'Good'}
                icon={<Activity className="h-4 w-4" />}
                description={data.retrain_required ? "Correction needed" : "Healthy performance"}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.22 }}>
              <MetricCard
                title="Data Source"
                value={data.served_from_cache ? 'Cached' : 'Live'}
                icon={<Activity className="h-4 w-4 text-amber-500" />}
                description={`${data.latency_ms}ms latency`}
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
                    <p className="font-bold text-sm text-[var(--status-critical)] uppercase tracking-widest">
                      System update recommended
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Model accuracy has degraded below the stable threshold.
                    </p>
                    <div className="mt-2 text-[10px] font-bold text-[var(--status-critical)] bg-[var(--status-critical)]/10 px-2 py-1 rounded inline-block uppercase tracking-widest">
                      ACTION REQUIRED: Trigger backend retraining pipeline
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Cooldown timer — FIX: live countdown */}
          {data.cooldown_active && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.26 }}
            >
              <Card className="glass-card border-none bg-amber-500/5 shadow-2xl backdrop-blur-xl rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Clock className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-amber-500 mb-1">
                        Retrain Cooldown Active
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Model is stabilizing. Please wait before retraining again.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-amber-500/70">Time Remaining:</span>
                    <CooldownTimer initialSeconds={data.cooldown_remaining_seconds} />
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