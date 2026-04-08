import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeuralScannerProps {
  className?: string;
}

export default function NeuralScanner({ className }: NeuralScannerProps) {
  return (
    <div className={cn("flex items-center gap-4 bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)] p-3 rounded-2xl backdrop-blur-md relative overflow-hidden group", className)}>
      {/* Scanning laser effect */}
      <motion.div
        className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-20 blur-md pointer-events-none"
        animate={{ left: ['-20%', '120%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Radar rings */}
      <div className="relative w-10 h-10 flex flex-shrink-0 items-center justify-center bg-[#020617] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        <motion.div
          className="absolute inset-0 rounded-full border border-[var(--accent-primary)]/40"
          animate={{ scale: [0.8, 2], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-[var(--accent-primary)]/20"
          animate={{ scale: [0.8, 2], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
        />
        <Activity className="w-5 h-5 text-[var(--accent-primary)] relative z-10" />
      </div>

      <div className="flex flex-col pr-4">
        <span className="text-xs font-semibold text-slate-400 leading-none mb-1">
          System Status
        </span>
        <span className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
          Connected
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,217,129,0.8)] animate-pulse" />
        </span>
      </div>
    </div>
  );
}
