import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { agentApi, equityApi, DemoLockedError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SignalBadge } from '@/components/SignalBadge';
import LockedFeature from '@/components/LockedFeature';
import { useAuthStore } from '@/store/authStore';
import { SignalExplanation } from '@/components/SignalExplanation';
import { MetricCard } from '@/components/MetricCard';
import { cn } from '@/lib/utils';
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

// spring removed as it was unused

// ── Custom tooltip for equity chart ──────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</p>
      <p className="font-bold text-cyan-400 text-lg">
        ${Number(payload[0]?.value).toFixed(2)}
      </p>
    </div>
  );
}

export default function SignalDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const { updateUsage, isFeatureLocked } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<{ name: string; reset: number } | null>(null);
  const isLocked = isFeatureLocked('agent');

  const tickerUpper = ticker?.toUpperCase() ?? '';

  const {
    data: explainData,
    isLoading: explainLoading,
    isError: explainError,
    error: explainErrorObj,
  } = useQuery({
    queryKey: QUERY_KEYS.AGENT_EXPLAIN(tickerUpper),
    queryFn: () => agentApi.explain(tickerUpper),
    enabled: !!tickerUpper && !isLocked,
    staleTime: INTERVALS.AGENT_EXPLAIN,
    retry: (failCount: number, err: any) => {
      if (err instanceof DemoLockedError) return false;
      return failCount < 3;
    },
  });

  const { data: prData, isLoading: prLoading } = useQuery({
    queryKey: QUERY_KEYS.POLITICAL_RISK(tickerUpper),
    queryFn: () => agentApi.getPoliticalRisk(tickerUpper),
    enabled: !!tickerUpper && !isLocked,
    staleTime: INTERVALS.AGENT_EXPLAIN,
    retry: 1,
  });

  const { data: historyData } = useQuery<EquityHistoryResponse>({
    queryKey: QUERY_KEYS.EQUITY_HISTORY(tickerUpper),
    queryFn: () => equityApi.getHistory(tickerUpper, 90),
    enabled: !!tickerUpper && !isLocked,
    staleTime: INTERVALS.UNIVERSE,
  });

  if (explainError && explainErrorObj instanceof DemoLockedError) {
    if (explainErrorObj.usage) updateUsage(explainErrorObj.usage);
    if (!lockedFeature) setLockedFeature({ name: explainErrorObj.feature, reset: explainErrorObj.resetInSeconds });
  }
  if (lockedFeature) return <LockedFeature featureName={lockedFeature.name} resetInSeconds={lockedFeature.reset} />;

  const detail = explainData?.data;
  const pr = prData?.data ?? prData;

  const chartData = (historyData?.history ?? []).map((row) => ({
    date: row.date?.slice(5) ?? '',
    close: row.close,
  }));

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-12 p-4 md:p-6 min-h-full pb-32">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-6">
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-cyan-400 transition-all group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-2" />
            Back to Index
          </motion.button>
          
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {tickerUpper} Analysis
            </h1>
            <p className="text-sm text-slate-400">
              Technical and sentiment evaluation
            </p>
          </div>
        </div>

        {detail?.signal && (
          <div className="flex flex-col items-end gap-6">
             <div className="flex items-center gap-4 bg-black/40 border border-white/5 px-6 py-2 rounded-xl shadow-2xl backdrop-blur-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-semibold text-emerald-400">Live</span>
             </div>
             <div className="scale-150 origin-right">
                <SignalBadge signal={detail.signal as any} className="text-4xl px-10 py-4 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-none" />
             </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {explainLoading && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[2rem] bg-white/5" />
          ))}
        </div>
      )}

      {/* Error State */}
      {explainError && !explainLoading && (
        <Card className="glass-card border-rose-500/30 bg-rose-500/5 rounded-[2rem]">
          <CardContent className="p-12 flex flex-col items-center text-center gap-6">
            <div className="h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center">
               <AlertTriangle className="h-8 w-8 text-rose-500" />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-bold uppercase tracking-widest text-white">Data Unavailable</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm font-medium">
                The connection for {tickerUpper} has failed to initialize. It may be excluded from the current market snapshot.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {detail && (
        <>
          {/* Signal Attributes */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Model Score"
              value={detail.raw_model_score?.toFixed(4) ?? '—'}
              icon={<Zap className="text-amber-400" />}
              description="Primary AI rating"
            />
            <MetricCard
              title="Agreement"
              value={detail.hybrid_consensus_score?.toFixed(4) ?? '—'}
              icon={<Activity className="text-cyan-400" />}
              description="Agent consensus score"
            />
            <MetricCard
              title="Confidence"
              value={detail.confidence_numeric != null ? `${(detail.confidence_numeric * 100).toFixed(1)}%` : '—'}
              icon={<Shield className="text-indigo-400" />}
              description="Forecast certainty"
              trend={{ value: 0, label: '', isPositive: (detail.confidence_numeric ?? 0) > 0.7 }}
            />
            <MetricCard
              title="Safety Score"
              value={detail.governance_score != null ? `${detail.governance_score}/100` : '—'}
              icon={<Fingerprint className="text-emerald-400" />}
              description="Internal compliance check"
            />
          </div>

          {/* RISK STATS BADGES */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-[2.5rem] overflow-hidden p-10">
              <div className="flex flex-wrap gap-8">
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Profile</span>
                  <div className={cn(
                    "text-xs font-bold capitalize px-4 py-2 rounded-xl shadow w-fit",
                    detail.risk_level === 'critical' ? 'text-rose-400 border-rose-500/50 bg-rose-500/10' :
                    detail.risk_level === 'high' ? 'text-amber-400 border-amber-500/50 bg-amber-500/10' :
                    'text-emerald-400 border-emerald-500/50 bg-emerald-500/10'
                  )}>
                    {detail.risk_level ?? 'Normal'}
                  </div>
                </div>
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volatility</span>
                  <div className="text-xs font-bold capitalize text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-xl shadow w-fit">
                    {detail.volatility_regime?.replace('_', ' ') ?? 'Stable'}
                  </div>
                </div>
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stability</span>
                  <div className={cn(
                    "text-xs font-bold capitalize px-4 py-2 rounded-xl shadow w-fit",
                    !detail.drift_state || detail.drift_state === 'none' 
                      ? 'text-slate-400 bg-slate-500/5 border border-white/5' 
                      : 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                  )}>
                    {detail.drift_state ?? 'Good'}
                  </div>
                </div>
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bias</span>
                  <div className={cn(
                    "text-xs font-bold capitalize px-4 py-2 rounded-xl shadow w-fit",
                    detail.technical_bias === 'bullish' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' :
                    detail.technical_bias === 'bearish' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/30' :
                    'text-slate-400 bg-slate-500/5 border border-white/10'
                  )}>
                    {detail.technical_bias ?? 'Neutral'}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* EQUITY PRICE VOLATILITY CHART */}
          {chartData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
                <CardHeader className="pb-8 border-b border-white/5 p-10">
                  <CardTitle className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cyan-500" />
                    Equity Price Action - 90 Days
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="priceGradientDetail" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="10 10" stroke="#ffffff03" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace', fontWeight: 900 }}
                          tickLine={false}
                          axisLine={false}
                          interval={14}
                          dy={15}
                        />
                        <YAxis
                          tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace', fontWeight: 900 }}
                          tickLine={false}
                          axisLine={false}
                          width={60}
                          tickFormatter={(v) => `$${Math.round(v)}`}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#22d3ee', strokeWidth: 1 }} />
                        <Area
                          type="monotone"
                          dataKey="close"
                          stroke="#22d3ee"
                          strokeWidth={4}
                          fill="url(#priceGradientDetail)"
                          dot={false}
                          activeDot={{ r: 6, fill: '#22d3ee', strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Warnings */}
          {(detail.warnings ?? []).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="glass-card border-none bg-rose-500/5 shadow-2xl backdrop-blur-xl rounded-[2.5rem] p-10">
                 <div className="flex items-center gap-4 mb-6">
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                    <span className="text-sm font-bold text-rose-500">System Warnings</span>
                 </div>
                 <div className="grid gap-4">
                    {(detail.warnings as string[]).map((w, i) => (
                      <div key={i} className="px-6 py-4 rounded-2xl bg-black/40 border border-rose-500/20 flex items-center gap-6">
                         <span className="font-mono text-xs text-rose-500/40">0{i+1}</span>
                         <span className="text-xs font-mono text-slate-300 leading-relaxed">{w}</span>
                      </div>
                    ))}
                 </div>
              </Card>
            </motion.div>
          )}

          {/* Unified Explanation Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <SignalExplanation
              explanation={detail.explanation ?? ''}
              ticker={tickerUpper}
              signal={detail.signal ?? ''}
              governanceScore={detail.governance_score}
              riskLevel={detail.risk_level ?? undefined}
              volatilityRegime={detail.volatility_regime ?? undefined}
              technicalBias={detail.technical_bias ?? undefined}
              driftState={detail.drift_state ?? undefined}
              selectionReason={detail.selection_reason}
              inTop5={detail.in_top_5}
              agentsApproved={detail.agents_approved}
              agentsFlagged={detail.agents_flagged}
              agentScores={detail.agent_scores}
              confidenceNumeric={detail.confidence_numeric}
            />
          </motion.div>

          {/* Geopolitical Risk Agent Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
              <CardHeader className="pb-8 border-b border-white/5 p-10">
                <CardTitle className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  Global Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-12">
                {prLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-24 w-full bg-white/5 rounded-2xl" />
                    <Skeleton className="h-40 w-full bg-white/5 rounded-2xl" />
                  </div>
                ) : pr ? (
                  <div className="space-y-12">
                    <div className="flex flex-wrap items-center gap-16">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Score</p>
                        <p className="font-mono text-4xl font-bold text-white tracking-tight">
                          {pr.political_risk_score ? (pr.political_risk_score * 100).toFixed(0) : '00'}<span className="text-lg text-slate-600 ml-1">%</span>
                        </p>
                      </div>
                      <div className="flex-1 min-w-[300px] space-y-4">
                         <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-500">Distribution</span>
                            <span className="text-cyan-400">Stable</span>
                         </div>
                         <div className="h-4 w-full bg-white/5 rounded-full p-1.5 shadow-inner flex overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(pr.political_risk_score ?? 0) * 100}%` }}
                              className="h-full bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                            />
                         </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-xs font-semibold text-slate-500 text-right">Risk Level</p>
                        <div className="text-xs font-bold capitalize text-amber-400 bg-amber-500/10 border border-amber-500/30 px-6 py-2 rounded-xl shadow block text-center">
                          {pr.political_risk_label ?? 'Normal'}
                        </div>
                      </div>
                    </div>

                    {pr.political_risk_score === 0.0 && (!pr.top_events || pr.top_events.length === 0) ? (
                      <div className="flex items-center gap-4 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-500/80 shadow-inner">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                        <span className="text-xs font-medium leading-relaxed">
                          News stream interrupted. Using last known data for {tickerUpper}.
                        </span>
                      </div>
                    ) : pr.top_events?.length > 0 ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <p className="text-xs font-semibold text-slate-500">Relevant News</p>
                           <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="grid gap-4">
                          {pr.top_events.map((e: any, i: number) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + (i * 0.05) }}
                              className="px-8 py-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex items-center gap-8 group hover:bg-cyan-500/[0.03] hover:border-cyan-500/20 transition-all duration-500"
                            >
                              <span className="font-mono text-xs text-cyan-500 opacity-40 group-hover:opacity-100 transition-opacity">0{i+1}</span>
                              <span className="text-[13px] font-mono text-slate-400 group-hover:text-white transition-colors leading-relaxed">{e}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-20">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Risk Data Unavailable</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}