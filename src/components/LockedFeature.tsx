import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LockedFeatureProps {
  featureName: string;
  resetInSeconds?: number;
  className?: string;
}

export default function LockedFeature({ featureName, resetInSeconds: propResetSeconds, className = "" }: LockedFeatureProps) {
  const { resetInSeconds: storeResetSeconds } = useAuthStore();
  
  const initialTime = propResetSeconds ?? (storeResetSeconds > 0 ? storeResetSeconds : 604800);
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (propResetSeconds !== undefined) setTimeLeft(propResetSeconds);
  }, [propResetSeconds]);

  useEffect(() => {
    if (propResetSeconds === undefined && storeResetSeconds > 0) setTimeLeft(storeResetSeconds);
  }, [storeResetSeconds, propResetSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className={`flex items-center justify-center py-12 px-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <Card className="border border-rose-500/20 bg-rose-500/5 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />
          <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
            
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <Lock className="w-6 h-6 text-rose-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                Demo Limit Reached
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                {
                  (() => {
                    const featureNames: Record<string, string> = {
                      agent: 'AI Analysis',
                      drift: 'Stability Monitor',
                      signals: 'Market Signals',
                      strategy: 'Performance Backtest',
                      snapshot: 'System Status',
                      universe: 'Market Universe'
                    };
                    const displayName = featureNames[featureName] || featureName.replace(/_/g, ' ');
                    return (
                      <>
                        You have reached the preview quota for the <strong>{displayName}</strong> module.
                      </>
                    );
                  })()
                }
              </p>
            </div>

            <div className="w-full p-4 bg-black/40 border border-white/5 rounded-xl">
               <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Time until reset</p>
               <p className="text-2xl font-mono font-bold text-rose-400">
                  {formatTime(timeLeft)}
               </p>
            </div>

            <div className="flex flex-col gap-3 w-full pt-2">
              <Button 
                variant="outline" 
                className="w-full bg-transparent border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 rounded-xl" 
                asChild
              >
                <Link to="/demo">
                  Go to Profile
                </Link>
              </Button>
              <Button 
                className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl gap-2 font-semibold"
                onClick={() => window.open('https://linkedin.com/in/muhammedshihabp', '_blank')}
              >
                <Zap className="w-4 h-4" />
                Upgrade Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
