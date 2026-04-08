import { cn } from '@/lib/utils';

interface ExplainProps {
  explanation: string;
  ticker: string;
  signal: string;
  governanceScore?: number | null;
  riskLevel?: string;
  volatilityRegime?: string;
  technicalBias?: string;
  driftState?: string;
  selectionReason?: string;
  inTop5?: boolean;
  agentsApproved?: string[];
  agentsFlagged?: string[];
  agentScores?: Record<string, number>;
  confidenceNumeric?: number | null;
}

// Parse the pipe-separated explanation string into parts
function parseExplanation(text: string) {
  const parts = text.split('|').map(p => p.trim());
  const result: Record<string, string> = {};

  parts.forEach((part, i) => {
    if (i === 0) {
      result.signal = part;
    } else if (part.includes('=')) {
      const [key, val] = part.split('=').map(s => s.trim());
      result[key] = val;
    }
  });

  return result;
}

// Convert raw score to plain English strength description
function scoreToWords(score: number): string {
  const abs = Math.abs(score);
  if (abs >= 1.5) return 'Very Strong';
  if (abs >= 1.0) return 'Strong';
  if (abs >= 0.5) return 'Moderate';
  if (abs >= 0.2) return 'Weak';
  return 'Negligible';
}

// Convert technical bias to industrial standard
function biasToWords(bias: string): string {
  if (bias === 'bullish') return 'Bullish';
  if (bias === 'bearish') return 'Bearish';
  return 'Neutral';
}

// Convert volatility regime to industrial standard
function volToWords(vol: string): string {
  if (vol === 'high_volatility') return 'High';
  if (vol === 'low_volatility') return 'Stable';
  return 'Normal';
}

// Convert risk level to industrial standard
function riskToWords(risk: string): string {
  if (risk === 'low') return 'Low';
  if (risk === 'moderate') return 'Moderate';
  if (risk === 'high') return 'High';
  if (risk === 'elevated') return 'Elevated';
  return risk.toUpperCase();
}

// Convert drift state to industrial standard
function driftToWords(drift: string): string {
  if (drift === 'soft') return 'Soft Drift (Weight Adjusted)';
  if (drift === 'hard') return 'Hard Drift (Recalibration Needed)';
  return 'No Drift Detected';
}

export function SignalExplanation({
  explanation,
  ticker,
  signal,
  governanceScore,
  riskLevel,
  volatilityRegime,
  technicalBias,
  driftState,
  selectionReason,
  inTop5,
  agentsApproved = [],
  agentsFlagged = [],
  confidenceNumeric,
}: ExplainProps) {
  const parsed = parseExplanation(explanation);

  const rawScore = parseFloat(parsed.score ?? '0');
  const techScore = parseFloat(parsed.tech ?? '0');
  const confValue = confidenceNumeric ?? parseFloat(parsed.conf ?? '0');

  const strength = scoreToWords(rawScore);
  const confPercent = confValue > 0 ? `${(confValue * 100).toFixed(0)}%` : null;

  return (
    <div className="space-y-6">

      {/* Analysis Rationale */}
      <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-cyan-500">
           <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
           </svg>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5">
          Analysis Rationale
        </p>
        <p className="text-lg text-white leading-relaxed font-bold tracking-tight">
          AI recommendation: {' '}
          <span className={cn(
            "drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]",
            signal === 'LONG' ? 'text-emerald-400' :
            signal === 'SHORT' ? 'text-rose-400' :
            'text-amber-400'
          )}>
            {signal === 'LONG' ? 'Buy / Long' : signal === 'SHORT' ? 'Sell / Short' : 'Neutral'}
          </span>{' '}
          for <span className="text-cyan-400">{ticker}</span>.
          <br/>
          Signal strength: <span className="text-cyan-500">{strength}</span> (Score: {rawScore.toFixed(2)}).
          {confPercent && (
            <div className="mt-2 text-sm text-slate-400 font-bold tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              Confidence: {confPercent}
            </div>
          )}
        </p>
      </div>

      {/* Technical Mapping */}
      <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden group">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5">
          Market Context
        </p>
        <div className="space-y-4 text-sm text-white font-bold leading-relaxed">
          <div className="flex items-center gap-4">
            <div className="h-px w-6 bg-cyan-500/30" />
            <p className="text-slate-400">Momentum: <span className="text-cyan-400">{biasToWords(technicalBias ?? 'neutral')}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-px w-6 bg-cyan-500/30" />
            <p className="text-slate-400">Volatility: <span className="text-cyan-400">{volToWords(volatilityRegime ?? 'normal')}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-px w-6 bg-cyan-500/30" />
            <p className="text-slate-400">Indicator alignment: <span className="text-cyan-400">{(techScore * 100).toFixed(0)}%</span></p>
          </div>
        </div>
      </div>

      {/* Risk Vectors */}
      <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden group">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5">
          Risk Factors
        </p>
        <div className="space-y-4 text-sm text-white font-bold leading-relaxed">
          <div className="flex items-center gap-4">
            <div className="h-px w-6 bg-rose-500/30" />
            <p className="text-slate-400">
              Risk Level: {' '}
              <span className={cn(
                riskLevel === 'low' ? 'text-emerald-400' :
                riskLevel === 'moderate' ? 'text-amber-400' :
                'text-rose-400'
              )}>
                {riskToWords(riskLevel ?? 'moderate')}
              </span>
            </p>
          </div>
          {governanceScore != null && (
            <div className="flex items-center gap-4">
              <div className="h-px w-6 bg-rose-500/30" />
              <p className="text-slate-400">Governance Score: <span className="text-cyan-400">{governanceScore}/100</span></p>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="h-px w-6 bg-rose-500/30" />
            <p className="text-slate-400">System Stability: <span className="text-white">{driftToWords(driftState ?? 'none')}</span></p>
          </div>
        </div>
      </div>

      {/* Agent Consensus Matrix */}
      {inTop5 && (agentsApproved.length > 0 || agentsFlagged.length > 0) && (
        <div className="p-8 rounded-[3rem] bg-gradient-to-br from-cyan-500/[0.05] to-transparent border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-cyan-500 pointer-events-none">
             <svg className="h-40 w-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
             </svg>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 mb-6 flex items-center gap-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            Agent agreement
          </p>

          <div className="space-y-4">
            {agentsApproved.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agentsApproved.map((agent, i) => (
                  <div key={i} className="flex flex-col gap-2 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                       <span className="text-xs font-bold text-white tracking-widest uppercase">{agent}</span>
                    </div>
                    <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest italic ml-5">{agentDescription(agent)}</p>
                  </div>
                ))}
              </div>
            )}

            {agentsFlagged.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agentsFlagged.map((agent, i) => (
                  <div key={i} className="flex flex-col gap-2 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                       <span className="text-xs font-bold text-white tracking-widest uppercase">{agent}</span>
                    </div>
                    <p className="text-[9px] font-bold text-rose-400/60 uppercase tracking-widest ml-5">Concern flagged</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selection Reasoning */}
      {inTop5 && selectionReason && (
        <div className="p-8 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl relative overflow-hidden group">
           <div className="absolute bottom-0 left-0 p-8 opacity-5 text-indigo-500 pointer-events-none transform rotate-180">
              <svg className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
           </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">
            Decision rationale
          </p>
          <div className="relative z-10 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
             <p className="text-base text-slate-400 leading-relaxed font-bold tracking-tight">
               "{selectionReason}"
             </p>
          </div>
        </div>
      )}

    </div>
  );
}

function agentDescription(agentName: string): string {
  const descriptions: Record<string, string> = {
    'SignalAgent': 'Data Analysis',
    'TechnicalRiskAgent': 'Momentum Validation',
    'PortfolioDecisionAgent': 'Allocation Scan',
    'PoliticalRiskAgent': 'Global Event Scan',
  };
  return descriptions[agentName] ?? 'Heuristic Check';
}
