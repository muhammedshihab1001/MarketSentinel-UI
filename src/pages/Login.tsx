import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Fingerprint, 
  RefreshCw,
  Terminal,
  Radio,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: (payload: any) => authApi.loginOwner(payload),
    onSuccess: async () => {
      try {
        const response = await authApi.me();
        const { role, username, usage } = response.data;
        setAuth(role || null, username || null, usage || {
          features: {},
          fully_locked: false,
          reset_in_seconds: 0,
          limit_per_feature: 100
        });
        toast.success('Signed in successfully.');
        navigate('/dashboard');
      } catch (err) {
        toast.error('Session error. Please try again.');
      }
    },
    onError: () => {
      toast.error('Sign in failed', {
        description: 'Invalid username or password.'
      });
    }
  });

  const demoMutation = useMutation({
    mutationFn: authApi.loginDemo,
    onSuccess: async () => {
      try {
        const response = await authApi.me();
        const { role, username, usage } = response.data;
        setAuth(role || 'demo', username || 'DEMO_USER', usage || {
          features: {},
          fully_locked: false,
          reset_in_seconds: 0,
          limit_per_feature: 100
        });
        toast.info('Demo session started. Read-only access enabled.');
        navigate('/dashboard');
      } catch (err) {
        toast.error('Demo sign in failed. Please try again.');
      }
    },
    onError: (error: any) => {
      toast.error('Network error', {
        description: error.message
      });
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-6 bg-[#020617] overflow-hidden relative selection:bg-cyan-500/30 selection:text-white text-white font-sans">
      {/* ── Background: Rigid Industrial Grid ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] md:bg-[size:60px_60px] opacity-10" />
        
        {/* Subtle breathing glow (Static improvement over moving scanline) */}
        <motion.div 
           animate={{ opacity: [0.02, 0.05, 0.02] }}
           transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
           className="absolute inset-0 bg-cyan-500/10"
        />

      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg space-y-12 relative z-10"
      >
        {/* ── Branding Section ── */}
        <div className="text-center space-y-8">
          <div className="inline-flex flex-col items-center gap-6">
            <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-2xl relative group overflow-hidden backdrop-blur-3xl">
              <div className="absolute inset-0 bg-cyan-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <ShieldCheck className="w-16 h-16 text-cyan-500 relative z-10" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_40px_rgba(34,211,238,0.2)]">
              MARKET<span className="text-cyan-500">SENTINEL</span>
            </h1>
            <div className="flex items-center justify-center gap-6">
               <span className="h-px w-10 bg-white/10" />
               <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Institutional Access</p>
               <span className="h-px w-10 bg-white/10" />
            </div>
          </div>
        </div>

        {/* ── Authentication Control Card ── */}
        <Card className="border-none bg-black/40 shadow-[0_40px_100px_rgba(0,0,0,0.6)] rounded-[2rem] md:rounded-[3rem] overflow-hidden backdrop-blur-3xl border border-white/5 relative group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
          
          <CardContent className="p-8 md:p-12 space-y-10">
            <form onSubmit={handleLogin} className="space-y-8">
              {/* Terminal Identity Label */}
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">Admin</span>
                 </div>
              </div>

              {/* Secure Inputs */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-6">Username</Label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-slate-700 group-focus-within/input:text-cyan-500 transition-colors">
                      <UserCircleIcon className="h-5 w-5" />
                    </div>
                    <Input
                      placeholder="Username"
                      className="h-16 pl-16 pr-8 bg-white/5 border-white/5 rounded-2xl text-lg font-bold tracking-tight text-white placeholder:text-white/20 focus:bg-white/[0.08] focus:border-cyan-500/50 transition-all focus:ring-0"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-6">Password</Label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-slate-700 group-focus-within/input:text-cyan-500 transition-colors">
                      <Fingerprint className="h-5 w-5" />
                    </div>
                    <Input
                      type="password"
                      placeholder="Password"
                      className="h-16 pl-16 pr-8 bg-white/5 border-white/5 rounded-2xl text-lg font-bold tracking-tight text-white placeholder:text-white/20 focus:bg-white/[0.08] focus:border-cyan-500/50 transition-all focus:ring-0"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Execution Button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending || demoMutation.isPending}
                className="w-full h-16 bg-white text-black hover:bg-cyan-500 hover:text-white rounded-[1.5rem] font-bold uppercase tracking-widest text-xs shadow-[0_25px_50px_rgba(0,0,0,0.5)] flex items-center justify-center gap-6 group transition-all"
              >
                {loginMutation.isPending ? (
                  <RefreshCw className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-3 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center gap-8 py-2">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">or</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            {/* Demo Entrance: Static & Solid */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => demoMutation.mutate()}
              disabled={loginMutation.isPending || demoMutation.isPending}
              className="w-full h-24 p-8 rounded-[2rem] bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/30 transition-all group relative overflow-hidden flex items-center justify-between"
            >
              <div className="flex items-center gap-8">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="text-left space-y-1">
                <p className="text-xl font-bold tracking-tight text-white uppercase">Demo Login</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Radio className="h-3 w-3" /> READ ONLY · FOR DEMONSTRATION
                  </p>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-cyan-500 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </CardContent>
        </Card>

        {/* ── Footer Stats ── */}
        <div className="flex items-center justify-center gap-10 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
           <div className="flex items-center gap-3">
              <Cpu className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Encrypted</span>
           </div>
           <div className="h-4 w-[1px] bg-white/10" />
           <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-cyan-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Institutional</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
