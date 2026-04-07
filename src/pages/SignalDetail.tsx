import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { agentApi, equityApi, DemoLockedError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SignalBadge } from '@/components/SignalBadge';
import LockedFeature from '@/components/LockedFeature';
import { useAuthStore } from '@/store/authStore';
import {
  ArrowLeft,
  AlertTriangle,
  Fingerprint,
  Zap,
  Shield,
  Activity,
} from 'lucide-react';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { EquityHistoryResponse } from '@/types';

const spring = { type: 'spring', stiffness: 260, damping: 20 };

// ── Custom tooltip for equity chart ──────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-3 text-xs">
      <p className="text-[var(--text-muted)] mb-1">{label}</p>
      <p className="font-mono font-bold text-[var(--accent-primary)]">
        ${Number(payload[0]?.value).toFixed(2)}
      </p>
    </div>
  );
}

export default function SignalDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const { updateUsage } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

  const tickerUpper = ticker?.toUpperCase() ?? '';

  // Use agentApi.explain — don't pass explicit generic to avoid type conflict between api.ts and types/index.ts
  const {
    data: explainData,
    isLoading: explainLoading,
    isError: explainError,
    error: explainErrorObj,
  } = useQuery({
    queryKey: QUERY_KEYS.AGENT_EXPLAIN(tickerUpper),
    queryFn: () => agentApi.explain(tickerUpper),
    enabled: !!tickerUpper,
    staleTime: INTERVALS.AGENT_EXPLAIN,
    retry: (failCount: number, err: any) => {
      if (err instanceof DemoLockedError) return false;
      return failCount < 3;
    },
  });

  const { data: prData, isLoading: prLoading } = useQuery({
    queryKey: QUERY_KEYS.POLITICAL_RISK(tickerUpper),
    queryFn: () => agentApi.getPoliticalRisk(tickerUpper),
    enabled: !!tickerUpper,
    staleTime: INTERVALS.AGENT_EXPLAIN,
    retry: false, // GDELT timeout fixes — do not retry automatically
  });

  // Equity price history for chart
  const { data: historyData } = useQuery<EquityHistoryResponse>({
    queryKey: QUERY_KEYS.EQUITY_HISTORY(tickerUpper),
    queryFn: () => equityApi.getHistory(tickerUpper, 90),
    enabled: !!tickerUpper,
    staleTime: INTERVALS.UNIVERSE,
  });

  // Handle DemoLockedError
  if (explainError && explainErrorObj instanceof DemoLockedError) {
    if (explainErrorObj.usage) updateUsage(explainErrorObj.usage);
    if (!lockedFeature) setLockedFeature(explainErrorObj.feature);
  }
  if (lockedFeature) return <LockedFeature featureName={lockedFeature} />;

  // Read from data wrapper — response.data not response directly
  const detail = explainData?.data;
  const pr = prData?.data ?? prData;

  const chartData = (historyData?.history ?? []).map((row) => ({
    date: row.date?.slice(5) ?? '',   // MM-DD
    close: row.close,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="space-y-6 p-6"
    >
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </motion.div>
        <div>
          {/* Giant mono ticker — text-7xl per spec */}
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter italic uppercase text-[var(--text-primary)]">
            Signal Detail
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Snapshot Date: {detail?.snapshot_date ?? '—'}
          </p>
        </div>
        {detail?.signal && (
          <div className="ml-auto">
            <SignalBadge signal={detail.signal as any} />
          </div>
        )}
      </div>

      {/* Loading */}
      {explainLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      )}

      {/* Error */}
      {explainError && !explainLoading && (
        <Card className="glass-card border-[var(--status-critical)]/30">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-[var(--status-critical)]" />
            <div>
              <p className="font-semibold text-[var(--status-critical)]">
                Signal not found
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {tickerUpper} may not be in the current snapshot universe.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {detail && (
        <>
          {/* Key metrics */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              {
                label: 'RAW SCORE',
                value: detail.raw_model_score?.toFixed(4) ?? '—',
                icon: <Zap className="h-4 w-4 text-[var(--accent-primary)]" />,
                delay: 0.04,
              },
              {
                label: 'HYBRID SCORE',
                value: detail.hybrid_consensus_score?.toFixed(4) ?? '—',
                icon: <Activity className="h-4 w-4 text-[var(--accent-primary)]" />,
                delay: 0.08,
              },
              {
                // FIX: confidence_numeric can be null — show — not 0
                label: 'CONFIDENCE',
                value:
                  detail.confidence_numeric != null
                    ? `${(detail.confidence_numeric * 100).toFixed(1)}%`
                    : '—',
                icon: <Shield className="h-4 w-4 text-[var(--text-secondary)]" />,
                delay: 0.12,
              },
              {
                // FIX: governance_score can be null
                label: 'GOVERNANCE',
                value:
                  detail.governance_score != null
                    ? `${detail.governance_score}/100`
                    : '—',
                icon: <Fingerprint className="h-4 w-4 text-[var(--text-secondary)]" />,
                delay: 0.16,
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: item.delay }}
              >
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {item.icon}
                      <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">
                        {item.label}
                      </span>
                    </div>
                    <p className="font-mono font-black italic text-xl text-[var(--text-data)]">
                      {item.value}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Risk / regime badges */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.20 }}
          >
            <Card className="glass-card">
              <CardContent className="p-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">Risk Level</span>
                  <span className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-md
                    ${detail.risk_level === 'critical' ? 'text-[var(--status-critical)] bg-[var(--status-critical)]/10' :
                      detail.risk_level === 'high' ? 'text-[var(--status-warning)] bg-[var(--status-warning)]/10' :
                      'text-[var(--status-healthy)] bg-[var(--status-healthy)]/10'}`}>
                    {detail.risk_level ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">Volatility</span>
                  <span className="font-mono text-xs font-bold uppercase text-[var(--text-data)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded-md">
                    {detail.volatility_regime ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">Drift</span>
                  <span className="font-mono text-xs font-bold uppercase text-[var(--text-data)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded-md">
                    {detail.drift_state ?? 'none'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">Technical Bias</span>
                  <span className="font-mono text-xs font-bold uppercase text-[var(--text-data)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded-md">
                    {detail.technical_bias ?? '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Price history chart */}
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.24 }}
            >
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Price History — 90 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={false}
                        axisLine={false}
                        interval={14}
                      />
                      <YAxis
                        tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={false}
                        axisLine={false}
                        width={55}
                        tickFormatter={(v) => `$${v.toFixed(0)}`}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="close"
                        stroke="var(--accent-primary)"
                        strokeWidth={2}
                        fill="url(#priceGradient)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Warnings */}
          {(detail.warnings ?? []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.28 }}
            >
              <Card className="glass-card border-[var(--signal-warning)]/20">
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--signal-warning)] flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {detail.warnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[var(--signal-warning)]/5 border border-[var(--signal-warning)]/10"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-[var(--signal-warning)] mt-0.5 shrink-0" />
                      <span className="text-xs text-[var(--text-secondary)]">{w}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Explanation */}
          {detail.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.32 }}
            >
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Agent Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--text-secondary)] font-mono leading-relaxed">
                    {detail.explanation}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* LLM sections — only shown when LLM enabled and structured output present */}
          {detail.llm?.llm_enabled && detail.llm?.structured && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.36 }}
              className="space-y-4"
            >
              {/* Summary */}
              {detail.llm.structured.summary && (
                <Card className="glass-card border-t-2 border-t-[var(--accent-primary)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      LLM Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {detail.llm.structured.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Risk commentary */}
              {detail.llm.structured.risk_commentary && (
                <Card className="glass-card border-t-2 border-t-[var(--signal-warning)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--signal-warning)]">
                      Risk Commentary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {detail.llm.structured.risk_commentary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Outlook */}
              {detail.llm.structured.outlook && (
                <Card className="glass-card border-t-2 border-t-[var(--signal-long)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--signal-long)]">
                      Outlook
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {detail.llm.structured.outlook}
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Political Risk Agent Panel */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.40 }}
            className="space-y-4"
          >
            <Card className="glass-card border-t-2 border-t-amber-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-amber-500">
                  Political Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prLoading ? (
                  <Skeleton className="h-16 w-full bg-[var(--bg-surface)]" />
                ) : pr ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Risk Score</p>
                        <p className="font-mono text-xl font-bold text-[var(--text-data)]">{pr.political_risk_score?.toFixed(2) ?? '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Label</p>
                        <span className="font-mono text-xs font-bold uppercase text-[var(--text-data)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded-md mt-1 block w-max">
                          {pr.political_risk_label ?? 'UNKNOWN'}
                        </span>
                      </div>
                    </div>
                    {pr.political_risk_score === 0.0 && (!pr.top_events || pr.top_events.length === 0) ? (
                      <div className="flex items-center gap-2 p-3 mt-4 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">Live political data unavailable — GDELT service timeout.</span>
                      </div>
                    ) : pr.top_events?.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Top Events</p>
                        <ul className="space-y-1.5">
                          {pr.top_events.map((e: any, i: number) => (
                            <li key={i} className="text-sm text-[var(--text-secondary)] list-disc ml-5">
                              {typeof e === 'string' ? e : (e.title || JSON.stringify(e))}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">Political risk data unavailable.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}