import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { agentApi, equityApi, predictionApi, DemoLockedError } from '@/lib/api';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SignalBadge } from '@/components/SignalBadge';
import LockedFeature from '@/components/LockedFeature';
import { SignalExplanation } from '@/components/SignalExplanation';
import { 
  Search, 
  AlertTriangle, 
  Database, 
  LineChart as LineChartIcon,
  FileSearch,
  Layers,
  RefreshCw,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Top5RationaleItem } from '@/types';
import { cn } from '@/lib/utils';

// ── Tooltip for Price Chart ──────────────────────────────────────────

function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const close = payload.find((p: any) => p.dataKey === 'close');
  const vol   = payload.find((p: any) => p.dataKey === 'volume');
  return (
    <div className="glass-card border-white/10 bg-black/80 rounded-xl px-4 py-3 text-[10px] space-y-2 shadow-2xl backdrop-blur-xl border-l-[4px] border-l-cyan-500">
      <p className="text-slate-500 uppercase tracking-widest font-bold">{label}</p>
      <div className="space-y-1">
        {close && (
          <p className="text-white font-bold italic">
            Close: <span className="text-cyan-400">${Number(close.value).toFixed(2)}</span>
          </p>
        )}
        {vol && (
          <p className="text-slate-400 font-bold uppercase">
            Vol: {Number(vol.value).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

// ── labelColor helper ────────────────────────────────────────────

function labelColor(label: string) {
  switch (label) {
    case 'LOW':
      return { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', bar: 'bg-emerald-500', score: 'text-emerald-400' };
    case 'MEDIUM':
      return { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', bar: 'bg-amber-500', score: 'text-amber-400' };
    case 'HIGH':
      return { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', bar: 'bg-orange-500', score: 'text-orange-400' };
    case 'CRITICAL':
      return { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse', bar: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]', score: 'text-rose-400' };
    case 'UNAVAILABLE':
      return { badge: 'bg-slate-800 text-slate-500 border-white/5', bar: 'bg-slate-800', score: 'text-slate-500' };
    default:
      return { badge: 'bg-slate-800 text-slate-500 border-white/5', bar: 'bg-slate-800', score: 'text-slate-500' };
  }
}

// ── LLM State Helper ─────────────────────────────────────────────

function getLLMState(llm: any) {
  if (!llm) return { show: false, type: 'none' as const }
  if (!llm.llm_enabled) return { show: false, type: 'disabled' as const }
  if (llm.error) return { show: true, type: 'error' as const, message: llm.message }
  if (llm.structured) return { show: true, type: 'success' as const, data: llm.structured }
  return { show: false, type: 'none' as const }
}

// ── Drift State Helper ───────────────────────────────────────────

function getDriftDisplay(state: string) {
  const s = state?.toLowerCase() || 'none';
  switch (s) {
    case 'none':
      return { label: 'Stable', color: 'text-white' };
    case 'soft':
      return { label: 'Soft Drift (Weight Adjusted)', color: 'text-amber-400' };
    case 'hard':
      return { label: 'Hard Drift (Weight Adjusted)', color: 'text-rose-500' };
    case 'baseline_missing':
      return { label: 'No Baseline Available', color: 'text-slate-500' };
    case 'detector_failure':
      return { label: 'Detector Error', color: 'text-slate-500' };
    default:
      return { label: state || 'Stable', color: 'text-white' };
  }
}

// ── Rationale Node Card ─────────────────────────────────────────

function RationaleNode({ item, index }: { item: Top5RationaleItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-[2.5rem] p-8 flex flex-col gap-6 group hover:border-white/10 transition-all border border-white/5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-black text-4xl text-cyan-500 tracking-tight leading-none shrink-0">#{item.rank}</span>
          <div className="h-10 w-px bg-white/10" />
          <div className="space-y-1">
             <span className="font-bold text-2xl text-white tracking-tight leading-none">{item.ticker}</span>
              <p className="text-xs font-semibold text-slate-500">Equity Signal</p>
          </div>
        </div>
        <SignalBadge signal={item.signal} className="text-xs px-4 py-1.5 shadow-xl scale-110" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'AI Score',     value: item.hybrid_score.toFixed(4) },
          { label: 'Confidence',   value: item.confidence != null ? Math.round(item.confidence * 100) + '%' : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 rounded-2xl p-4 flex flex-col gap-1 border border-white/5 shadow-inner">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="text-lg font-bold text-cyan-400">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500">Agent Votes</p>
        <div className="flex flex-wrap gap-2">
          {item.agents_approved.map((a) => (
            <span key={a} className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {a}
            </span>
          ))}
          {item.agents_flagged.map((a) => (
            <span key={a} className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" /> {a}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {([
          ['Data Logic',         item.agent_scores.signal_agent],
          ['Market Patterns',     item.agent_scores.technical_agent],
          ['Forecast Model',      item.agent_scores.raw_model],
        ] as [string, number][]).map(([label, score]) => (
          <div key={label} className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
               <span className="text-xs font-semibold text-slate-500">{label}</span>
               <span className="text-xs font-semibold text-white">{score.toFixed(3)}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, Math.min(100, score * 100))}%` }}
                className="h-full rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              />
            </div>
          </div>
        ))}
      </div>

      {item.selection_reason && (
        <div className="bg-black/40 p-5 rounded-2xl border border-white/5 mt-auto relative overflow-hidden group/text">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 opacity-20 group-hover/text:opacity-60 transition-opacity" />
          <p className="text-xs font-bold text-slate-500 mb-2">Reasoning</p>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">{item.selection_reason}</p>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────

export default function AgentExplanation() {
  const { selectedTicker, setSelectedTicker } = useAppStore();
  const { isFeatureLocked } = useAuthStore();
  const [ticker, setTicker] = useState(selectedTicker ?? '');
  const isLocked = isFeatureLocked('agent');
  const [searchTicker, setSearchTicker] = useState(selectedTicker ?? '');

  useEffect(() => {
    if (selectedTicker) {
      setTicker(selectedTicker);
      setSearchTicker(selectedTicker);
    }
  }, [selectedTicker]);

  const { data: explainResponse, isLoading: explainLoading, isError: explainIsError, error: explainError } =
    useQuery({
      queryKey: ['agent-explain', searchTicker],
      queryFn: () => agentApi.explain(searchTicker),
      enabled: searchTicker.length > 0 && !isLocked,
      retry: (failCount, err: any) => {
        if (err instanceof DemoLockedError) return false;
        return failCount < 3;
      },
      refetchInterval: (query) => {
        if (query.state.error && (query.state.error as any)?.status === 503) return 15000;
        return false;
      },
    });

  const { data: politicalResponse, isLoading: politicalLoading, error: politicalError } =
    useQuery({
      queryKey: ['agent-political', searchTicker],
      queryFn: () => agentApi.getPoliticalRisk(searchTicker),
      enabled: searchTicker.length > 0 && !isLocked,
      retry: 1,
    });

  const { data: agentsResponse } = useQuery({
    queryKey: ['agent-list'],
    queryFn: () => agentApi.getAgents(),
    staleTime: Infinity,
  });

  const { data: priceHistory, isLoading: priceLoading } = useQuery({
    queryKey: ['equity-history', searchTicker],
    queryFn: () => equityApi.getHistory(searchTicker, 90),
    enabled: searchTicker.length > 0,
    retry: false,
    staleTime: 300000,
  });

  const { data: snapshotData } = useQuery({
    queryKey: ['snapshot-rationale'],
    queryFn: predictionApi.getLiveSnapshot,
    staleTime: 300000,
    retry: false,
  });

  const top5Rationale: Top5RationaleItem[] = snapshotData?.executive_summary?.top_5_rationale ?? [];

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
    return <LockedFeature featureName={lockedError.feature} resetInSeconds={lockedError.resetInSeconds} />;
  }

  const is503 = explainIsError && (explainError as any)?.status === 503;
  const explainData = explainResponse?.data;
  const prData = politicalResponse?.data;
  const agentsData = agentsResponse?.data?.agents;

  const llmState = getLLMState(explainData?.llm || null);

  const prColors = prData ? labelColor(prData.political_risk_label) : labelColor('');
  const isUnavailable = prData?.political_risk_label === 'UNAVAILABLE';
  const priceData = priceHistory?.history ?? [];
  const volTagDisplay = explainData ? (
    explainData.volatility_regime === 'high_volatility' ? 'High' :
    explainData.volatility_regime === 'low_volatility' ? 'Stable' :
    'Normal'
  ) : 'Normal';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 p-4 md:p-6 min-h-full pb-32">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-none">
            Signal Analysis
          </h1>
          <p className="text-sm text-slate-400">
            Real-time market insights and agent reasoning
          </p>
        </div>

        {/* Ticker Search */}
        <form onSubmit={handleSearch} className="flex gap-4 max-w-xl w-full">
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-700 group-focus-within:text-cyan-500 transition-colors" />
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Ticker (e.g. AAPL)"
                className="h-14 pl-12 rounded-2xl bg-black/40 border-white/5 font-bold text-xl tracking-widest text-white shadow-lg focus:ring-1 focus:ring-cyan-500/30"
              />
              {explainLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <RefreshCw className="h-4 w-4 text-cyan-500 animate-spin" />
                </div>
              )}
           </div>
           <Button type="submit" className="h-14 w-14 rounded-2xl bg-white text-black hover:bg-cyan-500 hover:text-white shadow-lg transition-all shrink-0">
              <ArrowRight className="h-6 w-6" />
           </Button>
        </form>
      </div>

      {/* Snapshot State */}
      {is503 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-12 rounded-3xl bg-black/40 border border-white/5 text-center space-y-8 backdrop-blur-md">
           <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-12 w-12 text-cyan-500 animate-spin" />
              <h3 className="text-2xl font-bold text-white">Analysis in Progress...</h3>
              <p className="text-sm text-slate-400 max-w-md">Our models are currently processing the latest market data. The analysis should be ready in about a minute.</p>
           </div>
           <div className="w-full max-w-md mx-auto h-2 rounded-full bg-white/5 overflow-hidden p-0.5">
              <motion.div className="h-full bg-cyan-500 rounded-full" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
           </div>
        </motion.div>
      )}

      {/* Main Content Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-8">
        
        <AnimatePresence mode="wait">
          {explainData ? (
            <motion.div key="data" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="glass-card border-none bg-black/40 shadow-2xl rounded-[3rem] p-4 relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                   <FileSearch className="h-64 w-64" />
                </div>
                
                <CardHeader className="p-8 border-b border-white/5">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <CardTitle className="text-2xl font-bold text-white leading-none">{explainData.ticker}</CardTitle>
                         <p className="text-sm font-medium text-slate-400">Analysis Result</p>
                      </div>
                      <SignalBadge signal={explainData.signal} className="text-md px-6 py-1.5 shadow-lg" />
                   </div>
                </CardHeader>

                <CardContent className="p-10 space-y-12 relative z-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'AI Score',        value: explainData.raw_model_score?.toFixed(4) },
                      { label: 'Agreement',       value: explainData.hybrid_consensus_score?.toFixed(4) },
                      { label: 'Confidence',      value: explainData.confidence_numeric != null ? Math.round(explainData.confidence_numeric * 100) + '%' : '—' },
                      { label: 'Target Weight',   value: (explainData.weight * 100).toFixed(2) + '%' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-xl font-bold text-cyan-400">{stat.value || '—'}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                         { label: 'Risk Level',       value: explainData.risk_level, color: 'text-white' },
                         { label: 'Volatility State', value: volTagDisplay, color: 'text-white' },
                         { label: 'Trend Bias',       value: explainData.technical_bias, color: 'text-white' },
                         { 
                           label: 'System Stability', 
                           value: getDriftDisplay(explainData.drift_state).label,
                           color: getDriftDisplay(explainData.drift_state).color
                         }
                      ].map(tag => (
                        <div key={tag.label} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                           <span className="text-xs font-semibold text-slate-500">{tag.label}</span>
                           <span className={cn("text-xs font-bold capitalize", tag.color)}>{tag.value}</span>
                        </div>
                      ))}
                  </div>

                  <div className="space-y-6">
                     {llmState.show && (
                       <div className="space-y-4 mb-10">
                          {llmState.type === 'success' && llmState.data && (
                            <div className="space-y-4">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">AI Intelligence Report</p>
                                 </div>
                                 <span className="px-2 py-0.5 rounded-[4px] bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                                    {explainData?.llm?.cached ? 'Cached' : 'AI Enhanced'}
                                 </span>
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:bg-white/[0.07] transition-colors">
                                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Executive Summary</p>
                                     <p className="text-sm text-slate-300 leading-relaxed font-medium">{llmState.data.summary}</p>
                                  </div>
                                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:bg-white/[0.07] transition-colors">
                                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strategic Outlook</p>
                                     <p className="text-sm text-slate-300 leading-relaxed font-medium">{llmState.data.outlook}</p>
                                  </div>
                                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:bg-white/[0.07] transition-colors">
                                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Signal Rationale</p>
                                     <p className="text-sm text-slate-300 leading-relaxed font-medium">{llmState.data.rationale}</p>
                                  </div>
                                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:bg-white/[0.07] transition-colors">
                                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Commentary</p>
                                     <p className="text-sm text-slate-300 leading-relaxed font-medium">{llmState.data.risk_commentary}</p>
                                  </div>
                               </div>
                            </div>
                          )}
                          {llmState.type === 'error' && (
                             <p className="text-xs text-slate-500 font-medium italic opacity-80">
                                {llmState.message}
                             </p>
                          )}
                       </div>
                     )}

                     <div className="flex items-center gap-4">
                        <span className="h-px flex-1 bg-white/10" />
                        <p className="text-xs font-semibold text-slate-500">AI Rationale</p>
                        <span className="h-px flex-1 bg-white/10" />
                     </div>
                     <SignalExplanation 
                        explanation={explainData.explanation ?? ''} 
                        ticker={searchTicker} 
                        signal={explainData.signal ?? ''}
                        governanceScore={explainData.governance_score}
                        confidenceNumeric={explainData.confidence_numeric}
                        llm={explainData.llm}
                        driftState={explainData.drift_state}
                        riskLevel={explainData.risk_level}
                        volatilityRegime={explainData.volatility_regime}
                        technicalBias={explainData.technical_bias}
                        inTop5={explainData.in_top_5}
                        selectionReason={explainData.selection_reason}
                        agentsApproved={explainData.agents_approved ?? []}
                        agentsFlagged={explainData.agents_flagged ?? []}
                        agentScores={explainData.agent_scores ?? {}}
                     />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : !explainLoading ? (
            <div className="flex flex-col items-center justify-center p-20 rounded-[3rem] border border-dashed border-white/10 bg-black/20 text-slate-500 text-center space-y-4">
               <Layers className="h-16 w-16 opacity-20" />
               <p className="text-sm font-medium">Enter a ticker symbol above to view analysis</p>
            </div>
          ) : (
            <div className="space-y-8">
               <Skeleton className="h-64 w-full rounded-[3rem] bg-white/5" />
               <Skeleton className="h-96 w-full rounded-[3rem] bg-white/5" />
            </div>
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <div className="space-y-8">
           {/* Risk Scan */}
           <Card className="glass-card border-none bg-black/40 shadow-2xl rounded-[2.5rem] p-10 border border-white/5">
              <div className="space-y-8">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Scan</p>
                    {prData && (
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border", prColors.badge)}>
                         {prData.political_risk_label}
                      </span>
                    )}
                 </div>

                 {politicalLoading ? (
                   <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
                 ) : prData ? (
                   <div className="space-y-8">
                      <div className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-3xl font-bold text-white tracking-tight leading-none">
                               {isUnavailable ? 'N/A' : `${(prData.political_risk_score * 100).toFixed(0)}%`}
                            </span>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</p>
                         </div>
                         <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                           <motion.div
                               className={cn("h-full rounded-full", prColors.bar)}
                               initial={{ width: 0 }}
                               animate={{ width: isUnavailable ? '0%' : `${prData.political_risk_score * 100}%` }}
                           />
                         </div>
                      </div>

                      <div className="space-y-4">
                         <p className="text-xs font-semibold text-slate-500">Top Risk Events</p>
                         <div className="space-y-3">
                            {prData.top_events?.length > 0 ? (
                              prData.top_events.map((evt: string, idx: number) => (
                                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-4">
                                   <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                                   <p className="text-sm text-slate-300 font-medium leading-relaxed">{evt}</p>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 rounded-xl border border-white/5 bg-black/20 text-center">
                                 <p className="text-sm font-semibold text-slate-500">No events detected</p>
                              </div>
                            )}
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="p-10 border border-dashed border-white/5 rounded-2xl text-center">
                      <p className="text-sm font-semibold text-slate-500">Risk data unavailable</p>
                   </div>
                 )}
              </div>
           </Card>

           {/* AI Agents */}
           <Card className="glass-card border-none bg-black/40 shadow-2xl rounded-[2.5rem] p-10 border border-white/5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">AI Agents</p>
              <div className="space-y-6">
                 {Object.entries(agentsData ?? {}).map(([key, agent]: [string, any]) => (
                    <div key={key} className="flex items-center gap-6 group">
                       <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-cyan-500/30 transition-all">
                          <Cpu className="h-5 w-5 text-slate-600 group-hover:text-cyan-400" />
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-sm font-bold text-white tracking-tight capitalize">{agent.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{agent.weight * 100}% weight</p>
                       </div>
                    </div>
                 ))}
                 {!agentsData && <div className="h-40 w-full animate-pulse bg-white/5 rounded-2xl" />}
              </div>
           </Card>
        </div>
      </div>

      {/* Price History */}
      {searchTicker && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
           <div className="flex items-center gap-6">
              <LineChartIcon className="h-6 w-6 text-cyan-500" />
              <p className="text-sm font-bold text-white">Price History ({searchTicker})</p>
              <div className="h-px flex-1 bg-white/5" />
           </div>

           <div className="glass-card border-none bg-black/40 shadow-2xl rounded-[3.5rem] p-10 relative overflow-hidden border border-white/5 group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent pointer-events-none" />
              {priceLoading ? (
                 <Skeleton className="h-[300px] w-full rounded-2xl bg-white/5" />
              ) : priceData.length > 0 ? (
                 <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={priceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            hide={false} 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            hide={false}
                            domain={['auto', 'auto']}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                            axisLine={false}
                            tickLine={false}
                            width={60}
                            tickFormatter={(val) => `$${val}`}
                          />
                          <Tooltip content={<PriceTooltip />} cursor={{ stroke: '#22d3ee20', strokeWidth: 2 }} />
                          <Line 
                            type="monotone" 
                            dataKey="close" 
                            stroke="#22d3ee" 
                            strokeWidth={3} 
                            dot={false}
                            activeDot={{ r: 6, fill: '#22d3ee', stroke: '#000', strokeWidth: 2 }}
                          />
                       </LineChart>
                    </ResponsiveContainer>
                 </div>
              ) : (
                 <div className="h-[300px] flex items-center justify-center border border-dashed border-white/5 rounded-2xl">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No history available</p>
                 </div>
              )}
           </div>
        </motion.div>
      )}

      {/* Top Recommendations */}
      {top5Rationale.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="space-y-8 pt-12">
           <div className="flex items-center gap-6">
              <Database className="h-6 w-6 text-indigo-400" />
              <p className="text-sm font-bold text-white">Top Recommendations</p>
              <div className="h-px flex-1 bg-white/5" />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {top5Rationale.map((item, idx) => (
                <RationaleNode key={item.ticker} item={item} index={idx} />
              ))}
           </div>
        </motion.div>
      )}

    </motion.div>
  );
}