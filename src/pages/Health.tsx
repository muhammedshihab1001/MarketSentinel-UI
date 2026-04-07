import { useQuery } from '@tanstack/react-query';
import { healthApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Server,
  Clock,
  ShieldCheck,
  Zap,
  RefreshCw,
  Database,
  Cpu,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { QUERY_KEYS, INTERVALS } from '@/lib/queryKeys';
import { motion } from 'framer-motion';
import type { HealthReadyResponse } from '@/types';

// =========================================================
// HELPERS
// =========================================================

const formatUptime = (seconds: number): string => {
  if (!seconds || seconds < 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const truncateHash = (hash: string | undefined, len = 16): string => {
  if (!hash || hash === 'unknown') return '—';
  return hash.length > len ? `${hash.slice(0, len)}…` : hash;
};

// =========================================================
// STATUS DOT — pulsing colored indicator
// =========================================================

function StatusDot({ online }: { online: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {online && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--status-healthy)] opacity-60" />
      )}
      <span
        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
          online ? 'bg-[var(--status-healthy)]' : 'bg-[var(--status-critical)]'
        }`}
      />
    </span>
  );
}

// =========================================================
// STATUS BADGE
// =========================================================

function StatusBadge({ online }: { online: boolean }) {
  return (
    <span
      className={`font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md ${
        online
          ? 'text-[var(--status-healthy)] bg-[var(--status-healthy)]/10'
          : 'text-[var(--status-critical)] bg-[var(--status-critical)]/10'
      }`}
    >
      {online ? 'ONLINE' : 'OFFLINE'}
    </span>
  );
}

// =========================================================
// STATUS ROW
// =========================================================

function StatusRow({
  icon: Icon,
  label,
  online,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  online: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-[var(--bg-overlay)]">
          <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
        </div>
        <span className="text-sm font-sans text-[var(--text-secondary)]">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {detail && (
          <span className="font-mono text-xs text-[var(--text-muted)] hidden sm:block">
            {detail}
          </span>
        )}
        <StatusBadge online={online} />
        <StatusDot online={online} />
      </div>
    </div>
  );
}

// =========================================================
// MAIN PAGE
// =========================================================

export default function Health() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<HealthReadyResponse>({
    queryKey: QUERY_KEYS.HEALTH_READY,
    queryFn: healthApi.getReady,
    refetchInterval: INTERVALS.HEALTH,
  });

  const spring = { type: 'spring', stiffness: 260, damping: 20 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans font-black tracking-tighter italic uppercase text-2xl text-[var(--text-primary)]">
            System Health
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Live infrastructure and service status
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-active)] transition-colors text-sm text-[var(--text-secondary)]"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <Card className="glass-card border-[var(--status-critical)]/30">
          <CardContent className="p-6 flex items-center gap-4">
            <WifiOff className="h-8 w-8 text-[var(--status-critical)]" />
            <div>
              <p className="font-sans font-semibold text-[var(--status-critical)]">
                API Unreachable
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Cannot connect to backend. Check that the API container is running.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data */}
      {data && (
        <div className="grid gap-4 md:grid-cols-2">

          {/* System Status */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-sans font-semibold text-sm uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Service Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* FIX: Use correct field names from actual /health/ready response */}
                <StatusRow
                  icon={Server}
                  label="API Server"
                  online={data.ready ?? false}
                />
                <StatusRow
                  icon={Cpu}
                  label="ML Model"
                  online={data.models_loaded ?? false}
                  detail={data.model_version || '—'}
                />
                <StatusRow
                  icon={Database}
                  label="PostgreSQL"
                  online={data.db_connected ?? false}
                />
                <StatusRow
                  icon={Zap}
                  label="Redis Cache"
                  online={data.redis_connected ?? false}
                />
                <StatusRow
                  icon={ShieldCheck}
                  label="Data Synced"
                  online={data.data_synced ?? false}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Uptime & Model */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-sans font-semibold text-sm uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Runtime Info
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--text-secondary)]">Uptime</span>
                  {/* FIX: Use uptime_seconds from actual response, not hardcoded */}
                  <span className="font-mono text-[var(--text-data)] font-bold">
                    {formatUptime(data.uptime_seconds)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
                  <span className="text-sm text-[var(--text-secondary)]">Model Version</span>
                  <span className="font-mono text-xs text-[var(--text-data)]">
                    {data.model_version || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
                  <span className="text-sm text-[var(--text-secondary)]">Artifact Hash</span>
                  {/* FIX: Use artifact_hash not artifact_hash (was reading wrong field) */}
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {truncateHash(data.artifact_hash)}
                  </span>
                </div>
                {data.schema_signature && (
                  <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
                    <span className="text-sm text-[var(--text-secondary)]">Schema</span>
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      {truncateHash(data.schema_signature)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Overall health banner */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.15 }}
            className="md:col-span-2"
          >
            <Card
              className={`glass-card ${
                data.ready
                  ? 'border-[var(--status-healthy)]/20'
                  : 'border-[var(--status-critical)]/20'
              }`}
            >
              <CardContent className="p-5 flex items-center gap-4">
                {data.ready ? (
                  <Wifi className="h-6 w-6 text-[var(--status-healthy)]" />
                ) : (
                  <WifiOff className="h-6 w-6 text-[var(--status-critical)]" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-mono font-bold text-sm uppercase tracking-widest ${
                      data.ready
                        ? 'text-[var(--status-healthy)]'
                        : 'text-[var(--status-critical)]'
                    }`}
                  >
                    {data.ready ? 'ALL SYSTEMS OPERATIONAL' : 'SYSTEM DEGRADED'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {data.ready
                      ? 'Model loaded, database connected, cache active'
                      : 'One or more services are offline — check logs'}
                  </p>
                </div>
                <StatusDot online={data.ready} />
              </CardContent>
            </Card>
          </motion.div>

        </div>
      )}
    </motion.div>
  );
}