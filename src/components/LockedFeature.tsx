import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Timer, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';

interface LockedFeatureProps {
  featureName: string;
  className?: string;
}

export default function LockedFeature({ featureName, className = "" }: LockedFeatureProps) {
  const { resetInSeconds } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState(resetInSeconds);

  useEffect(() => {
    setTimeLeft(resetInSeconds);
  }, [resetInSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <Card className={`relative overflow-hidden border-rose-500/20 bg-rose-500/5 backdrop-blur-3xl shadow-2xl rounded-[3rem] ${className} animate-in fade-in zoom-in-95 duration-700`}>
      {/* Decorative Lock Background */}
      <div className="absolute -right-12 -bottom-12 opacity-[0.03] rotate-12 scale-150">
        <Lock className="w-80 h-80 text-rose-500" />
      </div>

      <CardContent className="flex flex-col items-center justify-center text-center p-14 space-y-10">
        <div className="relative">
          <div className="p-8 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 animate-pulse">
            <ShieldAlert className="w-16 h-16 text-rose-500" />
          </div>
          <div className="absolute -top-3 -right-3 p-3 rounded-2xl bg-[var(--bg-base)] border border-rose-500 shadow-2xl shadow-rose-500/50">
            <Lock className="w-5 h-5 text-rose-500" />
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <h1 className="text-4xl font-black tracking-tighter text-rose-500 italic uppercase leading-none">
            {featureName.replace(/_/g, ' ')}_EXHAUSTED
          </h1>
          <p className="text-slate-500 text-sm max-w-sm mx-auto font-bold uppercase italic tracking-widest leading-relaxed">
            You have exhausted the 3-request evaluation limit for this institutional feature group.
          </p>
        </div>

        <div 
          className="flex items-center gap-10 relative z-10 p-8 border border-white/5 rounded-[2.5rem] shadow-inner"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bg-base), transparent 60%)' }}
        >
          <div className="text-left space-y-1">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.4em] italic leading-none">Restoration_In</p>
            <div className="flex items-center gap-3 text-3xl font-black font-mono italic text-amber-500 tracking-tighter leading-none">
              <Timer className="w-6 h-6" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="text-left space-y-1">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.4em] italic leading-none">Sync_Status</p>
            <span className="text-2xl font-black text-rose-500 italic leading-none tracking-tighter uppercase">Exhausted</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg relative z-10 pt-4">
          <Button variant="outline" className="h-20 flex-1 gap-4 border-white/10 bg-[var(--bg-base)] hover:bg-[var(--bg-surface)] rounded-[2rem] font-black uppercase tracking-widest italic" asChild>
            <Link to="/demo">
              DEEP_PROFILE_HUB
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <Button variant="default" className="h-20 flex-1 gap-4 bg-rose-500/20 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-xl rounded-[2rem] font-black uppercase tracking-widest italic">
            <ShieldAlert className="w-5 h-5" />
            REQUEST_LICENSE
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
