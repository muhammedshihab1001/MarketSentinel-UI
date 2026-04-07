import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { agentApi, equityApi, predictionApi, DemoLockedError } from '@/lib/api';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SignalBadge } from '@/components/SignalBadge';
import LockedFeature from '@/components/LockedFeature';
import { Search, AlertTriangle } from 'lucide-react';
import { isTickerAllowed } from '@/constants';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Top5RationaleItem } from '@/types';

// ── Custom Tooltip for Price Chart ──────────────────────────────────────────

function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const close = payload.find((p: any) => p.dataKey === 'close');
  const vol   = payload.find((p: any) => p.dataKey === 'volume');
  return (
    <div className="glass-card border-[var(--border-subtle)] bg-[var(--bg-elevated)] rounded-xl px-3 py-2 text-xs font-mono space-y-1 shadow-lg">
      <p className="text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
      {close && (
        <p className="text-[var(--accent-primary)] font-black">
          ${Number(close.value).toFixed(2)}
        </p>
      )}
      {vol && (
        <p className="text-[var(--text-muted)]">
          Vol: {Number(vol.value).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ── labelColor helper ────────────────────────────────────────────────────────

function labelColor(label: string) {
  switch (label) {
    case 'LOW':
      return { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', bar: 'bg-emerald-400', score: 'text-emerald-400' };
    case 'MEDIUM':
      return { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', bar: 'bg-amber-400', score: 'text-amber-400' };
    case 'HIGH':
      return { badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30', bar: 'bg-orange-400', score: 'text-orange-400' };
    case 'CRITICAL':
      return { badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse', bar: 'bg-rose-400', score: 'text-rose-400' };
    case 'UNAVAILABLE':
      return { badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30', bar: 'bg-slate-500', score: 'text-slate-400' };
    default:
      return { badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30', bar: 'bg-slate-500', score: 'text-slate-400' };
  }
}

// ── Top-5 Rationale Card ─────────────────────────────────────────────────────

function RationaleCard({ item, index }: { item: Top5RationaleItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.08 }}
      className="glass-card border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-2xl p-5 flex flex-col gap-4"
    >
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono font-black text-2xl text-[var(--accent-primary)] italic">#{item.rank}</span>
          <span className="font-mono font-black text-xl text-[var(--text-primary)] uppercase">{item.ticker}</span>
          <SignalBadge signal={item.signal} />
        </div>
        <span className="font-mono text-sm text-[var(--accent-primary)] font-black">
          weight: {(item.weight * 100).toFixed(2)}%
        </span>
      </div>

      {/* 4 stat mini-cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Hybrid Score', value: item.hybrid_score.toFixed(4) },
          { label: 'Raw Score',    value: item.raw_model_score.toFixed(4) },
          { label: 'Confidence',   value: (item.confidence * 100).toFixed(1) + '%' },
          { label: 'Gov Score',    value: `${item.governance_score} / 10` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[var(--bg-overlay)] rounded-xl p-2 flex flex-col gap-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">{label}</p>
            <p className="font-mono font-black text-[var(--accent-primary)]">{value}</p>
          </div>
        ))}
      </div>

      {/* Agent badges */}
      <div className="space-y-2">
        {item.agents_approved.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Approved:</span>
            {item.agents_approved.map((a) => (
              <span key={a} className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {a}
              </span>
            ))}
          </div>
        )}
        {item.agents_flagged.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Flagged:</span>
            {item.agents_flagged.map((a) => (
              <span key={a} className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5" />{a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Agent scores mini-bars */}
      <div className="space-y-1.5">
        {([
          ['SignalAgent',    item.agent_scores.signal_agent],
          ['TechnicalAgent', item.agent_scores.technical_agent],
          ['Raw Model',      item.agent_scores.raw_model],
        ] as [string, number][]).map(([label, score]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--text-muted)] w-28 shrink-0">{label}</span>
            <div className="flex-1 h-1 rounded-full bg-[var(--bg-overlay)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)]"
                style={{ width: `${Math.max(0, Math.min(100, score * 100))}%` }}
              />
            </div>
            <span className="text-xs font-mono text-[var(--text-data)] w-8 text-right">{score.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Selection reason */}
      {item.selection_reason && (
        <div className="glass-card bg-[var(--bg-muted)] p-3 rounded-xl border border-[var(--border-subtle)] mt-1">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.selection_reason}</p>
        </div>
      )}

      {/* Warnings */}
      {item.warnings?.length > 0 && (
        <div className="space-y-1">
          {item.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-xs font-mono text-amber-400">{w}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AgentExplanation() {
  const { selectedTicker, setSelectedTicker } = useAppStore();
  const [ticker, setTicker] = useState(selectedTicker ?? '');
  const [searchTicker, setSearchTicker] = useState(selectedTicker ?? '');

  useEffect(() => {
    if (selectedTicker) {
      setTicker(selectedTicker);
      setSearchTicker(selectedTicker);
    }
  }, [selectedTicker]);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: explainResponse, isLoading: explainLoading, isError: explainIsError, error: explainError } =
    useQuery({
      queryKey: ['agent-explain', searchTicker],
      queryFn: () => agentApi.explain(searchTicker),
      enabled: searchTicker.length > 0,
      retry: (failCount, err: any) => {
        if (err instanceof DemoLockedError) return false;
        return failCount < 3;
      },
      refetchInterval: (query) => {
        if (query.state.error && (query.state.error as any)?.status === 503) return 15000;
        return false;
      },
      throwOnError: false,
    });

  const { data: politicalResponse, isLoading: politicalLoading, error: politicalError } =
    useQuery({
      queryKey: ['agent-political', searchTicker],
      queryFn: () => agentApi.getPoliticalRisk(searchTicker),
      enabled: searchTicker.length > 0,
      // retry: 1 (not false) — clears stale GDELT error state on re-mount
      retry: 1,
    });

  const { data: agentsResponse } = useQuery({
    queryKey: ['agent-list'],
    queryFn: () => agentApi.getAgents(),
    staleTime: Infinity,
  });

  // ADDITION A — Price history via correct endpoint: /equity/{ticker}/history
  const { data: priceHistory, isLoading: priceLoading } = useQuery({
    queryKey: ['equity-history', searchTicker],
    queryFn: () => equityApi.getHistory(searchTicker, 90),
    enabled: searchTicker.length > 0,
    retry: false,
    staleTime: 300000,
  });

  // ADDITION B — Top-5 rationale from snapshot
  const { data: snapshotData } = useQuery({
    queryKey: ['snapshot-rationale'],
    queryFn: predictionApi.getLiveSnapshot,
    staleTime: 300000,
    retry: false,
  });

  const top5Rationale: Top5RationaleItem[] = snapshotData?.executive_summary?.top_5_rationale ?? [];

  // ── Handlers & Derived State ────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    const t = ticker.trim().toUpperCase();
    setSearchTicker(t);
    setSelectedTicker(t);
  };

  const lockedError = (explainError instanceof DemoLockedError) ? explainError :
                      (politicalError instanceof DemoLockedError) ? politicalError : null;

  if (lockedError) {
    return (
      <div className="p-6">
        <LockedFeature featureName={lockedError.feature} />
      </div>
    );
  }

  const is503 = explainIsError && (explainError as any)?.status === 503;
  const explainData = explainResponse?.data;
  const prData = politicalResponse?.data;
  const agentsData = agentsResponse?.data?.agents;

  const getGovernanceColor = (score: number) => {
    if (score >= 7) return 'bg-emerald-500';
    if (score >= 4) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const tickerInUniverse = searchTicker ? isTickerAllowed(searchTicker) : true;

  // Price chart data (thin every 15th x-axis tick)
  const priceData = priceHistory?.prices ?? [];
  const xTickFormatter = (_: string, idx: number) => (idx % 15 === 0 ? priceData[idx]?.date ?? '' : '');

  // Political risk helpers
  const prColors = prData ? labelColor(prData.political_risk_label) : labelColor('');
  const isUnavailable = prData?.political_risk_label === 'UNAVAILABLE';
  const gdeltStatus = prData?.gdelt_status ?? '';
  const gdeltFallbackProvider = gdeltStatus.startsWith('gdelt_failed_used_')
    ? gdeltStatus.replace('gdelt_failed_used_', '').toUpperCase()
    : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-6 space-y-6">

      {/* ── Section 1: Ticker Search ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="glass-card p-6 rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl items-center relative">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Enter ticker symbol (e.g. AAPL)"
                className="pl-10 h-12 font-mono bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-subtle)] uppercase text-lg"
              />
            </div>
            <Button type="submit" className="h-12 bg-[var(--accent-primary)] text-black font-bold px-6 py-2 uppercase tracking-widest font-mono hover:bg-cyan-400">
              Analyse
            </Button>
            {explainLoading && (
              <div className="absolute -right-8">
                <div className="h-5 w-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              </div>
            )}
          </form>

          {searchTicker && !tickerInUniverse && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Ticker {searchTicker} not found in current universe.</span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── 503 Computing State ── */}
      {is503 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <div className="glass-card border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-2xl p-10 flex flex-col items-center gap-6 text-center">
            <div className="font-mono text-[var(--accent-primary)] text-lg">
              Snapshot computing — agent data will be available in ~90 seconds
            </div>
            <div className="w-full max-w-sm h-1.5 rounded-full bg-[var(--bg-overlay)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-cyan-300"
                animate={{ scaleX: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                style={{ originX: 0 }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Error ── */}
      {explainIsError && !is503 && !explainLoading && !(explainError instanceof DemoLockedError) && (
        <Card className="glass-card border-rose-500/30">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
            <div>
              <p className="font-semibold text-rose-500">Agent explanation unavailable</p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">Could not fetch data. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Signal + Political Risk Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-6">

        {/* Section 2: Signal Explanation Card */}
        {explainData && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="glass-card h-full">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                  {/* Left Column */}
                  <div>
                    <div className="mb-6">
                      <SignalBadge signal={explainData.signal} className="text-4xl px-4 py-2" />
                      <p className="text-xl font-mono text-[var(--text-muted)] mt-4 font-black tracking-widest">{explainData.ticker}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1 font-bold">Raw Model Score</p>
                        <p className="font-mono text-[var(--accent-primary)] text-xl font-black">{explainData.raw_model_score?.toFixed(4) ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1 font-bold">Hybrid Score</p>
                        <p className="font-mono text-[var(--accent-primary)] text-xl font-black">{explainData.hybrid_consensus_score?.toFixed(4) ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1 font-bold">Confidence</p>
                        <p className="font-mono text-[var(--accent-primary)] text-xl font-black">
                          {explainData.confidence_numeric != null ? (explainData.confidence_numeric * 100).toFixed(1) + '%' : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1 font-bold">Weight</p>
                        <p className="font-mono text-[var(--accent-primary)] text-xl font-black">
                          {explainData.weight != null ? (explainData.weight * 100).toFixed(2) + '%' : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {[
                      { label: 'Risk Level', value: explainData.risk_level,
                        cls: explainData.risk_level === 'low' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                             explainData.risk_level === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                             'bg-rose-500/20 text-rose-400 border border-rose-500/30' },
                      { label: 'Volatility', value: explainData.volatility_regime,
                        cls: explainData.volatility_regime === 'normal' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
                             explainData.volatility_regime === 'high_volatility' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                             'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
                      { label: 'Technical Bias', value: explainData.technical_bias,
                        cls: explainData.technical_bias === 'bullish' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                             explainData.technical_bias === 'bearish' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                             'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
                      { label: 'Drift State', value: explainData.drift_state || 'none',
                        cls: explainData.drift_state === 'none' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
                             explainData.drift_state === 'soft' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                             'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">{label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${cls}`}>{value || '—'}</span>
                      </div>
                    ))}
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Governance Score</span>
                        <span className="font-mono text-xs text-white">{explainData.governance_score ?? 0} / 10</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${getGovernanceColor(explainData.governance_score ?? 0)}`}
                          style={{ width: `${((explainData.governance_score ?? 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanations & Warnings */}
                <div className="space-y-4">
                  {explainData.warnings?.length > 0 && (
                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-bold">Warnings</span>
                      </div>
                      {explainData.warnings.map((w, i) => (
                        <p key={i} className="text-xs font-mono text-amber-400">• {w}</p>
                      ))}
                    </div>
                  )}
                  {explainData.explanation && (
                    <div className="glass-card bg-[var(--bg-muted)] p-4 rounded-xl border border-[var(--border-subtle)]">
                      <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest font-bold mb-2">Agent Explanation</p>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{explainData.explanation}</p>
                    </div>
                  )}
                  {explainData.llm?.llm_enabled && (
                    <div className="glass-card p-4 rounded-xl border border-[var(--border-subtle)] border-l-[3px] border-l-cyan-400">
                      <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest font-bold mb-2">AI Rationale ({explainData.llm.model})</p>
                      <div className="space-y-3">
                        {explainData.llm.structured ? (
                          <>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed"><strong className="text-white">Summary:</strong> {explainData.llm.structured.summary}</p>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed"><strong className="text-white">Rationale:</strong> {explainData.llm.structured.rationale}</p>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed"><strong className="text-white">Risk Commentary:</strong> {explainData.llm.structured.risk_commentary}</p>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed"><strong className="text-white">Outlook:</strong> {explainData.llm.structured.outlook}</p>
                          </>
                        ) : (
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">Rationale computing or unavailable.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Section 3: Political Risk Card — ADDITION C */}
        {(politicalLoading || prData) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="glass-card h-full">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">Political Risk</CardTitle>
                  <div className="flex items-center gap-2">
                    {/* gdelt_status badge */}
                    {gdeltFallbackProvider && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                        via {gdeltFallbackProvider}
                      </span>
                    )}
                    {!politicalLoading && prData?.political_risk_label && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold uppercase border ${prColors.badge}`}>
                        {prData.political_risk_label}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {politicalLoading ? (
                  <Skeleton className="h-40 w-full rounded-xl bg-[var(--bg-surface)]" />
                ) : prData ? (
                  <div className="space-y-6">
                    {/* Score display */}
                    <div>
                      <div className={`text-3xl font-mono font-black italic ${prColors.score}`}>
                        {isUnavailable ? 'N/A' : `${(prData.political_risk_score * 100).toFixed(0)}%`}
                      </div>
                      <div className="h-2 w-full bg-[var(--bg-overlay)] rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full transition-all duration-1000 ${prColors.bar}`}
                          style={{ width: isUnavailable ? '0%' : `${prData.political_risk_score * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* UNAVAILABLE notice */}
                    {isUnavailable && (
                      <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-mono text-amber-400 font-bold">
                            No political data available — all news providers unavailable.
                          </p>
                          <p className="text-xs font-mono text-amber-400/70 mt-0.5">
                            Showing last known score or default (0.0).
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Events list */}
                    <div className="space-y-2">
                      {prData.top_events?.length === 0 ? (
                        <div className="flex items-start gap-2 bg-amber-950/20 p-3 rounded-lg border border-amber-500/30">
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-amber-400 font-mono">Live political data unavailable — GDELT service timeout.</span>
                        </div>
                      ) : (
                        <div className="space-y-0">
                          {prData.top_events?.map((evt: any, idx: number) => (
                            <div key={idx} className="py-2.5 flex justify-between gap-3 border-b border-[var(--border-subtle)] last:border-0">
                              <span className="text-xs font-mono text-[var(--text-secondary)] line-clamp-2">{evt.title}</span>
                              <span className="text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">{evt.date}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Source badge */}
                    <div className="flex justify-end gap-2 pt-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase
                        ${prData.served_from_cache ? 'bg-slate-800 text-slate-400' : 'bg-cyan-900/40 text-cyan-400'}`}>
                        {prData.served_from_cache ? 'CACHED' : 'LIVE'}
                      </span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* ── ADDITION A: Price Chart ────────────────────────────────────────── */}
      {searchTicker.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="glass-card border-[var(--border-subtle)] rounded-2xl p-6">
            <p className="font-mono text-sm uppercase tracking-widest text-[var(--text-muted)] mb-5">
              {searchTicker} — 90-Day Price History
            </p>

            {priceLoading ? (
              <Skeleton className="h-64 w-full rounded-xl bg-[var(--bg-surface)]" />
            ) : priceData.length > 0 ? (
              <div className="space-y-2">
                {/* Close line chart */}
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={priceData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={xTickFormatter}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                    />
                    <Tooltip content={<PriceTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke="var(--accent-primary)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3, fill: 'var(--accent-primary)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Volume bar chart */}
                <ResponsiveContainer width="100%" height={60}>
                  <BarChart data={priceData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                    <Bar dataKey="volume" fill="var(--accent-primary)" opacity={0.3} radius={[2, 2, 0, 0]} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip content={<PriceTooltip />} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-[var(--text-muted)] text-sm font-mono">
                No price data available for {searchTicker}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── ADDITION B: Top-5 Rationale ──────────────────────────────────── */}
      {top5Rationale.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <p className="text-sm font-mono uppercase tracking-widest text-[var(--text-muted)] font-bold">
            Agent-Approved Portfolio Selections
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {top5Rationale.map((item, idx) => (
              <RationaleCard key={item.ticker} item={item} index={idx} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Section 4: Agent Pipeline Panel ── */}
      {agentsData && Object.keys(agentsData).length > 0 && (
        <div className="pt-8 space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-muted)] font-bold">Pipeline Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(agentsData as Record<string, any>).map(([key, agent], index) => {
              const weightColor = key === 'signal_agent' ? 'bg-cyan-400' :
                                  key === 'technical_risk_agent' ? 'bg-blue-400' :
                                  key === 'portfolio_decision_agent' ? 'bg-emerald-400' : 'bg-amber-400';
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="glass-card border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-2xl h-full">
                    <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-mono font-bold text-sm text-white">{agent.name}</h3>
                          <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border border-cyan-500/20">
                            {agent.weight * 100}%
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{agent.description}</p>
                      </div>
                      <div className="h-1 w-full bg-[var(--bg-overlay)] rounded-full overflow-hidden mt-auto">
                        <div className={`h-full rounded-full ${weightColor}`} style={{ width: `${agent.weight * 100}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

    </motion.div>
  );
}