import { useQuery } from '@tanstack/react-query';
import { predictionApi } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';

export function DashboardFooter() {
  const { data } = useQuery({
    queryKey: [QUERY_KEYS.SNAPSHOT],
    queryFn: predictionApi.getSnapshot,
    staleTime: Infinity,
  });

  const meta = data?.meta;
  const latency = meta?.latency_ms;

  return (
    <footer className="w-full h-8 border-t border-[var(--border-subtle)] bg-[var(--bg-base)] flex items-center justify-end px-4 mt-auto shrink-0 z-50">
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
        <span>MarketSentinel ML System</span>
        <span>•</span>
        {latency !== undefined ? (
          <span className="flex items-center gap-1.5">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              latency < 100 ? "bg-[var(--status-healthy)] shadow-[0_0_8px_var(--status-healthy)]" :
              latency < 300 ? "bg-[var(--status-warning)] shadow-[0_0_8px_var(--status-warning)]" :
              "bg-[var(--status-critical)] animate-pulse"
            )} />
            {latency}ms
          </span>
        ) : (
          <span>--ms</span>
        )}
      </div>
    </footer>
  );
}
