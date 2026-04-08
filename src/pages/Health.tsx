import { useQuery } from '@tanstack/react-query';
import { healthApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Server,
  Zap,
  RefreshCw,
  Database,
  Cpu,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { motion } from 'framer-motion';
import type { HealthReadyResponse } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

// =========================================================
// HELPERS
// =========================================================

const formatUptime = (seconds: number): string => {
  if (!seconds || seconds < 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}D ${h}H ${m}M`;
  if (h > 0) return `${h}H ${m}M`;
  return `${m}M`;
};

const truncateHash = (hash: string | undefined, len = 24): string => {
  if (!hash || hash === 'unknown') return '—';
  return hash.length > len ? `${hash.slice(0, len)}…` : hash;
};

function StatusIndicator({ online }: { online: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn(
        "h-6 px-4 rounded-full border flex items-center gap-2",
        online ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400"
      )}>
        <div className={cn("w-1.5 h-1.5 rounded-full shadow-lg", online ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
        <span className="text-xs font-semibold">{online ? 'Operational' : 'Degraded'}</span>
      </div>
    </div>
  );
}

function HealthNode({ icon: Icon, label, online, detail }: { icon: any, label: string, online: boolean, detail?: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all duration-500 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-8">
        <div className="h-16 w-16 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all">
          <Icon className={cn("h-8 w-8", online ? "text-cyan-400" : "text-rose-400")} />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="text-lg font-bold text-white">{detail || (online ? 'Stable' : 'Offline')}</p>
        </div>
      </div>
      <StatusIndicator online={online} />
    </div>
  );
}

export default function Health() {
  const { isFeatureLocked } = useAuthStore();
  const isLocked = isFeatureLocked('snapshot');

  const { data, isLoading, isError, refetch, isFetching } = useQuery<HealthReadyResponse>({
    queryKey: QUERY_KEYS.HEALTH_READY,
    queryFn: healthApi.getReady,
    refetchInterval: INTERVALS.HEALTH,
    enabled: !isLocked,
  });

  // Removed unused spring constant

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 p-4 md:p-6 min-h-full pb-32"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-none">
            System Status
          </h1>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Operational
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-16 px-10 rounded-2xl bg-black/40 border border-white/5 hover:border-cyan-500/50 transition-all flex items-center gap-4 group shadow-2xl backdrop-blur-xl"
        >
          <RefreshCw className={cn("h-5 w-5 text-cyan-500 transition-transform group-hover:rotate-180", isFetching && "animate-spin")} />
          <span className="text-xs font-semibold text-slate-400 group-hover:text-white">Refresh</span>
        </motion.button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[2rem] bg-white/5" />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <Card className="glass-card border-rose-500/30 bg-rose-500/5 rounded-[2rem]">
          <CardContent className="p-12 flex flex-col items-center text-center gap-6">
            <div className="h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center">
               <WifiOff className="h-8 w-8 text-rose-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Network Disconnected</h3>
              <p className="text-slate-400 max-w-md mx-auto text-sm">
                Cannot reach the backend service. Ensure everything is running.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Matrix */}
      {data && (
        <div className="space-y-12">
          <div className="grid gap-6 md:grid-cols-2">
            <HealthNode icon={Server} label="API Endpoint" online={data.ready || false} />
            <HealthNode icon={Cpu} label="AI Models" online={data.models_loaded || false} detail={data.model_version} />
            <HealthNode icon={Database} label="System Database" online={data.db_connected || false} />
            <HealthNode icon={Zap} label="System Cache" online={data.redis_connected || false} />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
             <div className="p-10 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-xl space-y-6">
                <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">System Uptime</p>
                <p className="font-mono text-3xl font-bold text-white leading-none">{formatUptime(data.uptime_seconds)}</p>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }} className="h-full bg-cyan-500" />
                </div>
             </div>
             <div className="p-10 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-xl space-y-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Version</p>
                <p className="font-mono text-lg font-bold text-white uppercase truncate" title={data.model_version}>{data.model_version || 'N/A'}</p>
                <p className="text-xs text-slate-500 font-semibold">Build: v.{data.model_version?.slice(0, 4)}</p>
             </div>
             <div className="p-10 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-2xl backdrop-blur-xl space-y-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Version ID</p>
                <p className="font-mono text-lg font-bold text-cyan-400 uppercase truncate">{truncateHash(data.artifact_hash)}</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-xs text-slate-400 font-semibold">Verified</p>
                </div>
             </div>
          </div>

          <div className={cn(
            "p-12 rounded-[3rem] border flex items-center justify-between gap-12 group transition-all duration-700 backdrop-blur-3xl shadow-2xl",
            data.ready ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"
          )}>
            <div className="flex items-center gap-10">
               <div className={cn(
                 "h-20 w-20 rounded-[2rem] border-2 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110",
                 data.ready ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
               )}>
                  {data.ready ? <Wifi className="h-10 w-10" /> : <WifiOff className="h-10 w-10" />}
               </div>
               <div className="space-y-3">
                  <h2 className={cn(
                    "text-3xl font-bold leading-none",
                    data.ready ? "text-white" : "text-rose-400"
                  )}>
                    {data.ready ? 'All Systems Operational' : 'System Degraded'}
                  </h2>
                  <p className="text-slate-400 text-sm font-medium max-w-lg mb-0">
                    {data.ready 
                      ? 'All services are running normally. Connections are stable.'
                      : 'Some system components are unreachable. Please check the network.'}
                  </p>
               </div>
            </div>
            <StatusIndicator online={data.ready} />
          </div>
        </div>
      )}
    </motion.div>
  );
}