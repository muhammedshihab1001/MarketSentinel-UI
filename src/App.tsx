import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import MarketSignals from './pages/MarketSignals';
import SignalDetail from './pages/SignalDetail';
import PortfolioAnalytics from './pages/PortfolioAnalytics';
import StrategyPerformance from './pages/StrategyPerformance';
import AgentExplanation from './pages/AgentExplanation';
import Drift from './pages/Drift';
import Model from './pages/Model';
import Health from './pages/Health.tsx';
import Metrics from './pages/Metrics.tsx';
import Monitoring from './pages/Monitoring';     // NEW (U13)
import ModelOffline from './pages/ModelOffline.tsx';
import Login from './pages/Login';
import DemoProfile from './pages/DemoProfile';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import { useAppStore } from './store';
import { authApi } from './lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { role, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black tracking-tighter italic text-white uppercase drop-shadow-2xl">MARKETSENTINEL</span>
            <span className="text-[10px] font-black tracking-[0.5em] text-primary/60 uppercase -mt-1">CONNECTING_TO_SYSTEM</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay }}
                className="h-1.5 w-1.5 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAuthStore();
  if (role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const pageTransition = { type: "spring", stiffness: 260, damping: 20 };

const PageWrapper = ({ children, variant = 'y' }: { children: React.ReactNode; variant?: 'y' | 'x' | 'scale' }) => {
  const variants = {
    y:     { initial: { opacity: 0, y: 10 },      animate: { opacity: 1, y: 0 },      exit: { opacity: 0, y: -10 } },
    x:     { initial: { opacity: 0, x: 20 },      animate: { opacity: 1, x: 0 },      exit: { opacity: 0, x: -20 } },
    scale: { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.98 } },
  };
  return (
    <motion.div
      initial={variants[variant].initial}
      animate={variants[variant].animate}
      exit={variants[variant].exit}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
};

function App() {
  const { setAuth, setInitialized } = useAuthStore();
  const { theme } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        const response: any = await authApi.me();
        const { authenticated, role, username, usage } = response.data;
        setAuth(authenticated ? role : null, username ?? null, usage ?? null);
      } catch {
        setAuth(null, null, null);
      } finally {
        setInitialized(true);
      }
    };
    syncAuth();
  }, [setAuth, setInitialized]);

  return (
    <GlobalErrorBoundary>
      <Toaster richColors theme="dark" closeButton position="top-right" />
      <Router>
        <AppRoutes />
      </Router>
    </GlobalErrorBoundary>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* Public */}
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/offline" element={<PageWrapper><ModelOffline /></PageWrapper>} />

        {/* Protected layout */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard"    element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="signals"      element={<PageWrapper variant="scale"><MarketSignals /></PageWrapper>} />
          <Route path="signals/:ticker" element={<PageWrapper variant="x"><SignalDetail /></PageWrapper>} />
          <Route path="portfolio"    element={<PageWrapper><PortfolioAnalytics /></PageWrapper>} />
          <Route path="performance"  element={<PageWrapper><StrategyPerformance /></PageWrapper>} />
          <Route path="drift"        element={<PageWrapper><Drift /></PageWrapper>} />
          <Route path="model"        element={<PageWrapper><Model /></PageWrapper>} />
          <Route path="health"       element={<PageWrapper><Health /></PageWrapper>} />
          <Route path="metrics"      element={<AdminRoute><PageWrapper><Metrics /></PageWrapper></AdminRoute>} />
          {/* U13: NEW monitoring route — live Prometheus charts */}
          <Route path="monitoring"   element={<AdminRoute><PageWrapper><Monitoring /></PageWrapper></AdminRoute>} />
          <Route path="agent-explain" element={<PageWrapper><AgentExplanation /></PageWrapper>} />
          <Route path="demo"         element={<PageWrapper variant="scale"><DemoProfile /></PageWrapper>} />
        </Route>

      </Routes>
    </AnimatePresence>
  );
}

export default App;