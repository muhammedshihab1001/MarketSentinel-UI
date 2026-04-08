import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, Timer, Mail, Github, 
  ShieldCheck, Zap, MessageCircle, 
  ChevronRight
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DemoProfile() {
  const { role, usage, resetInSeconds, username } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState(resetInSeconds ?? 0);

  useEffect(() => {
    setTimeLeft(resetInSeconds ?? 0);
  }, [resetInSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev: number) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (d > 0) return `${d}D ${h}H ${m}M ${s}S`;
    if (h > 0) return `${h}H ${m}M ${s}S`;
    return `${m}M ${s}S`;
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } } };

  if (role === 'owner') {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-12 p-6 pb-24 md:p-12 min-h-full">
        <motion.div variants={item}>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-none">
              Admin<span className="text-emerald-500"> Dashboard</span>
            </h1>
            <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Full Access &bull; All Features Available
            </p>
          </div>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
           <div className="p-10 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-xl flex flex-col justify-between h-56 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <User className="h-48 w-48" />
              </div>
              <p className="text-xs font-semibold text-slate-500 relative z-10">User Profile</p>
              <p className="text-5xl font-bold tracking-tight text-white relative z-10">{username}</p>
           </div>
           
           <div className="p-10 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-xl flex flex-col justify-between h-56 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <ShieldCheck className="h-48 w-48 text-emerald-500" />
              </div>
              <p className="text-xs font-semibold text-slate-500 relative z-10">Access Level</p>
              <div className="flex items-center gap-6 relative z-10">
                 <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                   <ShieldCheck className="h-8 w-8 text-emerald-400" />
                 </div>
                 <span className="text-3xl font-bold tracking-tight text-emerald-400">Unrestricted</span>
              </div>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-12 p-4 md:p-6 min-h-full pb-32 overflow-x-hidden relative">
      
      {/* ── Header ── */}
      <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-none">
            Market<span className="text-cyan-500"> Sentinel</span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  <p>
                    {username}
                  </p>
               </div>
               <div className="h-3 w-px bg-white/10" />
               <p>
                  Active
               </p>
            </div>
        </div>

        {timeLeft > 0 && (
          <div className="p-10 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-xl flex items-center gap-10 group hover:border-amber-500/30 transition-all duration-500 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent pointer-events-none" />
             <div className="h-20 w-20 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform relative z-10 shadow-lg">
                <Timer className="h-10 w-10 text-amber-500 animate-[spin_4s_linear_infinite]" />
             </div>
             <div className="space-y-2 relative z-10 text-left">
                <p className="text-xs font-semibold text-slate-500">Resets In</p>
                <p className="font-mono text-3xl font-bold text-amber-500 tracking-tight leading-none drop-shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  {formatTime(timeLeft)}
                </p>
             </div>
          </div>
        )}
      </motion.div>

      {/* ── Usage Details ── */}
      <div className="grid gap-12 lg:grid-cols-3 items-start">
        
        {/* Resource Usage */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-[3.5rem] overflow-hidden group border border-white/5">
            <CardHeader className="p-12 border-b border-white/5 relative bg-gradient-to-r from-cyan-500/[0.02] to-transparent">
              <CardTitle className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <Zap className="h-5 w-5 text-cyan-500 animate-pulse" />
                Feature Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-12 space-y-12">
              {usage?.features == null ? (
                <div className="space-y-10 py-10 opacity-20">
                  <Skeleton className="h-3 w-full bg-white/5 rounded-full" />
                  <Skeleton className="h-3 w-full bg-white/5 rounded-full" />
                  <Skeleton className="h-3 w-full bg-white/5 rounded-full" />
                </div>
              ) : (
                Object.entries(usage.features).map(([name, stats]: [string, any]) => {
                  const featureNames: Record<string, string> = {
                    agent: 'AI Analysis',
                    drift: 'Stability Monitor',
                    signals: 'Market Signals',
                    strategy: 'Performance Backtest',
                    snapshot: 'System Status',
                    universe: 'Market Universe'
                  };
                  const displayName = featureNames[name] || name.replace(/_/g, ' ');
                  
                  return (
                    <div key={name} className="space-y-6">
                      <div className="flex justify-between items-end px-4">
                        <div className="space-y-2">
                           <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{displayName}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-2xl font-bold text-white tracking-tight leading-none">{stats.used} / {stats.limit}</span>
                           <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Usage</p>
                        </div>
                      </div>
                      <div className="h-4 w-full bg-slate-950/50 rounded-full p-1 border border-white/5 overflow-hidden shadow-inner relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, (stats.used / stats.limit) * 100)}%` }}
                          className={cn(
                            "h-full rounded-full transition-all duration-1000", 
                            stats.locked ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]' : 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                          )}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-[3.5rem] overflow-hidden group border border-white/5 h-full">
            <CardHeader className="p-12 border-b border-white/5 relative bg-gradient-to-l from-indigo-500/[0.02] to-transparent">
              <CardTitle className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-400 group-hover:animate-pulse" />
                Contact & Links
              </CardTitle>
            </CardHeader>
            <CardContent className="p-12 space-y-12">
              <div className="space-y-5">
                {[
                  { label: 'LinkedIn', icon: Zap, link: 'https://linkedin.com/in/muhammedshihabp', color: 'text-blue-400' },
                  { label: 'WhatsApp', icon: MessageCircle, link: 'https://wa.me/919946282828', color: 'text-emerald-400' },
                  { label: 'GitHub', icon: Github, link: 'https://github.com/muhammedshihab1001', color: 'text-white' },
                ].map((btn, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full h-14 justify-start gap-4 px-6 bg-white/[0.02] hover:bg-cyan-500/5 border border-white/5 rounded-xl transition-all group overflow-hidden"
                    onClick={() => window.open(btn.link, '_blank')}
                  >
                    <btn.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", btn.color)} />
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-white transition-colors">{btn.label}</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-10 group-hover:opacity-40 transition-all" />
                  </Button>
                ))}
              </div>
              
              <div className="pt-8 border-t border-white/5 flex items-center gap-4">
                 <div className="h-12 w-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0">
                   <User className="h-6 w-6 text-indigo-400" />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Creator</p>
                    <p className="text-sm font-bold text-slate-300">Muhammed Shihab P</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}