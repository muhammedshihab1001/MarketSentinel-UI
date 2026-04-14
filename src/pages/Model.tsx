import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modelApi, api, DemoLockedError, OwnerOnlyError } from '@/lib/api';
import LockedFeature from '@/components/LockedFeature';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/MetricCard';
import {
  Fingerprint,
  Layers,
  Copy,
  CheckCheck,
  Cpu,
  Zap,
  BarChart2,
  Activity,
  Lock,
} from 'lucide-react';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ModelInfoResponse, FeatureImportanceResponse } from '@/types';

const spring = { type: 'spring', stiffness: 260, damping: 20 };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: spring } };

// ── Copy to clipboard button ──────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckCheck className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 text-slate-500" />
      )}
    </button>
  );
}

// ── Hash display row ─────────────────────
function HashRow({ label, value }: { label: string; value?: string }) {
  const display = value && value !== 'unknown'
    ? value.slice(0, 16) + '...'
    : '—';
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group/row">
      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold group-hover/row:text-slate-300 transition-colors">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-white tracking-widest">{display}</span>
        {value && value !== 'unknown' && <CopyButton text={value} />}
      </div>
    </div>
  );
}

// ── Signal quality color ──────────────────────────────────
function qualityStyles(qual: string): string {
  const map: Record<string, string> = {
    strong:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    moderate: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    weak:     'text-amber-400 bg-amber-500/10 border-amber-500/20',
    noise:    'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  return map[qual] ?? map.noise;
}

export default function Model() {
  const { updateUsage, isFeatureLocked } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<{ name: string; reset: number } | null>(null);
  const isLocked = isFeatureLocked('snapshot');

  const { data: info, isLoading: infoLoading } = useQuery<ModelInfoResponse>({
    queryKey: QUERY_KEYS.MODEL_INFO,
    queryFn: modelApi.getInfo,
    staleTime: INTERVALS.MODEL_INFO,
    enabled: !isLocked,
  });

  const { data: featureData, isLoading: featLoading, isError, error } =
    useQuery<FeatureImportanceResponse>({
      queryKey: QUERY_KEYS.MODEL_FEATURES,
      queryFn: modelApi.getFeatureImportance,
      staleTime: INTERVALS.MODEL_INFO,
      throwOnError: false,
      retry: (failCount: number, err: any) => {
        if (err instanceof DemoLockedError) return false;
        return failCount < 3;
      },
      enabled: !isLocked,
    });

  const { data: icStats, error: icError } = useQuery({
    queryKey: ['model', 'ic-stats', 30],
    queryFn: async () => {
      const { data } = await api.get('/model/ic-stats?days=30');
      return data;
    },
    staleTime: INTERVALS.MODEL_INFO,
    retry: (failCount: number, err: any) => {
      if (err instanceof OwnerOnlyError) return false;
      return failCount < 3;
    },
    enabled: !isLocked,
  });

  const isLoading = infoLoading || featLoading;

  const topFeatures = [...(featureData?.importance ?? [])]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 12);

  const maxImportance = topFeatures[0]?.importance ?? 1;
  const icQual = icStats?.signal_quality ?? 'noise';

  if (isError && featureData === undefined && error instanceof DemoLockedError) {
    if ((error as any).usage) updateUsage((error as any).usage);
    if (!lockedFeature) setLockedFeature({ name: error.feature ?? 'signals', reset: error.resetInSeconds });
  }
  if (lockedFeature) return <LockedFeature featureName={lockedFeature.name} resetInSeconds={lockedFeature.reset} />;

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
            AI Model
          </h1>
          <p className="text-sm text-slate-400">
            Model version and performance metrics
          </p>
        </div>
      </div>

      {/* Loading Skeletors */}
      {isLoading && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl bg-white/5" />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {/* Top Metric Nodes */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Model Version"
              value={info?.model_version ?? '—'}
              icon={<Cpu />}
              description="Active analysis engine"
            />
            <MetricCard
              title="Factors Used"
              value={String(info?.feature_count ?? '—')}
              icon={<Layers />}
              description="Active analysis data"
            />
            <MetricCard
              title="Signal Strength"
              value={icStats?.status === 'no_predictions' || icStats?.ic_mean == null ? 'Pending' : icStats.ic_mean.toFixed(4)}
              icon={<Activity />}
              description="Model predictive grade"
               trend={{ value: 0, label: '', isPositive: icStats?.ic_mean > 0 }}
            />
            <MetricCard
              title="Confidence"
              value={icStats?.ic_t_stat != null && icStats.ic_t_stat !== 0 ? icStats.ic_t_stat.toFixed(4) : 'Pending'}
              icon={<Zap />}
              description={icStats?.ic_t_stat != null && icStats.ic_t_stat !== 0 ? 'Statistical reliability' : 'Populates after 30 trading days'}
              trend={{ value: 0, label: '', isPositive: icStats?.ic_t_stat > 2 }}
            />
          </div>

          {/* IC Telemetry Panel */}
          {icError instanceof OwnerOnlyError ? (
            <Card className="glass-card border-none bg-black/40 rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl backdrop-blur-xl">
                 <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Lock className="h-8 w-8 text-amber-500" />
                 </div>
                 <div className="text-center">
                   <h3 className="text-xl font-bold text-white tracking-tight">Signal Quality Metrics</h3>
                   <p className="text-xs text-slate-500 mt-2">Requires administrator access</p>
                 </div>
            </Card>
          ) : icStats && (
            <motion.div variants={item}>
              <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-8 border-b border-white/5 p-8">
                  <CardTitle className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-500" />
                    Performance Log
                    {icStats.status === 'ok' && (
                      <div className={cn("ml-auto px-4 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase border border-white/5 bg-black/40", qualityStyles(icQual))}>
                        GRADE: {icQual.toUpperCase()}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                  {icStats.status === 'no_predictions' ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                       <Zap className="h-10 w-10 mb-4" />
                       <p className="text-[11px] font-bold uppercase tracking-widest">Waiting for first system update...</p>
                    </div>
                  ) : icStats.status === 'ok' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {[
                        { label: 'Avg Strength',  value: icStats.ic_mean?.toFixed(4) ?? '—' },
                        { label: 'Variation',     value: icStats.ic_std?.toFixed(4) ?? '—' },
                        { label: 'Reliability',   value: icStats.ic_t_stat?.toFixed(4) ?? '—' },
                        { label: 'Data Points',   value: String(icStats.n_days ?? '—') },
                      ].map((item) => (
                        <div key={item.label} className="p-6 rounded-2xl bg-white/5 border border-white/5 group hover:border-cyan-500/30 transition-all">
                          <p className="text-xs font-semibold text-slate-500 mb-2">
                            {item.label}
                          </p>
                          <p className="font-mono font-bold text-3xl text-white tracking-tight truncate" title={String(item.value)}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Artifact registry */}
            <motion.div variants={item} className="lg:col-span-1">
              <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden h-full">
                <CardHeader className="pb-8 border-b border-white/5 p-8">
                  <CardTitle className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                    <Fingerprint className="h-3.5 w-3.5 text-amber-500" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-2">
                  <HashRow label="Model Version"    value={info?.model_version} />
                  <HashRow label="Version Hash"     value={info?.artifact_hash} />
                  <HashRow label="Schema Signature" value={info?.schema_signature} />
                  <HashRow label="Dataset Hash"     value={info?.dataset_hash} />
                  <HashRow label="Training Hash"    value={info?.training_code_hash} />
                  <HashRow label="Feature Checksum" value={info?.feature_checksum} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature sensitivity map */}
            <motion.div variants={item}>
              <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden h-full">
                <CardHeader className="pb-8 border-b border-white/5 p-8">
                  <CardTitle className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                    <BarChart2 className="h-3.5 w-3.5 text-cyan-500" />
                    Analysis Factors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {topFeatures.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                       <Zap className="h-8 w-8 mb-3" />
                       <p className="text-xs font-medium text-slate-500">No factor data available</p>
                    </div>
                  )}
                  {topFeatures.map((feat, i) => {
                    const pct = (feat.importance / maxImportance) * 100;
                    return (
                      <motion.div
                        key={feat.feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.28 + i * 0.03 }}
                        className="space-y-3 group/feat"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-white group-hover/feat:text-cyan-400 transition-colors truncate max-w-[65%]">
                            {feat.feature}
                          </span>
                          <span className="font-mono text-xs font-semibold text-white/90">
                            {feat.importance.toFixed(4)}
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/5 p-0.5 flex gap-0.5 shadow-inner">
                           <motion.div
                             initial={{ width: 0 }}
                             animate={{ width: `${pct}%` }}
                             transition={{ ...spring, delay: 0.32 + i * 0.03 }}
                             className="h-full rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                           />
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}