import { cn } from '@/lib/utils';

export type SignalType = 'LONG' | 'SHORT' | 'NEUTRAL' | null;

interface SignalBadgeProps {
  signal: SignalType;
  className?: string;
}

export const SignalBadge = ({ signal, className }: SignalBadgeProps) => {
  if (!signal) return <span className={cn("font-mono text-[var(--text-muted)] text-xs", className)}>—</span>;
  
  const config = {
    LONG:    { bg: 'color-mix(in srgb, var(--signal-long), transparent 90%)',    text: 'text-[var(--signal-long)]',    dot: 'bg-[var(--signal-long)]' },
    SHORT:   { bg: 'color-mix(in srgb, var(--signal-short), transparent 90%)',   text: 'text-[var(--signal-short)]',   dot: 'bg-[var(--signal-short)]' },
    NEUTRAL: { bg: 'color-mix(in srgb, var(--signal-neutral), transparent 90%)', text: 'text-[var(--signal-neutral)]', dot: 'bg-[var(--signal-neutral)]' },
  }[signal];

  return (
    <span 
      className={cn(
        `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all duration-300`,
        config.text,
        className
      )}
      style={{ backgroundColor: config.bg }}
    >
      <span className={cn(`w-1.5 h-1.5 rounded-full animate-pulse`, config.dot)} />
      {signal === 'LONG' ? 'POSITION_LONG' : signal === 'SHORT' ? 'POSITION_SHORT' : 'BIAS_NEUTRAL'}
    </span>
  );
};
