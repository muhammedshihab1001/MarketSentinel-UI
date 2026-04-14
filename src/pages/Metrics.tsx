import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Copy, CheckCircle2, Cpu, Activity, RefreshCw, Binary, ShieldCheck, Zap, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { MetricCard } from '@/components/MetricCard';

// FIX (F17): Parse key stats from raw Prometheus text
function parseQuickStats(raw: string) {
  const extract = (metric: string) => {
    const match = raw.match(new RegExp(`^${metric}\\{[^}]*\\}\\s+([\\d.]+)`, 'm'))
      || raw.match(new RegExp(`^${metric}\\s+([\\d.]+)`, 'm'));
    return match ? parseFloat(match[1]) : null;
  };

  const totalRequests = (() => {
    const matches = [...raw.matchAll(/^api_requests_total\{[^}]*\}\s+([\d.]+)/gm)];
    return matches.reduce((sum, m) => sum + parseFloat(m[1]), 0);
  })();

  const totalErrors = (() => {
    const matches = [...raw.matchAll(/^api_errors_total\{[^}]*\}\s+([\d.]+)/gm)];
    return matches.reduce((sum, m) => sum + parseFloat(m[1]), 0);
  })();

  const inferences = (() => {
    const matches = [...raw.matchAll(/^model_inference_total\{[^}]*\}\s+([\d.]+)/gm)];
    return matches.reduce((sum, m) => sum + parseFloat(m[1]), 0);
  })();

  const cacheHits = extract('cache_hits_total');
  const cacheMisses = extract('cache_misses_total');
  const hitRate = cacheHits != null && cacheMisses != null
    ? Math.round((cacheHits / Math.max(cacheHits + cacheMisses, 1)) * 100)
    : null;

  return { totalRequests, totalErrors, inferences, hitRate };
}

const fetchMetrics = async (): Promise<string> => {
  const { data } = await api.get<string>('/metrics', { responseType: 'text' });
  return data;
};

const GRAFANA_URL: string | undefined = import.meta.env.VITE_GRAFANA_URL || undefined;

export default function Metrics() {
  const { isFeatureLocked } = useAuthStore();
  const isLocked = isFeatureLocked('snapshot');

  const { data: metrics, isLoading, isError, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: fetchMetrics,
    refetchInterval: 600000,
    enabled: !isLocked,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (metrics) {
      navigator.clipboard.writeText(metrics);
      setCopied(true);
      toast.success('System data copied.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickStats = metrics ? parseQuickStats(metrics) : null;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-12 p-4 md:p-6 min-h-full pb-32 overflow-x-hidden relative">

      {/* HEADER */}
      <motion.div variants={item}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 relative z-10">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-none">
              Usage Stats
            </h1>
            <p className="text-sm text-slate-400">
              Real-time platform usage and error monitoring
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {GRAFANA_URL && (
              <Button
                variant="outline"
                className="h-12 px-8 border-white/5 bg-black/40 hover:bg-black/60 hover:text-cyan-400 hover:border-cyan-500/50 rounded-xl font-semibold gap-3 text-sm backdrop-blur-xl transition-all group text-slate-300"
                onClick={() => window.open(GRAFANA_URL!, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4 transition-transform group-hover:scale-110" />
                Open Grafana
              </Button>
            )}
            <Button
              variant="outline"
              className="h-12 px-8 border-white/5 bg-black/40 hover:bg-black/60 hover:text-cyan-400 hover:border-cyan-500/50 rounded-xl font-semibold gap-3 text-sm backdrop-blur-xl transition-all group text-slate-300"
              onClick={() => { refetch(); toast.info('Re-scraping...'); }}
              disabled={isFetching}
            >
              <RefreshCw className={cn("h-4 w-4 transition-transform group-hover:rotate-180 duration-700", isFetching && "animate-spin text-cyan-400")} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick stats parsed from Prometheus output */}
      {quickStats && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="System Requests"
            value={quickStats.totalRequests.toFixed(0)}
            icon={<Activity />}
            description="Total processed requests"
          />
          <MetricCard
            title="System Errors"
            value={quickStats.totalErrors.toFixed(0)}
            icon={<AlertCircle />}
            description="Failed data calls"
            trend={{ value: 0, label: '', isPositive: quickStats.totalErrors === 0 }}
          />
          <MetricCard
            title="AI Analysis"
            value={quickStats.inferences.toFixed(0)}
            icon={<Cpu />}
            description="Model predictions made"
          />
          <MetricCard
            title="Cache Score"
            value={quickStats.hitRate != null ? `${quickStats.hitRate}%` : '—'}
            icon={<Zap />}
            description="System Efficiency"
            trend={{ value: 0, label: '', isPositive: (quickStats.hitRate ?? 0) > 80 }}
          />
        </div>
      )}

      {/* SYSTEM LOGS */}
      <motion.div variants={item}>
        <Card className="glass-card border-none bg-black/40 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden min-h-[600px] flex flex-col">
          <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Binary className="text-cyan-500 w-6 h-6" />
                Raw Data
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm mt-1">
                Detailed server metrics and system logs
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!metrics || isLoading || isError}
              className="h-10 px-6 bg-black/40 border-white/5 hover:border-cyan-500/50 hover:text-cyan-400 rounded-lg text-sm font-semibold gap-2 transition-all"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Log'}
            </Button>
          </CardHeader>

          <CardContent className="p-0 overflow-auto flex-1 flex flex-col bg-black/20">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12 space-y-6">
                  {Array(10).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-4 bg-white/[0.03] rounded-sm" style={{ width: `${60 + (i % 4) * 10}%` }} />
                  ))}
                </motion.div>
              ) : isError ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-20 gap-10">
                   <div className="p-6 rounded-full bg-rose-500/10 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                      <AlertCircle className="w-12 h-12 text-rose-500" />
                   </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Connection Error</h3>
                    <p className="text-slate-400 max-w-md mx-auto text-sm">Unable to load metrics from the server.</p>
                  </div>
                  <Button variant="outline" onClick={() => refetch()} className="border-rose-500/30 text-rose-500 font-bold rounded-xl px-12 h-12 hover:bg-rose-500/10 transition-all">Retry</Button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
                  <div className="min-w-full font-mono text-[13px] text-cyan-400/80 leading-relaxed p-6">
                    {metrics?.split('\n').map((line, i) => (
                      <div key={i} className="flex group/line hover:bg-cyan-500/[0.03] transition-colors -mx-6 px-6">
                        <span className="w-16 text-[10px] text-slate-700 select-none text-right pr-6 border-r border-white/5 opacity-50 group-hover/line:opacity-100 transition-opacity font-mono self-center">
                          {String(i + 1).padStart(4, '0')}
                        </span>
                        <span className={cn(
                          "whitespace-pre pl-6 py-1",
                          line.startsWith('#') ? 'text-slate-600 italic opacity-60' :
                          line.includes('{') ? 'text-cyan-400 font-black' : 'text-cyan-500/80'
                        )}>
                          {line || ' '}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isLoading && !isError && (
              <div className="p-6 bg-black/40 border-t border-white/5 flex justify-between items-center backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-500">Data Verified</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-xs font-semibold text-cyan-500">
                     Last Updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
                   </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}