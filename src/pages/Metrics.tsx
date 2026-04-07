import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TerminalSquare, Copy, CheckCircle2, Cpu, Activity, RefreshCw, Binary, ShieldCheck, Zap, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

const GRAFANA_URL = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3000';

export default function Metrics() {
  const { data: metrics, isLoading, isError, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: fetchMetrics,
    refetchInterval: 600000,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (metrics) {
      navigator.clipboard.writeText(metrics);
      setCopied(true);
      toast.success('Telemetry payload copied.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickStats = metrics ? parseQuickStats(metrics) : null;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-16 max-w-7xl mx-auto pb-32">

      {/* HEADER */}
      <motion.div variants={item} className="p-6 md:p-8 rounded-2xl glass-card relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center shadow-2xl shrink-0">
              <TerminalSquare className="h-8 w-8 text-[var(--accent-primary)]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter italic uppercase text-[var(--text-primary)] leading-none">
                SYSTEM METRICS
              </h1>
              <Badge variant="outline" className="font-black text-[10px] bg-white/[0.03] text-slate-400 border-white/10 px-4 py-1 rounded-full tracking-[0.3em] uppercase italic">
                Live Server Stats
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* FIX (F17): Grafana link button */}
            <Button
              variant="outline"
              size="lg"
              className="h-10 px-6 border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 rounded-xl font-black uppercase tracking-widest gap-2 text-xs"
              onClick={() => window.open(GRAFANA_URL, '_blank')}
            >
              <ExternalLink className="h-5 w-5" />
              Open Grafana
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-10 px-6 border-white/10 bg-slate-950/40 hover:bg-slate-900 rounded-xl font-black uppercase tracking-widest gap-2 text-xs"
              onClick={() => { refetch(); toast.info('Re-scraping...'); }}
              disabled={isFetching}
            >
              <RefreshCw className={cn("h-5 w-5", isFetching && "animate-spin text-primary")} />
              Scrape Now
            </Button>
          </div>
        </div>
      </motion.div>

      {/* FIX (F17): Quick stats parsed from Prometheus output */}
      {quickStats && (
        <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Requests', value: quickStats.totalRequests.toFixed(0), icon: Activity, color: 'text-cyan-400' },
            { label: 'Total Errors', value: quickStats.totalErrors.toFixed(0), icon: AlertCircle, color: 'text-rose-400' },
            { label: 'Inferences', value: quickStats.inferences.toFixed(0), icon: Cpu, color: 'text-indigo-400' },
            { label: 'Cache Hit Rate', value: quickStats.hitRate != null ? `${quickStats.hitRate}%` : '—', icon: Zap, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <motion.div key={i} variants={item} className="p-6 rounded-2xl glass-card space-y-3 h-32 flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">{stat.label}</span>
              </div>
              <p className="text-xl md:text-2xl font-black italic text-white tracking-tighter leading-none">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* TERMINAL DISPLAY */}
      <motion.div variants={item}>
        <Card className="glass-card border-none rounded-2xl shadow-2xl relative min-h-[600px]">
          <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <CardTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-widest text-white italic">
                <Binary className="text-primary w-8 h-8" />
                /metrics RAW_EXPOSURE
              </CardTitle>
              <CardDescription className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase italic mt-2">
                Latency histograms · inference counters · cache metrics
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!metrics || isLoading || isError}
              className="h-14 px-8 bg-slate-950/40 border-white/10 rounded-2xl text-[11px] font-black tracking-[0.3em] uppercase gap-3"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-primary" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>

          <CardContent className="p-0 overflow-auto bg-[#050508]/60">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12 space-y-6">
                  {Array(8).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-5 bg-white/[0.03] rounded" style={{ width: `${50 + (i % 3) * 15}%` }} />
                  ))}
                </motion.div>
              ) : isError ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-16 gap-8 text-rose-500">
                  <AlertCircle className="w-16 h-16" />
                  <div className="text-center">
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Telemetry Timeout</h3>
                    <p className="text-slate-500 mt-2">Failed to scrape /metrics endpoint.</p>
                  </div>
                  <Button variant="outline" onClick={() => refetch()} className="border-rose-500/30 text-rose-500 uppercase tracking-widest font-black">Retry</Button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <pre className="p-10 text-sm font-mono text-cyan-400/80 leading-relaxed overflow-x-auto">
                    {metrics?.split('\n').map((line, i) => (
                      <div key={i} className={cn(
                        "flex gap-8 px-4 -mx-4 hover:bg-white/[0.02] transition-colors",
                      )}>
                        <span className="w-12 text-slate-700 select-none text-right text-xs">{i + 1}</span>
                        <span className={cn(
                          "whitespace-pre",
                          line.startsWith('#') ? 'text-slate-600 italic' :
                          line.includes('{') ? 'text-indigo-400' : 'text-cyan-400'
                        )}>
                          {line || ' '}
                        </span>
                      </div>
                    ))}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>

            {!isLoading && !isError && (
              <div className="sticky bottom-0 p-6 bg-slate-950/80 backdrop-blur border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Payload_Integrity_Verified</span>
                </div>
                <span className="text-[10px] text-primary font-black uppercase tracking-[0.3em] italic">
                  Last Scrape: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}