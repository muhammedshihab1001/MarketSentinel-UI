import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { User, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

// ── Live countdown timer ─────────────────────────────────────
function ResetCountdown({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const display = h > 0
    ? `${h}h ${m.toString().padStart(2, '0')}m`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] whitespace-nowrap hidden lg:flex">
      <Clock className="w-3 h-3" />
      resets in <span className="font-bold text-[var(--accent-primary)]">{display}</span>
    </span>
  );
}

export default function DemoBanner() {
  const { role, usage, fullyLocked, resetInSeconds } = useAuthStore();
  const location = useLocation();

  if (role !== 'demo' || !usage) return null;

  const path = location.pathname;
  let currentFeature = 'snapshot';
  if (path.startsWith('/dashboard'))   currentFeature = 'snapshot';
  else if (path.startsWith('/signals'))     currentFeature = 'snapshot';
  else if (path.startsWith('/portfolio'))   currentFeature = 'portfolio';
  else if (path.startsWith('/drift'))       currentFeature = 'drift';
  else if (path.startsWith('/performance')) currentFeature = 'performance';
  else if (path.startsWith('/agent'))       currentFeature = 'agent';
  else if (path.startsWith('/model'))       currentFeature = 'signals';

  // Always read limit from usage.limit_per_feature — never hardcode
  const defaultLimit = usage?.limit_per_feature ?? 10;
  const featureUsage = usage?.features?.[currentFeature] || {
    used: 0,
    limit: defaultLimit,
    remaining: defaultLimit,
    locked: false,
  };
  const remaining = featureUsage.remaining;
  const limit     = featureUsage.limit;
  const locked    = remaining === 0 || fullyLocked;

  // usedPercent fills UP as requests are consumed (correct direction)
  const usedPercent = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;

  return (
    <div className={`sticky top-0 z-[100] w-full border-b backdrop-blur-md transition-all duration-500 ${locked ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-400/5 border-emerald-400/10'}`}>
      <div className="container mx-auto px-4 h-11 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <Badge variant="outline" className={`hidden sm:flex shrink-0 font-mono text-[10px] uppercase tracking-tighter ${locked ? 'border-rose-500 text-rose-500' : 'border-emerald-400 text-emerald-400'}`}>
            Demo Mode Active
          </Badge>

          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap hidden md:inline py-1">
              <span className={`font-bold ${locked ? 'text-rose-500' : 'text-emerald-400'}`}>{remaining} / {limit}</span> requests remaining
            </span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
              <div
                className={`h-full transition-all duration-1000 ${locked ? 'bg-rose-500' : 'bg-emerald-400'}`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>

          {/* Live countdown to quota reset */}
          {resetInSeconds > 0 && (
            <ResetCountdown seconds={resetInSeconds} />
          )}
        </div>

        <div className="flex items-center gap-4">
          {locked ? (
            <div className="flex items-center gap-1.5 text-rose-500 animate-in slide-in-from-right-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-tight">Access Locked</span>
            </div>
          ) : null}

          <Link
            to="/demo"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 hover:border-slate-500 transition-colors group"
          >
            <User className="w-3 h-3 text-slate-400 group-hover:text-white" />
            <span className="text-xs font-semibold text-slate-300 group-hover:text-white">Profile</span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
