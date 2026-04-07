import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Timer, Lock, Info, Mail, Github, ExternalLink, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DemoProfile() {
  const { role, usage, resetInSeconds, username } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState(resetInSeconds ?? 0);

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;
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

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } } };

  if (role === 'owner') {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-6">
        <motion.div variants={item}>
          <Card className="glass-card border-none rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <CardHeader className="p-8 space-y-6">
              <Badge className="w-fit px-6 py-2 rounded-full font-black text-[9px] tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20">ADMINISTRATOR</Badge>
              <CardTitle className="flex items-center gap-4 text-3xl font-black uppercase tracking-widest italic text-[var(--text-primary)]">
                <div className="h-14 w-14 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-7 w-7 text-emerald-400" />
                </div>
                ADMIN SETTINGS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-white/5 h-36 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.4em] italic">Identity_Vector</span>
                  <span className="text-2xl font-black italic tracking-tighter text-white uppercase">{username}</span>
                </div>
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-white/5 h-36 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.4em] italic">Parity_Level</span>
                  <Badge className="w-fit px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Full_Infrastructure</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-6 pb-20">

      {/* HEADER */}
      <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
        <div className="flex items-center gap-8">
          <div className="h-16 w-16 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center shadow-2xl shrink-0">
            <User className="h-8 w-8 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter italic uppercase text-[var(--text-primary)] leading-none">
              DEMO_<span className="text-[var(--accent-primary)]">ACCOUNT</span>
            </h1>
            <Badge className="mt-2 px-4 py-1 text-[10px] font-black italic tracking-[0.3em] rounded-full uppercase bg-primary/5 border border-primary/20 text-primary">Read-Only Mode</Badge>
          </div>
        </div>

        {/* FIX (F20): Only show timer when timeLeft > 0, not when usage is null */}
        {timeLeft > 0 && (
          <div className="flex items-center gap-4 p-6 border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)]/60 min-w-[240px]">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Timer className="h-6 w-6 text-amber-500 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em] italic">Time Remaining</p>
              <p className="text-2xl font-black font-mono italic text-amber-500 tracking-tighter">{formatTime(timeLeft)}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* MAIN GRID */}
      <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">

        {/* USAGE STATS */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card border-none rounded-3xl shadow-2xl h-full">
            <CardHeader className="p-8 border-b border-[var(--border-subtle)]">
              <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3 italic">
                <Zap className="h-7 w-7 text-[var(--accent-primary)]" /> FEATURE_USAGE
              </CardTitle>
              <CardDescription className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase italic">3 demo requests per feature group.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* FIX (F20): Show loading placeholder when usage is null — was "Waiting_For_Telemetry_Stream" forever */}
              {usage?.features == null ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-3">
                      <div className="h-4 w-32 bg-white/[0.04] rounded animate-pulse" />
                      <div className="h-4 w-full bg-white/[0.04] rounded animate-pulse" />
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] italic text-center">Loading usage data...</p>
                </div>
              ) : (
                Object.entries(usage.features).map(([name, stats]) => (
                  <div key={name} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-slate-500 tracking-[0.4em] uppercase italic">{name.replace(/_/g, ' ')}</span>
                      <span className="text-xl font-black italic text-white">{stats.used} / {stats.limit}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.used / stats.limit) * 100}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={cn("h-full rounded-full", stats.locked ? 'bg-rose-500' : 'bg-gradient-to-r from-primary/50 to-primary')}
                      />
                    </div>
                    {stats.locked && (
                      <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.3em] flex items-center gap-2 italic">
                        <Lock className="w-3 h-3" /> Exhausted
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ABOUT */}
        <motion.div variants={item}>
          <Card className="glass-card border-none rounded-3xl shadow-2xl h-full flex flex-col">
            <CardHeader className="p-8 border-b border-[var(--border-subtle)]">
              <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3 italic">
                <Info className="h-6 w-6 text-indigo-400" /> SYNOPSIS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <p className="text-lg font-medium leading-relaxed text-[var(--text-muted)] italic">
                  MarketSentinel is an <span className="text-[var(--text-primary)] font-black not-italic">institutional-grade</span> ML pipeline for cross-sectional alpha capture.
                </p>
              </div>
              <div className="space-y-4 border-t border-white/5 pt-8 mt-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 italic">Contact</h4>
                {[
                  // FIX (F18): Replaced placeholder email with real contact links
                  { label: 'Muhammed Shihab P', icon: User, link: 'https://shihab.dev' },
                  { label: 'shihab.dev', icon: ExternalLink, link: 'https://shihab.dev' },
                  { label: 'github.com/muhammedshihab1001', icon: Github, link: 'https://github.com/muhammedshihab1001' },
                  { label: 'linkedin.com/in/muhammedshihabp', icon: Mail, link: 'https://linkedin.com/in/muhammedshihabp' },
                ].map((btn, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full h-12 justify-start gap-4 px-4 hover:bg-[var(--bg-surface)] border border-white/5 rounded-xl"
                    onClick={() => window.open(btn.link, '_blank')}
                  >
                    <btn.icon className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] italic">{btn.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* FULL LOCK ALERT */}
      <AnimatePresence>
        {usage?.fully_locked && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Card className="glass-card border-none rounded-3xl bg-rose-500/5">
              <CardContent className="p-12 text-center space-y-8">
                <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
                  <Lock className="h-10 w-10 text-rose-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-rose-500 italic tracking-tighter uppercase">Evaluation_Limit_Reached</h3>
                  <p className="text-slate-500 mt-3 max-w-xl mx-auto font-medium italic leading-relaxed">
                    All feature groups have been exhausted. Access restores when the timer expires.
                  </p>
                </div>
                {/* FIX (F18): Real LinkedIn contact link instead of placeholder email */}
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 rounded-xl border-rose-500/30 text-rose-500 font-black uppercase tracking-widest gap-3 hover:bg-rose-500 hover:text-white transition-all"
                  onClick={() => window.open('https://linkedin.com/in/muhammedshihabp', '_blank')}
                >
                  <Sparkles className="h-5 w-5" />
                  Request Full Institutional Access
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}