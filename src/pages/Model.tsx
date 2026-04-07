import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { modelApi, api, OwnerOnlyError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
      className="p-1 rounded hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer"
      title="Copy to clipboard"
      aria-label="Copy full hash"
    >
      {copied ? (
        <CheckCheck className="h-3.5 w-3.5 text-[var(--status-healthy)]" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-[var(--text-muted)]" />
      )}
    </button>
  );
}

// ── Hash display row — 12 chars + copy button ─────────────
function HashRow({ label, value }: { label: string; value?: string }) {
  // Show first 12 chars + ellipsis, copy button copies full hash
  const display = value && value !== 'unknown'
    ? value.slice(0, 12) + '…'
    : '—';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-xs text-[var(--text-secondary)] font-sans">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-[var(--text-muted)]">{display}</span>
        {value && value !== 'unknown' && <CopyButton text={value} />}
      </div>
    </div>
  );
}

// ── Signal quality color ──────────────────────────────────
function qualityColor(qual: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    strong:   { bg: 'bg-[var(--status-healthy)]/10',  text: 'text-[var(--status-healthy)]' },
    moderate: { bg: 'bg-[var(--accent-primary)]/10',  text: 'text-[var(--accent-primary)]' },
    weak:     { bg: 'bg-[var(--status-warning)]/10',  text: 'text-[var(--status-warning)]' },
    noise:    { bg: 'bg-rose-500/10', text: 'text-rose-500' },
  };
  return map[qual] ?? map.noise;
}

export default function Model() {
  const { data: info, isLoading: infoLoading } = useQuery<ModelInfoResponse>({
    queryKey: QUERY_KEYS.MODEL_INFO,
    queryFn: modelApi.getInfo,
    staleTime: INTERVALS.MODEL_INFO,
  });

  const { data: featureData, isLoading: featLoading } =
    useQuery<FeatureImportanceResponse>({
      queryKey: QUERY_KEYS.MODEL_FEATURES,
      queryFn: modelApi.getFeatureImportance,
      staleTime: INTERVALS.MODEL_INFO,
    });

  // IC stats — direct api call since no helper in api.ts
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
  });

  const isLoading = infoLoading || featLoading;

  // Top 15 features sorted by importance descending
  const topFeatures = [...(featureData?.importance ?? [])]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 15);

  const maxImportance = topFeatures[0]?.importance ?? 1;

  const icQual = icStats?.signal_quality ?? 'noise';
  const { bg: icBg, text: icText } = qualityColor(icQual);

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
          Model
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Artifact integrity, training fingerprint, and feature importance
        </p>
      </div>

      {/* IC Stats Owner Lock — renders immediately on 403, independent of isLoading */}
      {icError instanceof OwnerOnlyError && (
        <div className="pb-6">
          <motion.div variants={item}>
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center text-center p-6 gap-4">
                <Lock className="h-6 w-6 text-[var(--accent-primary)] opacity-60" />
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Signal Quality Metrics</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">IC Statistics are available to owner accounts only.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Skeleton — only while loading, regardless of icError */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {/* Top metric cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              {
                title: 'Model Version',
                value: info?.model_version ?? '—',
                icon: <Cpu className="h-4 w-4 text-[var(--accent-primary)]" />,
                desc: 'Current artifact',
                delay: 0.04,
              },
              {
                title: 'Feature Count',
                value: String(info?.feature_count ?? '—'),
                icon: <Layers className="h-4 w-4 text-[var(--text-secondary)]" />,
                desc: 'Model features',
                delay: 0.08,
              },
              {
                title: 'IC Mean',
                value: icStats?.ic_mean != null ? icStats.ic_mean.toFixed(4) : '—',
                icon: <Activity className="h-4 w-4 text-[var(--accent-primary)]" />,
                desc: 'Information coefficient',
                delay: 0.12,
              },
              {
                title: 'IC T-Stat',
                value: icStats?.ic_t_stat != null ? icStats.ic_t_stat.toFixed(4) : '—',
                icon: <Zap className="h-4 w-4 text-[var(--text-secondary)]" />,
                desc: 'Statistical significance',
                delay: 0.16,
              },
            ].map((card) => (
              <motion.div key={card.title} variants={item}>
                <Card className="glass-card group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {card.icon}
                      <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">
                        {card.title}
                      </span>
                    </div>
                    <p className="font-mono font-black text-lg md:text-xl italic text-[var(--text-data)]">
                      {card.value}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{card.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* IC Stats panel */}
          {icStats && !(icError instanceof OwnerOnlyError) && (
            <motion.div variants={item}>
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    IC Statistics — 30 Day
                    <span className={`ml-auto inline-flex px-2 py-0.5 rounded-md text-xs font-mono font-bold uppercase ${icBg} ${icText}`}>
                      {icQual}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'IC Mean', value: icStats.ic_mean?.toFixed(4) ?? '—' },
                      { label: 'IC Std', value: icStats.ic_std?.toFixed(4) ?? '—' },
                      { label: 'IC T-Stat', value: icStats.ic_t_stat?.toFixed(4) ?? '—' },
                      { label: 'N Days', value: String(icStats.n_days ?? '—') },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-xl bg-[var(--bg-overlay)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)] mb-1">
                          {item.label}
                        </p>
                        <p className="font-mono font-black text-lg italic text-[var(--text-data)]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Artifact hashes */}
            <motion.div variants={item}>
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                    <Fingerprint className="h-4 w-4" />
                    Integrity Hashes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* 12 chars displayed, full hash on copy */}
                  <HashRow label="Model Version" value={info?.model_version} />
                  <HashRow label="Artifact Hash" value={info?.artifact_hash} />
                  <HashRow label="Schema Signature" value={info?.schema_signature} />
                  <HashRow label="Dataset Hash" value={info?.dataset_hash} />
                  <HashRow label="Training Code Hash" value={info?.training_code_hash} />
                  <HashRow label="Feature Checksum" value={info?.feature_checksum} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature importance bars */}
            <motion.div variants={item}>
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    Top Features ({topFeatures.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {topFeatures.length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                      Feature importance not available
                    </p>
                  )}
                  {topFeatures.map((feat, i) => {
                    const pct = (feat.importance / maxImportance) * 100;
                    return (
                      <motion.div
                        key={feat.feature}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.28 + i * 0.03 }}
                        className="space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-[var(--text-secondary)] truncate max-w-[65%]">
                            {feat.feature}
                          </span>
                          <span className="font-mono text-xs text-[var(--text-data)]">
                            {feat.importance.toFixed(4)}
                          </span>
                        </div>
                        {/* Animated bar */}
                        <div className="h-1.5 rounded-full bg-[var(--bg-overlay)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ ...spring, delay: 0.32 + i * 0.03 }}
                            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-cyan-300"
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