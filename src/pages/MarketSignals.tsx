import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { predictionApi, DemoLockedError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import LockedFeature from '@/components/LockedFeature';
import { SignalCard } from '@/components/SignalCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, AlertCircle, Clock, ShieldCheck,
  RefreshCw, Zap, LayoutGrid, List,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { format } from 'date-fns';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// FIX (U3): Signal direction filter type
type SignalFilter = 'ALL' | 'LONG' | 'SHORT' | 'NEUTRAL';

const FILTER_OPTIONS: { label: string; value: SignalFilter; icon: React.ElementType; color: string }[] = [
  { label: 'All',     value: 'ALL',     icon: Zap,          color: 'text-[var(--accent-primary)]' },
  { label: 'Long',    value: 'LONG',    icon: TrendingUp,   color: 'text-[var(--signal-long)]' },
  { label: 'Short',   value: 'SHORT',   icon: TrendingDown, color: 'text-[var(--signal-short)]' },
  { label: 'Neutral', value: 'NEUTRAL', icon: Minus,        color: 'text-[var(--signal-neutral)]' },
];

export default function MarketSignals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // FIX (U3): direction filter state
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('ALL');
  const { updateUsage, isFeatureLocked } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<{ name: string; reset: number } | null>(null);
  const isLocked = isFeatureLocked('snapshot');

  const { data: snapshotResponse, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [QUERY_KEYS.SNAPSHOT],
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
    enabled: !isLocked,
  });



  const d = snapshotResponse as any;
  const isComputing = d?.served_from_cache === false || d?.metadata?.served_from_cache === false || (snapshotResponse && (!d?.snapshot?.signals || d.snapshot.signals.length === 0));

  const signals = useMemo(() => {
    const data = snapshotResponse?.snapshot ?? (snapshotResponse as any)?.data ?? {};
    const signalsList = data.signals ?? [];
    const driftData = data.drift ?? { drift_detected: false, drift_state: 'none' };

    return signalsList.map((s: any) => ({
      ticker: s.ticker,
      score: s.raw_model_score ?? s.score ?? 0,
      hybrid_score: s.hybrid_consensus_score ?? s.hybrid_score ?? 0,
      weight: s.weight ?? 0,
      date: s.date,
      drift_flag: driftData.drift_detected && s.weight !== 0,
    }));
  }, [snapshotResponse]);

  // FIX (U3): Filter by direction derived from weight, then by search term
  const filteredSignals = useMemo(() => {
    return signals.filter((s: any) => {
      // Direction filter
      if (signalFilter === 'LONG'    && s.weight <= 0.01)  return false;
      if (signalFilter === 'SHORT'   && s.weight >= -0.01) return false;
      if (signalFilter === 'NEUTRAL' && (s.weight > 0.01 || s.weight < -0.01)) return false;
      // Search filter
      return s.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [signals, signalFilter, searchTerm]);

  // Counts for filter badges
  const counts = useMemo(() => ({
    ALL:     signals.length,
    LONG:    signals.filter((s: any) => s.weight > 0.01).length,
    SHORT:   signals.filter((s: any) => s.weight < -0.01).length,
    NEUTRAL: signals.filter((s: any) => s.weight >= -0.01 && s.weight <= 0.01).length,
  }), [signals]);

  // Handle DemoLockedError — show LockedFeature instead of fatal error panel
  if (isError && error instanceof DemoLockedError) {
    if (error.usage) updateUsage(error.usage);
    if (!lockedFeature) setLockedFeature({ name: error.feature, reset: error.resetInSeconds });
  }
  if (lockedFeature) return <LockedFeature featureName={lockedFeature.name} resetInSeconds={lockedFeature.reset} />;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-[40vh] flex-col items-center justify-center p-8 border rounded-2xl glass-card text-center space-y-6"
        style={{
          borderColor: 'color-mix(in srgb, var(--status-critical), transparent 80%)',
          backgroundColor: 'color-mix(in srgb, var(--status-critical), transparent 95%)',
        }}
      >
        <AlertCircle className="h-12 w-12 text-[var(--status-critical)]" />
        <div>
          <h3 className="text-xl font-bold text-white">Signals Unavailable</h3>
          <p className="text-slate-400 text-sm mt-1">Cannot reach data source. Retrying...</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => refetch()}>RETRY</Button>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-12 p-4 md:p-6 min-h-full pb-32">

      {/* HEADER */}
      <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-8 bg-[var(--accent-primary)] rounded-full shadow-[0_0_8px_var(--accent-primary)]" />
            <Badge variant="outline" className="border text-[var(--accent-primary)] uppercase font-bold tracking-widest text-[10px] py-1 px-3"
              style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary), transparent 95%)', borderColor: 'color-mix(in srgb, var(--accent-primary), transparent 80%)' }}>
              Live Stats
            </Badge>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Market Signals
            </h1>
            <p className="text-sm text-slate-400">
              Current trend predictions for monitored tickers
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search all signals..."
            className="pl-10 bg-black/20 border-[var(--border-subtle)] h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest placeholder:text-[9px] placeholder:tracking-widest shadow-inner focus-visible:ring-cyan-500/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
          />
        </div>
      </motion.div>

      {/* FIX (U3): Signal direction filter buttons */}
      <motion.div variants={item} className="flex items-center gap-3 flex-wrap">
        {FILTER_OPTIONS.map(({ label, value, icon: Icon, color }) => (
          <button
            key={value}
            onClick={() => setSignalFilter(value)}
            className={cn(
              'flex items-center gap-3 px-5 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all',
              signalFilter === value
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                : 'bg-transparent border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', signalFilter === value ? color : 'text-slate-600')} />
            {label}
            <span className={cn(
              'ml-1 font-mono text-[10px]',
              signalFilter === value ? 'text-cyan-400' : 'text-slate-700'
            )}>
              [{counts[value]}]
            </span>
          </button>
        ))}

        {/* View mode toggle */}
        <div className="ml-auto flex items-center gap-1 p-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-7 w-7 p-0 rounded-lg">
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-7 w-7 p-0 rounded-lg">
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button variant="outline" size="sm"
          className="h-10 px-6 border-none bg-black/40 hover:bg-black/60 rounded-xl font-semibold gap-3 backdrop-blur-xl transition-all group text-slate-300"
          onClick={() => { refetch(); toast.info('Syncing signals...'); }}
          disabled={isFetching}
        >
          <RefreshCw className={cn('h-3.5 w-3.5 transition-transform group-hover:rotate-180 duration-700', isFetching && 'animate-spin text-cyan-400')} />
          Sync Data
        </Button>
      </motion.div>

      {/* Metadata bar */}
      <motion.div variants={item} className="flex items-center gap-6 p-5 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md">
        <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
          <Zap className="h-5 w-5 text-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          {snapshotResponse?.snapshot?.snapshot_date && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Last Synced:</span>
              <Badge variant="outline" className="gap-2 py-1.5 px-4 font-mono font-bold tracking-tight rounded-lg text-cyan-400 border-cyan-500/20 bg-cyan-500/5">
                <Clock className="w-3 h-3" />
                {format(new Date(snapshotResponse.snapshot.snapshot_date), 'HH:mm:ss')}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Signals Visible:</span>
              <Badge variant="outline" className="gap-2 py-1.5 px-4 font-mono font-bold tracking-tight rounded-lg text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                <ShieldCheck className="w-3 h-3" />
                {filteredSignals.length} / {signals.length}
              </Badge>
          </div>
          {signalFilter !== 'ALL' && (
            <button onClick={() => setSignalFilter('ALL')} className="text-xs font-semibold text-cyan-500 hover:text-cyan-400 transition-colors ml-4">
              Clear Filters
            </button>
          )}
        </div>
      </motion.div>

      {/* Signals grid */}
      <AnimatePresence mode="popLayout">
        <motion.div layout className={cn(
          'grid gap-5 pb-20',
          viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
        )}>
          {isLoading
            ? Array(9).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl bg-[var(--bg-surface)]" />
              ))
            : isComputing
            ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full flex flex-col items-center justify-center p-20 glass-card rounded-2xl border-[var(--border-subtle)] text-center">
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
            )
            : filteredSignals.length > 0
            ? filteredSignals.map((signal: any) => (
                <SignalCard key={signal.ticker} signal={signal} />
              ))
            : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-20 text-center gap-4"
              >
                <Search className="w-10 h-10 text-slate-700" />
                <p className="text-xl font-bold text-slate-600">No signals found</p>
                <p className="text-slate-700 text-sm">
                  {signalFilter !== 'ALL'
                    ? `No ${signalFilter} signals in current snapshot.`
                    : `No signals matching "${searchTerm}".`}
                </p>
                <Button variant="link" onClick={() => { setSearchTerm(''); setSignalFilter('ALL'); }}
                  className="text-[var(--accent-primary)] font-bold uppercase tracking-widest text-xs">
                  Clear All Filters
                </Button>
              </motion.div>
            )
          }
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}