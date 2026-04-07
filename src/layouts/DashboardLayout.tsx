import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
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
  Radio,        // NEW — Monitoring icon
  Clock,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import DemoBanner from '@/components/DemoBanner';
import { useState } from 'react';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { name: 'Dashboard',     href: '/dashboard',   icon: LayoutDashboard },
  { name: 'Market Signals',href: '/signals',     icon: TrendingUp },
  { name: 'Portfolio',     href: '/portfolio',   icon: BarChart },
  { name: 'Performance',   href: '/performance', icon: Activity },
  { name: 'Concept Drift', href: '/drift',       icon: BrainCircuit },
  { name: 'Model',         href: '/model',       icon: ShieldCheck },
  { name: 'Health',        href: '/health',      icon: HeartPulse },
  { name: 'Metrics',       href: '/metrics',     icon: Database },
  // NEW (U13): Live Prometheus monitoring page
  { name: 'Monitoring',    href: '/monitoring',  icon: Radio },
];

const spring = { type: 'spring', stiffness: 260, damping: 20 };

export default function DashboardLayout() {
  const { role, usage, logout: authLogout } = useAuthStore();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // still clear local state
    }
    authLogout();
    toast.info('Logged out successfully.');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">

      {/* ── Sidebar ──────────────────────────────────── */}
      <motion.aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        animate={{ width: sidebarExpanded ? 220 : 64 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative flex-shrink-0 flex flex-col h-full bg-[var(--bg-surface)]/80 backdrop-blur-xl border-r border-[var(--border-subtle)] z-40 overflow-hidden"
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
                  className="font-mono font-black text-sm tracking-tight text-[var(--text-primary)] whitespace-nowrap"
                >
                  MarketSentinel
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-hidden">
          {NAV_ITEMS.filter(item => !(role === 'demo' && item.href === '/monitoring')).map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center h-10 rounded-lg transition-colors duration-150 group',
                  isActive
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-secondary)]'
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
                        <span className="font-sans text-sm font-medium whitespace-nowrap truncate">
                          {item.name}
                        </span>
                        {item.name === 'Monitoring' && role === 'owner' && (
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
                      <span className="font-mono text-[10px] font-black tracking-[0.2em] text-[var(--accent-primary)]">
                        OWNER
                      </span>
                    ) : (
                      <span className="font-sans text-xs text-[var(--accent-primary)] truncate">
                        DEMO — {usage?.features ? Math.min(...Object.values(usage.features).map(f => f.remaining)) : 0} left
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center h-10 w-full rounded-lg px-2 gap-3 text-[var(--text-muted)] hover:text-[var(--status-critical)] hover:bg-[var(--status-critical)]/5 transition-colors group"
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
                  className="font-sans text-sm"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ─────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DemoBanner />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}