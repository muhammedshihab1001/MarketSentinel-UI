import { useQuery } from '@tanstack/react-query';
import { healthApi, modelApi, api, OwnerOnlyError } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Activity, Cpu, Database, Zap, ShieldCheck,
  TrendingUp, AlertCircle, RefreshCw, Radio,
  BarChart2, Clock, Server, Lock
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

// ── Prometheus text parser ────────────────────────────────────
function parsePrometheus(raw: string) {
  const extract = (metric: string): number => {
    const m = raw.match(new RegExp(`^${metric}(?:\\{[^}]*\\})?\\s+([\\d.e+\\-]+)`, 'm'));
    return m ? parseFloat(m[1]) : 0;
  };
  const extractAll = (prefix: string): Record<string, number> => {
    const out: Record<string, number> = {};
    const re = new RegExp(`^${prefix}\\{([^}]*)\\}\\s+([\\d.e+\\-]+)`, 'gm');
    let m;
    while ((m = re.exec(raw)) !== null) {
      const label = m[1].match(/endpoint="([^"]+)"/)?.[1] ?? m[1];
      out[label] = (out[label] ?? 0) + parseFloat(m[2]);
    }
    return out;
  };

  const reqMap = extractAll('api_requests_total');
  const errMap = extractAll('api_errors_total');
  const totalReqs = Object.values(reqMap).reduce((a, b) => a + b, 0);
  const totalErrs = Object.values(errMap).reduce((a, b) => a + b, 0);
  const errorRate = totalReqs > 0 ? ((totalErrs / totalReqs) * 100) : 0;

  const cacheHits = extract('cache_hits_total');
  const cacheMisses = extract('cache_misses_total');
  const cacheHitRate = (cacheHits + cacheMisses) > 0
    ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) : 0;

  const inferenceTotal = (() => {
    let t = 0;
    const re = /^model_inference_total\{[^}]*\}\s+([\d.]+)/gm;
    let m; while ((m = re.exec(raw)) !== null) t += parseFloat(m[1]);
    return t;
  })();

  // Per-endpoint bar data
  const endpointData = Object.entries(reqMap)
    .map(([endpoint, count]) => ({
      endpoint: endpoint.replace('/api', '').slice(0, 20),
      requests: Math.round(count),
      errors: Math.round(errMap[endpoint] ?? 0),
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 8);

  return { totalReqs, totalErrs, errorRate, cacheHitRate, cacheHits, inferenceTotal, endpointData };
}

// ── Custom tooltip ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-3 text-xs shadow-2xl">
      <p className="text-[var(--text-muted)] mb-2 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-mono font-bold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color = 'text-[var(--accent-primary)]', pulse = false }: any) {
  return (
    <Card className="glass-card border-none rounded-2xl overflow-hidden group">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
          <div className={cn("p-1.5 rounded-lg bg-white/[0.03] border border-white/5", pulse && "animate-pulse")}>
            <Icon className={cn("w-3.5 h-3.5", color)} />
          </div>
        </div>
        <p className={cn("text-2xl font-bold tracking-tight leading-none", color)}>{value}</p>
        {sub && <p className="text-[10px] text-slate-500 font-medium">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const spring = { type: 'spring', stiffness: 260, damping: 20 };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: spring } };

export default function Monitoring() {
  const [sparkHistory, setSparkHistory] = useState<{ t: string; reqs: number; errs: number }[]>([]);
  const { isFeatureLocked } = useAuthStore();
  const isLocked = isFeatureLocked('snapshot');

  // Health
  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ['monitoring-health'],
    queryFn: healthApi.getReady,
    refetchInterval: 15000,
    enabled: !isLocked,
  });

  const { data: _icData } = useQuery({
    queryKey: ['monitoring-ic'],
    queryFn: () => modelApi.getInfo(),
    refetchInterval: 60000,
  });

  const { data: rawMetrics, isFetching, refetch: refetchMetrics, error: metricsError } = useQuery({
    queryKey: ['monitoring-metrics'],
    queryFn: async () => {
      const { data: metricsData } = await api.get<string>('/metrics', { responseType: 'text' });
      return metricsData;
    },
    refetchInterval: 30000,
    enabled: !isLocked,
    retry: (failCount: number, err: any) => {
      if (err instanceof OwnerOnlyError) return false;
      return failCount < 3;
    },
  });

  const { error: diagError } = useQuery({
    queryKey: ['monitoring-diagnostics'],
    queryFn: modelApi.getDiagnostics,
    retry: (failCount: number, err: any) => {
      if (err instanceof OwnerOnlyError) return false;
      return failCount < 3;
    },
  });

  // Update spark history when rawMetrics changes (replaces deprecated onSuccess)
  useEffect(() => {
    if (!rawMetrics) return;
    const parsed = parsePrometheus(rawMetrics);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSparkHistory(prev => [...prev.slice(-19), { t: now, reqs: parsed.totalReqs, errs: parsed.totalErrs }]);
  }, [rawMetrics]);

  const metrics = useMemo(() => rawMetrics ? parsePrometheus(rawMetrics) : null, [rawMetrics]);

  const handleRefreshAll = () => {
    refetchHealth();
    refetchMetrics();
    toast.info('Refreshing all monitoring data...');
  };

  // Health status dot
  const healthOk = health?.ready === true;
  const dbOk = health?.db_connected === true;
  const redisOk = health?.redis_connected === true;
  const modelOk = health?.models_loaded === true;

  if (diagError instanceof OwnerOnlyError || metricsError instanceof OwnerOnlyError) {
    return (
      <div className="space-y-12 p-4 md:p-6 min-h-full pb-32 flex flex-col items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-md">
          <Card className="glass-card border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-2xl p-6">
            <CardContent className="flex flex-col items-center justify-center text-center p-6 gap-4">
              <Lock className="h-8 w-8 text-[var(--accent-primary)] opacity-60" />
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">System Monitoring</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">System monitoring is restricted to administrators.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-12 p-4 md:p-6 min-h-full pb-32 max-w-7xl mx-auto">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-none">
              System Monitor
            </h1>
            <p className="text-sm text-slate-400">
              Live updates on platform health and performance
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={isFetching}
            className="h-10 px-6 border-white/10 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl font-semibold text-sm gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin text-[var(--accent-primary)]")} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* ── SYSTEM STATUS STRIP ────────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'System Server', ok: healthOk, icon: Server },
          { label: 'System Database', ok: dbOk, icon: Database },
          { label: 'System Cache', ok: redisOk, icon: Radio },
          { label: 'Analysis Model', ok: modelOk, icon: Cpu },
        ].map(({ label, ok, icon: Icon }) => (
          <Card key={label} className={cn(
            "glass-card border-none rounded-2xl overflow-hidden",
            ok ? "ring-1 ring-emerald-500/20" : "ring-1 ring-rose-500/20"
          )}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl",
                ok ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
              )}>
                <Icon className={cn("w-4 h-4", ok ? "text-emerald-400" : "text-rose-400")} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className={cn("text-sm font-bold", ok ? "text-emerald-400" : "text-rose-400")}>
                  {ok ? 'Online' : 'Offline'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── HEALTH DETAIL ──────────────────────────────────── */}
      {health && (
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Uptime" value={health.uptime_seconds != null ? `${Math.floor(health.uptime_seconds / 60)}m` : '—'} sub="since startup" icon={Clock} color="text-cyan-400" />
          <StatCard label="Model Version" value={health.model_version ?? '—'} sub="version ID" icon={Cpu} color="text-indigo-400" />
          <StatCard label="Data Status" value={health.data_synced ? 'ACTIVE' : 'OFFLINE'} sub="Daily Data" icon={Database} color={health.data_synced ? "text-emerald-400" : "text-rose-400"} />
          <StatCard label="Baseline" value={health.drift_baseline_loaded ? 'READY' : 'MISSING'} sub="Reference" icon={ShieldCheck} color={health.drift_baseline_loaded ? "text-emerald-400" : "text-amber-400"} />
        </motion.div>
      )}

      {/* ── PROMETHEUS STATS ───────────────────────────────── */}
      {metrics && (
        <>
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Requests" value={metrics.totalReqs.toFixed(0)} sub="total" icon={Activity} pulse />
            <StatCard label="Error Rate" value={`${metrics.errorRate.toFixed(1)}%`} sub={`${metrics.totalErrs.toFixed(0)} total errors`} icon={AlertCircle} color={metrics.errorRate > 5 ? "text-rose-400" : "text-emerald-400"} />
            <StatCard label="Cache Rate" value={`${metrics.cacheHitRate}%`} sub={`${metrics.cacheHits.toFixed(0)} hits`} icon={Zap} color="text-amber-400" />
            <StatCard label="AI Decisions" value={metrics.inferenceTotal.toFixed(0)} sub="predict calls" icon={TrendingUp} color="text-purple-400" />
          </motion.div>

          {/* ── CHARTS ROW ─────────────────────────────────── */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">

            {/* Request history sparkline */}
            <motion.div variants={item}>
              <Card className="glass-card border-none rounded-2xl">
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--accent-primary)]" /> Request History
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  {sparkHistory.length > 1 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={sparkHistory}>
                        <defs>
                          <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="t" tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} width={35} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="reqs" name="Requests" stroke="var(--accent-primary)" strokeWidth={2} fill="url(#reqGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-slate-700 font-bold uppercase tracking-widest text-[10px] italic">
                      Gathering stats...
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Per-endpoint bar chart */}
            <motion.div variants={item}>
              <Card className="glass-card border-none rounded-2xl">
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" /> Requests by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  {metrics.endpointData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={metrics.endpointData} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="endpoint" tick={{ fill: 'var(--text-muted)', fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} width={30} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="requests" name="Requests" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                        <Bar dataKey="errors" name="Errors" fill="#f43f5e" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-slate-700 font-bold uppercase tracking-widest text-[10px] italic">
                      No endpoint data
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}

      {/* ── NO METRICS FALLBACK ──────────────────────────── */}
      {!rawMetrics && !isFetching && (
        <motion.div variants={item}>
          <Card className="glass-card border-none rounded-2xl">
            <CardContent className="p-12 flex flex-col items-center gap-6 text-center">
              <AlertCircle className="w-12 h-12 text-slate-700" />
              <div>
                <p className="font-bold text-2xl text-white tracking-tight">Metrics Unavailable</p>
                <p className="text-slate-400 text-sm mt-2">System data unreachable. Please check the connection.</p>
              </div>
              <Button variant="outline" onClick={handleRefreshAll} className="border-white/10 rounded-xl font-semibold text-sm">
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
}