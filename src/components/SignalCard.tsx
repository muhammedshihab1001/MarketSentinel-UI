import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Minus, ChevronRight } from 'lucide-react';
import { cn, formatPercent } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { SignalBadge, SignalType } from './SignalBadge';

export interface SignalCardProps {
  signal: {
    ticker: string;
    raw_model_score?: number;
    hybrid_consensus_score?: number;
    score?: number; // legacy prop
    hybrid_score?: number; // legacy prop
    weight: number;
    date?: string;
    drift_flag?: boolean;
    confidence_numeric?: number;
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export function SignalCard({ signal }: SignalCardProps) {
  const navigate = useNavigate();
  const { setSelectedTicker } = useAppStore();

  const isLong = signal.weight > 0.01;
  const isShort = signal.weight < -0.01;
  const signalText: SignalType = isLong ? 'LONG' : isShort ? 'SHORT' : 'NEUTRAL';

  // FIX (U2): Navigate to per-ticker detail page /signals/:ticker
  // Was navigating to /agent-explain (global page, loses ticker context)
  const handleNavigate = () => {
    setSelectedTicker(signal.ticker);
    navigate(`/signals/${signal.ticker}`);
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      onClick={handleNavigate}
      className="cursor-pointer group"
    >
      <Card className={cn(
        'glass-card border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden relative min-h-[160px] flex flex-col justify-between transition-all duration-300 shadow-md',
        signal.drift_flag && 'ring-1 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
      )}>
        {/* Atmospheric glow */}
        <div className={cn(
          'absolute -top-6 -right-6 w-24 h-24 blur-[40px] rounded-full opacity-20 transition-all duration-700 group-hover:opacity-40 group-hover:scale-125',
          isLong ? 'bg-cyan-500' : isShort ? 'bg-rose-500' : 'bg-slate-500'
        )} />

        {/* Watermark ticker */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none uppercase font-black italic text-4xl select-none leading-none tracking-tight group-hover:opacity-[0.07] transition-opacity">
          {signal.ticker}
        </div>

        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10 px-6 pt-6">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl font-black font-mono tracking-tight italic text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors uppercase leading-none">
              {signal.ticker}
            </CardTitle>
            <SignalBadge signal={signalText} />
          </div>
          <div
            className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm',
              isLong ? 'text-[var(--signal-long)]' :
              isShort ? 'text-[var(--signal-short)]' :
              'bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
            )}
            style={{
              backgroundColor: isLong
                ? 'color-mix(in srgb, var(--signal-long), transparent 80%)'
                : isShort
                ? 'color-mix(in srgb, var(--signal-short), transparent 80%)'
                : undefined,
            }}
          >
            {isLong ? (
              <TrendingUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
            ) : isShort ? (
              <TrendingDown className="h-5 w-5 group-hover:scale-110 transition-transform" />
            ) : (
              <Minus className="h-5 w-5" />
            )}
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 relative z-10 flex-1 flex flex-col justify-end">
          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 mt-4">
            <div className="space-y-1">
              <span className="text-[8px] text-[var(--text-muted)] uppercase font-bold tracking-widest flex items-center gap-1.5 leading-none">
                Strength
              </span>
              <p className="font-mono font-bold text-xl text-[var(--text-primary)] leading-none tracking-tight">
                {(signal.hybrid_consensus_score ?? signal.hybrid_score ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] text-[var(--text-muted)] uppercase font-bold tracking-widest flex items-center gap-1.5 leading-none">
                Target Weight
              </span>
              <p className="font-mono font-bold text-xl text-[var(--text-primary)] leading-none tracking-tight">
                {formatPercent(signal.weight)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {signal.drift_flag ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                  <AlertTriangle className="h-2.5 w-2.5 text-rose-500" />
                  <span className="text-[8px] font-bold uppercase text-rose-500 tracking-widest">DRift detected</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-3 py-1 border rounded-lg shadow-sm"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderColor: 'rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--status-healthy)] shadow-[0_0_8px_var(--status-healthy)]" />
                  <span className="text-[8px] font-bold uppercase text-[var(--status-healthy)] tracking-widest">STable</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-0.5 text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
              <span className="text-[8px] font-bold uppercase tracking-widest">Examine</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}