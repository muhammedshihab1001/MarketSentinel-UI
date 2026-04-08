import { RefreshCcw, ShieldAlert, Cpu, Terminal, ChevronRight, Activity, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ModelOffline() {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#050508] overflow-hidden relative selection:bg-rose-500/30 selection:text-white text-white">
      {/* ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-rose-500/10 blur-[150px] rounded-full animate-pulse opacity-40 transition-all duration-1000" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-500/5 blur-[150px] rounded-full animate-pulse delay-700 opacity-40 transition-all duration-1000" />
        <div className="absolute inset-0 bg-grid-white opacity-[0.02] mask-linear-b" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#050508] to-transparent z-10" />
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-2xl space-y-16 relative z-10"
      >
        {/* BRANDING */}
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ y: -20, rotate: -15, scale: 0.8 }}
            animate={{ y: 0, rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="inline-flex items-center justify-center p-6 md:p-8 rounded-2xl md:rounded-3xl glass-card border-none mb-4 shadow-2xl relative group"
          >
            <div className="absolute inset-0 bg-rose-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShieldAlert className="w-12 h-12 md:w-16 md:h-16 text-rose-500 group-hover:scale-110 transition-transform duration-700 relative z-10" />
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase leading-none">
              Connection Lost
            </h1>
            <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">System connection unavailable</p>
          </div>
        </div>

        {/* DIAGNOSTIC CARD */}
        <div className="grid gap-12">
          <Card className="glass-card border-none shadow-[0_40px_80px_rgba(244,63,94,0.15)] relative overflow-hidden group rounded-2xl md:rounded-3xl p-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full group-hover:bg-rose-500/20 transition-all duration-1000" />
            
            <CardHeader className="space-y-6 p-12 px-14 border-b border-white/5">
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="px-4 py-1 rounded-full font-bold tracking-widest text-[9px] uppercase shadow-2xl">OFFLINE</Badge>
                <div className="flex gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,1)] animate-pulse" />
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                </div>
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-4 pt-2">
                <Terminal className="w-6 h-6 text-rose-500 shrink-0 transition-transform group-hover:scale-110 duration-700" />
                Connection Error
              </CardTitle>
              <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                The connection has been interrupted. Please check your network and try again.
              </p>
            </CardHeader>

            <CardContent className="p-8 md:p-10 space-y-8 md:space-y-10">
              <div className="bg-slate-950/80 p-6 md:p-8 rounded-xl md:rounded-2xl border border-[var(--border-subtle)] font-mono text-sm tracking-tight text-slate-400 break-all leading-relaxed shadow-inner group-hover:border-rose-500/20 transition-all duration-700 italic relative overflow-hidden">
                <div className="absolute top-0 left-0 p-4 opacity-[0.03]">
                   <Activity className="w-24 h-24 rotate-12" />
                </div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                   <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                   <span className="text-[10px] text-rose-500 font-black tracking-widest uppercase">ERROR: 503 SERVICE UNAVAILABLE</span>
                </div>
                <code className="relative z-10 leading-loose">
                  Everything is offline. <br/>
                  Please try again in a few minutes. <br/>
                </code>
              </div>

              <div className="grid grid-cols-2 gap-8">
                  <div 
                    className="p-6 rounded-xl border border-[var(--border-subtle)] transition-all duration-700 flex items-center gap-4 group/item"
                    style={{ 
                      backgroundColor: 'color-mix(in srgb, var(--bg-base), transparent 40%)',
                      borderColor: 'color-mix(in srgb, var(--border-subtle), transparent 20%)' 
                    }}
                  >
                    <div className="p-4 rounded-xl bg-rose-500/10 text-rose-500 shadow-2xl group-hover/item:scale-110 transition-transform duration-500">
                      <Zap className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Status</p>
                      <p className="text-xl font-bold text-rose-400 tracking-tight leading-none uppercase">Standby</p>
                    </div>
                 </div>
                 <div 
                   className="p-6 rounded-xl border border-[var(--border-subtle)] transition-all duration-700 flex items-center gap-4 group/item"
                   style={{ 
                     backgroundColor: 'color-mix(in srgb, var(--bg-base), transparent 40%)',
                     borderColor: 'color-mix(in srgb, var(--border-subtle), transparent 20%)' 
                   }}
                 >
                    <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400 shadow-2xl group-hover/item:scale-110 transition-transform duration-500">
                      <Cpu className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connection</p>
                      <p className="text-xl font-bold text-rose-400 tracking-tight leading-none uppercase">Offline</p>
                    </div>
                 </div>
              </div>
            </CardContent>

            <CardFooter className="p-14 pt-0">
              <Button 
                onClick={() => {
                  toast.info('Restoring connection...');
                  navigate('/');
                }} 
                className="w-full h-14 bg-white text-black hover:bg-rose-500 hover:text-white transition-all font-bold uppercase tracking-widest rounded-xl shadow-2xl flex items-center justify-center gap-6 group active:scale-[0.98] text-sm"
              >
                <RefreshCcw className="h-8 w-8 group-hover:rotate-180 transition-transform duration-1000" />
                TRY AGAIN
                <ChevronRight className="w-8 h-8 group-hover:translate-x-3 transition-transform duration-700" />
              </Button>
            </CardFooter>
          </Card>

          {/* FOOTER BADGES */}
          <div className="pt-12 flex items-center justify-center gap-16 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
             <div className="flex items-center gap-4 font-bold text-[10px] tracking-widest uppercase text-slate-400">
                <Zap className="w-4 h-4 text-amber-500" /> System Engine v1.0
             </div>
             <div className="h-8 w-[1px] bg-white/10" />
             <div className="flex items-center gap-4 font-bold text-[10px] tracking-widest uppercase text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Protocol
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
