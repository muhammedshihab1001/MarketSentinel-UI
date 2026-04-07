/**
 * TanStack Query cache keys for the MarketSentinel ecosystem.
 */
export const QUERY_KEYS = {
  AUTH_ME: ['auth', 'me'] as const,
  SNAPSHOT: ['snapshot'] as const,
  HEALTH_READY: ['health', 'ready'] as const,
  HEALTH_DB: ['health', 'db'] as const,
  HEALTH_LIVE: ['health', 'live'] as const,
  HEALTH_MODEL: ['health', 'model'] as const,
  UNIVERSE: ['universe'] as const,
  PORTFOLIO: ['portfolio'] as const,
  DRIFT: ['drift'] as const,
  DRIFT_STATUS: ['drift', 'status'] as const,
  EQUITY: (ticker: string) => ['equity', ticker] as const,
  EQUITY_HISTORY: (ticker: string) => ['equity', 'history', ticker] as const,
  PERFORMANCE: (tickers?: string) => ['performance', tickers || 'all'] as const,
  TICKER_PERFORMANCE: (ticker: string) => ['performance', ticker] as const,
  MODEL_INFO: ['model', 'info'] as const,
  MODEL_FEATURES: ['model', 'features'] as const,
  MODEL_DIAGNOSTICS: ['model', 'diagnostics'] as const,
  AGENT_EXPLAIN: (ticker: string) => ['agent', 'explain', ticker] as const,
  AGENT_LIST: ['agent', 'list'] as const,
  POLITICAL_RISK: (ticker: string) => ['agent', 'political-risk', ticker] as const,
};

/**
 * Polling and staleness constants (ms).
 * As requested in ORDER OF OPERATIONS.
 */
export const INTERVALS = {
  SNAPSHOT: 120_000,    // 2 minutes
  HEALTH: 30_000,       // 30 seconds
  DRIFT: 120_000,       // 2 minutes
  PORTFOLIO: 120_000,   // 2 minutes
  UNIVERSE: 300_000,    // 5 minutes
  PERFORMANCE: 300_000, // 5 minutes
  MODEL_INFO: Infinity, // never refetch
  AUTH_ME: 60_000,      // 1 minute
  AGENT_EXPLAIN: 300_000, // 5 minutes
} as const;
