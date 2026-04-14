import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  BarChart,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  HeartPulse,
  Database,
  LogOut,
  Radio,
  Clock,
  Lock,
  Sparkles,
} from 'lucide-react';

import { authApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import DemoBanner from '@/components/DemoBanner';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { name: 'Dashboard',         href: '/dashboard',   icon: LayoutDashboard },
  { name: 'Market Signals',    href: '/signals',     icon: TrendingUp },
  { name: 'Portfolio',         href: '/portfolio',   icon: BarChart },
  { name: 'Strategy Logs',     href: '/performance', icon: Activity },
  { name: 'Stability',         href: '/drift',       icon: BrainCircuit },
  { name: 'Model Integrity',   href: '/model',       icon: ShieldCheck },
  { name: 'System Health',     href: '/health',      icon: HeartPulse },
  { name: 'Service Metrics',   href: '/metrics',     icon: Database },
  { name: 'Ops Monitoring',    href: '/monitoring',  icon: Radio },
];

const spring = { type: 'spring', stiffness: 260, damping: 20 };

export default function DashboardLayout() {
  const { role, usage, resetInSeconds, fullyLocked, logout: authLogout } = useAuthStore();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(resetInSeconds ?? 0);
  const location = useLocation();

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

  // Redirect to /demo if fully locked
  useEffect(() => {
    if (role === 'demo' && fullyLocked && location.pathname !== '/demo') {
      window.location.replace('/demo');
    }
  }, [fullyLocked, role, location.pathname]);

  // Handle scroll locking when fully locked to prevent double scrollbars
  // Replaced manual padding logic to fix body scrolling issues.
  useEffect(() => {
    if (fullyLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullyLocked]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // still clear local state
    }
    authLogout();
    toast.info('Logged out successfully.');
    window.location.replace('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">

      {/* ── Sidebar ──────────────────────────────────── */}
      <motion.aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        animate={{ width: sidebarExpanded ? 220 : 64 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex relative flex-shrink-0 flex-col h-full bg-[var(--bg-surface)]/80 backdrop-blur-xl border-r border-[var(--border-subtle)] z-[60] overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center">
              <BrainCircuit className="h-4 w-4 text-[var(--accent-primary)]" />
            </div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={spring}
                  className="text-[10px] font-black tracking-[0.4em] text-[var(--accent-primary)] whitespace-nowrap uppercase italic"
                >
                  MARKETSENTINEL
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-hidden">
          {NAV_ITEMS.filter(item => {
            if (role !== 'owner' && (item.href === '/monitoring' || item.href === '/metrics')) return false;
            return true;
          }).map((item) => (
            <NavLink
              key={item.href}
              to={fullyLocked ? '#' : item.href}
              onClick={(e) => {
                if (fullyLocked) {
                  e.preventDefault();
                  toast.error('System Locked: Feature access restricted.');
                }
              }}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center h-10 rounded-lg transition-all duration-300 group',
                  isActive && !fullyLocked
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-secondary)]',
                  fullyLocked && 'opacity-30 filter grayscale blur-[1px] pointer-events-none'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[var(--accent-primary)]"
                      transition={spring}
                    />
                  )}

                  <div className="shrink-0 w-10 flex items-center justify-center">
                    <item.icon
                      className={cn(
                        'h-[18px] w-[18px] transition-colors',
                        isActive
                          ? 'text-[var(--accent-primary)]'
                          : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                      )}
                    />
                  </div>

                  <AnimatePresence>
                    {sidebarExpanded && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center flex-1 min-w-0"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap truncate italic">
                          {item.name}
                        </span>
                        {item.name === 'Ops Monitoring' && role === 'owner' && (
                          <div className="ml-auto flex items-center gap-1.5 pl-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                            <span className="text-[10px] font-black tracking-widest text-[var(--accent-primary)]">LIVE</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: role badge + logout */}
        <div className="shrink-0 border-t border-[var(--border-subtle)] p-2 space-y-1">

          {role && (
            <div className="flex items-center h-10 rounded-lg px-2 gap-3 bg-[var(--bg-overlay)]">
              <div className="shrink-0 w-6 flex items-center justify-center">
                {role === 'owner' ? (
                  <ShieldCheck className="h-4 w-4 text-[var(--accent-primary)]" />
                ) : (
                  <Clock className="h-4 w-4 text-[var(--accent-primary)]" />
                )}
              </div>
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col min-w-0"
                  >
                    {role === 'owner' ? (
                      <span className="text-[9px] font-black tracking-[0.3em] text-cyan-500 uppercase italic">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[9px] font-black tracking-[0.3em] text-cyan-500 uppercase italic truncate">
                        Demo Access · {usage?.features ? Math.min(...Object.values(usage.features).map(f => f.remaining)) : 0} left
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center h-10 w-full rounded-lg px-2 gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-colors group"
          >
            <div className="shrink-0 w-6 flex items-center justify-center">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                    Sign Out
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ─────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative bg-[var(--bg-base)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
        
        <DemoBanner />
        
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 scroll-smooth relative z-10">
          <div className="min-h-full w-full bg-transparent">
            <Outlet />
          </div>
        </main>

        {/* ── Mobile Navigation (Bottom Pill) ──────────────── */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
          <nav className="glass-card bg-[var(--bg-surface)]/95 backdrop-blur-xl border border-[var(--border-subtle)] rounded-2xl h-16 flex items-center justify-around px-2 shadow-2xl">
            {NAV_ITEMS.filter(item => {
              // Hide Owner-exclusive pages from Mobile Nav loop
              if (role !== 'owner' && (item.href === '/monitoring' || item.href === '/metrics')) return false;
              // On mobile, to prevent overcrowding, we might restrict items, but let's show top 5 core ones.
              const mobileKeys = ['/dashboard', '/signals', '/portfolio', '/performance', '/model'];
              return mobileKeys.includes(item.href);
            }).map((item) => (
              <NavLink
                key={item.href}
                to={fullyLocked ? '#' : item.href}
                onClick={(e) => {
                  if (fullyLocked) {
                    e.preventDefault();
                    toast.error('System Locked');
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-300',
                    isActive && !fullyLocked
                      ? 'text-[var(--accent-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                    fullyLocked && 'opacity-20 filter grayscale blur-[2px] pointer-events-none'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-pill"
                        className="absolute inset-0 bg-[var(--accent-primary)]/10 rounded-xl"
                        transition={spring}
                      />
                    )}
                    <item.icon className={cn("h-5 w-5 mb-0.5", isActive ? "scale-110" : "")} />
                    <span className="text-[9px] font-medium tracking-tight truncate max-w-full px-1">{item.name.split(' ')[0]}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Global Lockout Overlay ── */}
      <AnimatePresence>
        {fullyLocked && createPortal(
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 backdrop-blur-[60px] bg-black/80 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="max-w-md w-full relative z-50"
            >
              <div className="bg-black/98 border border-rose-500/30 rounded-3xl p-8 md:p-10 text-center space-y-8 shadow-[0_0_100px_rgba(244,63,94,0.2)] backdrop-blur-3xl">
                <div className="flex flex-col items-center gap-6">
                  <div className="h-20 w-20 bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl flex items-center justify-center shadow-lg">
                    <Lock className="h-8 w-8 text-rose-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Access Limited</h3>
                    <p className="text-slate-400 text-sm font-medium">Demo limit reached. Access restores at reset.</p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mb-3">Time Until Reset</p>
                  <div className="flex justify-center gap-6">
                    {timeLeft > 0 ? (
                      formatTime(timeLeft).split(' ').map((part, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <span className="text-2xl font-bold font-mono text-white">{part.replace(/[A-Z]/g, '')}</span>
                          <span className="text-[10px] text-rose-500/80 mt-1 uppercase">
                            {part.includes('D') ? 'Days' : part.includes('H') ? 'Hours' : part.includes('M') ? 'Mins' : 'Secs'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-2xl font-bold text-emerald-400 animate-pulse">Ready</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    className="w-full h-12 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 font-semibold flex items-center justify-center gap-2 transition-all"
                    onClick={() => window.open('https://linkedin.com/in/muhammedshihabp', '_blank', 'noopener,noreferrer')}
                  >
                    <Sparkles className="h-4 w-4" />
                    Full Access
                  </button>
                  <button
                    className="w-full h-11 rounded-xl text-slate-400 hover:text-white font-medium flex items-center justify-center gap-2 transition-all bg-white/5"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}