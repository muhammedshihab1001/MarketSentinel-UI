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
  const { updateUsage } = useAuthStore();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

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
  });

  // Handle DemoLockedError — show LockedFeature instead of fatal error panel
  if (isError && error instanceof DemoLockedError) {
    if (error.usage) updateUsage(error.usage);
    if (!lockedFeature) setLockedFeature(error.feature);
  }
  if (lockedFeature) return <LockedFeature featureName={lockedFeature} />;

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
          <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">Signal Pipeline Offline</h3>
          <p className="text-[var(--text-muted)] text-sm mt-2">Backend is unreachable. Retrying…</p>
        </div>
        <Button variant="destructive" onClick={() => refetch()}>RETRY</Button>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10 p-6">

      {/* HEADER */}
      <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-8 bg-[var(--accent-primary)] rounded-full shadow-[0_0_8px_var(--accent-primary)]" />
            <Badge variant="outline" className="border text-[var(--accent-primary)] uppercase font-bold tracking-widest text-[10px] py-1 px-3"
              style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary), transparent 95%)', borderColor: 'color-mix(in srgb, var(--accent-primary), transparent 80%)' }}>
              Live Data
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight italic uppercase text-[var(--text-primary)] leading-none">
            MARKET SIGNALS
          </h1>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search ticker..."
            className="pl-10 bg-[var(--bg-surface)] border-[var(--border-subtle)] h-10 rounded-xl font-mono uppercase text-sm"
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
              'flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all',
              signalFilter === value
                ? 'bg-[var(--bg-overlay)] border-[var(--border-active)] text-[var(--text-primary)] shadow-sm'
                : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-active)] hover:text-[var(--text-secondary)]'
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', signalFilter === value ? color : '')} />
            {label}
            <span className={cn(
              'ml-0.5 font-mono text-[10px]',
              signalFilter === value ? 'text-[var(--text-secondary)]' : 'text-slate-600'
            )}>
              {counts[value]}
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
          className="h-9 px-4 border-[var(--border-subtle)] rounded-xl font-bold uppercase tracking-wider text-[10px] gap-2"
          onClick={() => { refetch(); toast.info('Syncing signals...'); }}
          disabled={isFetching}
        >
          <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin text-[var(--accent-primary)]')} />
          Sync
        </Button>
      </motion.div>

      {/* Metadata bar */}
      <motion.div variants={item} className="flex items-center gap-4 p-4 rounded-xl glass-card border-[var(--border-subtle)]">
        <Zap className="h-5 w-5 text-[var(--accent-primary)]" />
        <div className="flex flex-wrap items-center gap-4 text-[10px]">
          {snapshotResponse?.snapshot?.snapshot_date && (
            <Badge variant="outline" className="gap-1.5 py-1 px-2 font-bold uppercase tracking-wider rounded-full text-[var(--text-muted)] border-[var(--border-subtle)]">
              <Clock className="w-3 h-3" />
              {format(new Date(snapshotResponse.snapshot.snapshot_date), 'HH:mm:ss')}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1.5 py-1 px-2 font-bold uppercase tracking-wider rounded-full text-[var(--accent-primary)]"
            style={{ borderColor: 'color-mix(in srgb, var(--accent-primary), transparent 70%)', backgroundColor: 'color-mix(in srgb, var(--accent-primary), transparent 95%)' }}>
            <ShieldCheck className="w-3 h-3" />
            {filteredSignals.length} / {signals.length} nodes
          </Badge>
          {signalFilter !== 'ALL' && (
            <button onClick={() => setSignalFilter('ALL')} className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] font-bold uppercase tracking-wider transition-colors">
              ✕ Clear filter
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
                <p className="text-xl font-black uppercase italic text-slate-600">No Signals Found</p>
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