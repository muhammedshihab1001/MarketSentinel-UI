import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Activity, ShieldCheck, UserCircle, ArrowRight, Sparkles, Lock, Cpu, Zap, ChevronRight, Fingerprint, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Owner Login Mutation
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
        toast.success('Login successful. Welcome, Administrator.');
        navigate('/dashboard');
      } catch (err) {
        toast.error('Session initialization failed.');
      }
    },
    onError: () => {
      toast.error('Login failed', {
        description: 'Invalid username or password.'
      });
    }
  });

  // Demo Login Mutation
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
        toast.info('Demo mode activated. Entering read-only view.');
        navigate('/dashboard');
      } catch (err) {
        toast.error('Demo session failed to start.');
      }
    },
    onError: (error: any) => {
      toast.error('Demo server unreachable', {
        description: error.message
      });
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.warning('Username and password are required.');
      return;
    }
    loginMutation.mutate({ username, password });
  };

  const container = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8 bg-[var(--bg-base)] overflow-hidden relative selection:bg-primary/30 selection:text-white text-white">
      {/* ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-pulse opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse delay-700 opacity-40" />
        <div className="absolute inset-0 bg-grid-white opacity-[0.03] mask-linear-b" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[var(--bg-base)] to-transparent z-10" />
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
            className="inline-flex items-center justify-center p-6 rounded-2xl glass-card border-none mb-4 shadow-2xl relative group"
          >
            <div className="absolute inset-0 bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Activity className="w-16 h-16 text-primary group-hover:scale-110 transition-transform duration-700 relative z-10" />
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)] md:text-4xl uppercase italic leading-none drop-shadow-2xl">
              MARKET<span className="text-[var(--accent-primary)] italic">SENTINEL</span>
            </h1>
            <p className="text-slate-500 text-[11px] font-black tracking-[0.6em] uppercase italic">Intelligent Trading Dashboard</p>
          </div>
        </div>

        {/* LOGIN FORM */}
        <div className="grid gap-12">
          <Card className="glass-card border-none shadow-2xl relative overflow-hidden group rounded-2xl md:rounded-3xl p-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-1000" />
            
            <CardHeader className="space-y-4 p-8 px-10 border-b border-white/5">
              <div className="flex items-center justify-between">
                <Badge variant="premium" className="px-5 py-2 rounded-full font-black tracking-widest text-[9px] uppercase shadow-2xl">SECURE LOGIN</Badge>
                <div className="flex gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse" />
                   <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                </div>
              </div>
              <CardTitle className="text-xl md:text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-[0.1em] flex items-center gap-3 pt-2">
                <Lock className="w-6 h-6 text-[var(--accent-primary)] shrink-0 transition-transform group-hover:rotate-12 duration-700" />
                SIGN IN
              </CardTitle>
              <CardDescription className="text-slate-500 text-[11px] font-black tracking-[0.3em] uppercase italic leading-relaxed">
                Sign in to access your administrative dashboard.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="p-10 space-y-8">
                <div className="space-y-4 group/input">
                  <Label htmlFor="username" className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 ml-4 italic leading-none">Username</Label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 blur-2xl opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                    <Input 
                      id="username" 
                      type="text" 
                      placeholder="Enter Username"  
                      className="h-12 border-[var(--border-subtle)] text-lg font-black italic tracking-tighter transition-all rounded-xl pl-8 pr-12 placeholder:text-slate-800 relative z-10 focus-visible:ring-0 shadow-inner uppercase font-mono"
                      style={{ 
                        backgroundColor: 'color-mix(in srgb, var(--bg-surface), transparent 40%)',
                        borderColor: 'color-mix(in srgb, var(--accent-primary), transparent 60%)'
                      }}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <UserCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-800 group-focus-within/input:text-[var(--accent-primary)] transition-colors z-20" />
                  </div>
                </div>

                <div className="space-y-4 group/input">
                  <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 ml-4 italic leading-none">Password</Label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 blur-2xl opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••"
                      className="h-12 border-[var(--border-subtle)] text-lg font-black italic tracking-tighter transition-all rounded-xl pl-8 pr-12 placeholder:text-slate-800 relative z-10 focus-visible:ring-0 shadow-inner font-mono"
                      style={{ 
                        backgroundColor: 'color-mix(in srgb, var(--bg-surface), transparent 40%)',
                        borderColor: 'color-mix(in srgb, var(--accent-primary), transparent 60%)'
                      }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Fingerprint className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-800 group-focus-within/input:text-[var(--accent-primary)] transition-colors z-20" />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-10 pt-0">
                <motion.div whileTap={{ scale: 0.97 }} className="w-full">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-all font-black uppercase tracking-[0.4em] rounded-xl shadow-2xl flex items-center justify-center gap-3 group disabled:opacity-50 text-sm italic"
                    disabled={loginMutation.isPending || demoMutation.isPending}
                  >
                    <AnimatePresence mode="wait">
                      {loginMutation.isPending ? (
                        <motion.div 
                          key="loader"
                          initial={{ opacity: 0, rotate: -20 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: 20 }}
                        >
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="content"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-6"
                        >
                          SIGN IN
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-700" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </CardFooter>
            </form>
          </Card>

          {/* GUEST LAYER */}
          <div className="flex items-center gap-10 px-8">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-700 italic shrink-0">OR Explore Demo Version</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4"
          >
            <Button 
              variant="outline" 
              className="w-full h-16 border-[var(--border-subtle)] transition-all group overflow-hidden rounded-2xl p-4 relative shadow-2xl backdrop-blur-3xl"
              style={{ 
                borderColor: 'color-mix(in srgb, var(--accent-primary), transparent 70%)',
                backgroundColor: 'color-mix(in srgb, var(--bg-surface), transparent 60%)' 
              }}
              onClick={() => demoMutation.mutate()}
              disabled={loginMutation.isPending || demoMutation.isPending}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between w-full relative z-10">
                <div className="flex items-center gap-8">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/10 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
                    <Sparkles className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="text-left space-y-1">
                    <p className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Demo Version</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] flex items-center gap-3 italic">
                       <Cpu className="w-4 h-4" /> Explore features without an account
                    </p>
                  </div>
                </div>
                {demoMutation.isPending ? (
                   <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <ChevronRight className="w-6 h-6 text-slate-800 group-hover:text-[var(--text-primary)] group-hover:translate-x-2 transition-all duration-700" />
                )}
              </div>
            </Button>
          </motion.div>

          {/* FOOTER BADGES */}
          <div className="pt-12 flex items-center justify-center gap-16 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
             <div className="flex items-center gap-4 font-black text-[10px] tracking-[0.4em] uppercase italic text-slate-400">
                <Zap className="w-4 h-4 text-amber-500" /> XGBoost_Engine_V.01
             </div>
             <div className="h-8 w-[1px] bg-white/10" />
             <div className="flex items-center gap-4 font-black text-[10px] tracking-[0.4em] uppercase italic text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> TLS_Institutional
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
