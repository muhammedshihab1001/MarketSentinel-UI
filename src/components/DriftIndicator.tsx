import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DriftState } from '@/types';

interface DriftIndicatorProps {
  state: DriftState;
  description?: string;
  className?: string;
}

export function DriftIndicator({ state, description, className }: DriftIndicatorProps) {
  const configMap = {
    NORMAL: {
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20',
      label: 'MODEL_STABLE',
    },
    WARNING: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      label: 'Elevated Drift',
    },
    CRITICAL: {
      icon: AlertCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      label: 'CRITICAL_DRIFT_TERMINATED',
    },
  };

  const config = configMap[state as keyof typeof configMap] || configMap.NORMAL;
  const Icon = config.icon;

  return (
    <Card className={cn("border bg-[#020617]/40 backdrop-blur-xl rounded-[1.5rem] overflow-hidden transition-all group hover:scale-[1.02]", config.border, className)}>
      <CardContent className={cn("p-6 flex items-center gap-6", config.bg)}>
        <div className={cn("p-4 rounded-[1.25rem] bg-[#020617]/60 border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-500", config.color)}>
           <Icon className="h-10 w-10" />
        </div>
        <div className="flex-1">
          <h4 className={cn("text-2xl font-black tracking-tighter italic uppercase", config.color)}>{config.label}</h4>
          {description && (
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
