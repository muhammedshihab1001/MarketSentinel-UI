import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number | ReactNode;
  icon?: ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="h-full"
    >
      <Card 
        className={cn(
          "glass-card border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden relative group h-full flex flex-col justify-between flex-1 shadow-sm transition-all duration-300",
          className
        )}
        style={{
          boxShadow: trend?.isPositive === true ? '0 0 20px color-mix(in srgb, var(--status-healthy), transparent 90%)' : 
                     trend?.isPositive === false ? '0 0 20px color-mix(in srgb, var(--status-critical), transparent 90%)' : undefined,
          border: trend?.isPositive === true ? '1px solid color-mix(in srgb, var(--status-healthy), transparent 80%)' : 
                  trend?.isPositive === false ? '1px solid color-mix(in srgb, var(--status-critical), transparent 80%)' : undefined
        }}
      >
        {/* ATMOSPHERIC BACKGROUND ELEMENTS */}
        <div className={cn(
          "absolute -right-8 -top-8 w-32 h-32 blur-[40px] opacity-10 transition-all duration-700 group-hover:opacity-20 group-hover:scale-125 vivant-glow",
          trend?.isPositive === true ? "bg-[var(--status-healthy)]" : 
          trend?.isPositive === false ? "bg-[var(--status-critical)]" : "bg-[var(--accent-primary)]"
        )} />
        
        <div className="absolute inset-0 scanline opacity-[0.02] pointer-events-none" />

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-5 pt-5">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors italic leading-none">
            {title}
          </CardTitle>
          {icon && (
            <div 
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm relative group/icon overflow-hidden border",
                trend?.isPositive === true ? "text-[var(--status-healthy)]" : 
                trend?.isPositive === false ? "text-[var(--status-critical)]" : 
                "bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-subtle)]"
              )}
              style={{
                backgroundColor: trend?.isPositive === true ? 'color-mix(in srgb, var(--status-healthy), transparent 90%)' : 
                                trend?.isPositive === false ? 'color-mix(in srgb, var(--status-critical), transparent 90%)' : undefined,
                borderColor: trend?.isPositive === true ? 'color-mix(in srgb, var(--status-healthy), transparent 80%)' : 
                             trend?.isPositive === false ? 'color-mix(in srgb, var(--status-critical), transparent 80%)' : undefined,
              }}
            >
              <div className="absolute inset-0 bg-current opacity-0 group-hover/icon:opacity-10 transition-opacity" />
              <div className="group-hover:scale-110 transition-transform duration-300 relative z-10 [&>svg]:h-5 [&>svg]:w-5">
                {icon}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="px-5 pb-5 relative z-10">
          <div className="text-3xl font-black tracking-tight text-[var(--text-primary)] italic drop-shadow-md leading-none font-mono">
            {value}
          </div>
          {(description || trend) && (
            <div className="mt-4 flex items-center gap-3">
              {trend && (
                  <div
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm transition-all duration-300 border",
                      trend.isPositive === true ? "text-[var(--status-healthy)]" : 
                      trend.isPositive === false ? "text-[var(--status-critical)]" : 
                      "bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                    )}
                    style={{
                      backgroundColor: trend.isPositive === true ? 'color-mix(in srgb, var(--status-healthy), transparent 90%)' : 
                                      trend.isPositive === false ? 'color-mix(in srgb, var(--status-critical), transparent 90%)' : undefined,
                      borderColor: trend.isPositive === true ? 'color-mix(in srgb, var(--status-healthy), transparent 80%)' : 
                                   trend.isPositive === false ? 'color-mix(in srgb, var(--status-critical), transparent 80%)' : undefined,
                    }}
                  >
                  <span className="text-xs leading-none">{trend.isPositive ? '↑' : trend.isPositive === false ? '↓' : ''}</span>
                  {Math.abs(trend.value)}%
                </div>
              )}
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors italic leading-tight flex-1">
                {description || trend?.label}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
