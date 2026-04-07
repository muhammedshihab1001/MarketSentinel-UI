import axios, { AxiosError } from 'axios';
import type { Top5RationaleItem } from '@/types';

// --- Dedicated Error Type for Demo Lock ---
export class DemoLockedError extends Error {
  feature: string;
  usage: any;
  resetInSeconds: number;

  constructor(data: any) {
    super(data.message || 'Feature locked in demo mode');
    this.name = 'DemoLockedError';
    this.feature = data.feature;
    this.usage = data.usage;
    this.resetInSeconds = data.reset_in_seconds || 0;
  }
}

export class OwnerOnlyError extends Error {
  status: number;
  constructor(message = 'Owner access required') {
    super(message);
    this.name = 'OwnerOnlyError';
    this.status = 403;
  }
}

// In development: VITE_API_BASE_URL is unset → falls back to '/api' → Vite dev proxy forwards to localhost:8000
// In production:  VITE_API_BASE_URL = 'https://your-backend.example.com' → direct HTTPS calls
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`
  : '/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Required for httpOnly cookies
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
});

api.interceptors.response.use(
  (response) => {
    // Check for specific demo_locked structure in 200 responses
    if (response.data?.demo_locked) {
      import('sonner').then(({ toast }) => {
        toast.warning(
          `Demo limit reached for ${response.data.feature}. ${response.data.message || 'Upgrade for full access.'}`,
          { duration: 5000 }
        );
        if (response.data.usage?.fully_locked) {
          window.location.href = '/demo';
        }
      });
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().updateUsage(response.data.usage);
      });
      throw new DemoLockedError(response.data);
    }

    const featurePaths = [
      '/snapshot', '/predict/live-snapshot', '/portfolio',
      '/drift', '/performance', '/agent/explain',
      '/agent/political-risk', '/equity', '/model/feature-importance'
    ];
    
    if (response.config?.url && featurePaths.some(path => response.config.url?.startsWith(path))) {
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().refreshUsage();
      });
    }

    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status || 'Network Error';
    const message = (error.response?.data as any)?.error || error.message;
    
    if (status === 403) {
      throw new OwnerOnlyError(typeof message === 'string' ? message : 'Owner access required');
    }
    
    // Convert to a more readable error
    const customError = new Error(typeof message === 'string' ? message : 'internal_server_error');
    (customError as any).status = status;
    
    throw customError;
  }
);

// --- Auth & Demo Interfaces ---

export interface AuthMeResponse {
  authenticated: boolean;
  role: 'owner' | 'demo' | null;
  username?: string;
  usage?: {
    features: Record<string, { used: number; limit: number; remaining: number; locked: boolean }>;
    fully_locked: boolean;
    reset_in_seconds: number;
    limit_per_feature: number;
  };
}

// --- Snapshot & Prediction Interfaces ---

export interface SnapshotSignal {
  ticker: string;
  date: string;
  raw_model_score: number;
  hybrid_consensus_score: number;
  weight: number;
}

export interface SnapshotResponse {
  metadata: {
    model_version: string;
    universe_size: number;
    long_signals: number;
    short_signals: number;
    avg_hybrid_score: number;
    drift_state: 'none' | 'soft' | 'hard';
    latency_ms: number;
    timestamp: number;
  };
  executive_summary: {
    top_5_tickers: string[];
    top_5_rationale?: Top5RationaleItem[];   // pipeline v5.9+
    portfolio_bias: string;
    risk_regime: string;
    gross_exposure?: number;
    net_exposure?: number;
  };
  snapshot: {
    snapshot_date: string;
    model_version: string;
    gross_exposure?: number;
    net_exposure?: number;
    drift: {
      drift_detected: boolean;
      severity_score: number;
      drift_state: 'none' | 'soft' | 'hard';
      exposure_scale: number;
      drift_confidence: number;
    };
    signals: SnapshotSignal[];
  };
}

// --- Portfolio & Drift Interfaces ---

export interface PortfolioResponse {
  snapshot_date: string;
  gross_exposure: number;
  net_exposure: number;
  long_count: number;
  short_count: number;
  neutral_count: number;
  approved_trades: number;
  rejected_trades: number;
  drift_detected: boolean;
  drift_state: string;
  portfolio_health_score: number;
  positions: Array<{ ticker: string; weight: number; signal: string }>;
  top_5_preview: Array<{ ticker: string; score: number; weight: number }>;
}

export interface DriftResponse {
  drift_detected: boolean;
  severity_score: number;
  drift_state: 'none' | 'soft' | 'hard' | 'baseline_missing';
  exposure_scale: number;
  retrain_required: boolean;
  cooldown_active: boolean;
  cooldown_remaining_seconds: number;
  baseline_exists: boolean;
  model_version: string;
  served_from_cache: boolean;
  latency_ms: number;
}

// --- Health & Model Interfaces ---

export interface HealthReadyResponse {
  ready: boolean;
  models_loaded: boolean;
  redis_connected: boolean;
  db_connected: boolean;
  data_synced: boolean;
  model_version: string;
  uptime_seconds: number;
  artifact_hash: string;
  drift_baseline_loaded?: boolean;  // optional — present on some backend versions
}


export interface ModelInfoResponse {
  model_version: string;
  schema_signature: string;
  artifact_hash: string;
  dataset_hash: string;
  training_code_hash: string;
  feature_checksum: string;
  feature_count: number;
}

// --- Performance & Agent Interfaces ---

export interface PerformanceMetrics {
  cumulative_return: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_drawdown: number;
  volatility_ann: number;
  win_rate: number;
}

export interface PerformanceResponse {
  tickers_requested: number;
  tickers_computed: number;
  lookback_days: number;
  data_source: string;
  metrics: PerformanceMetrics;
}

export interface AgentExplainResponse {
  success: boolean;
  data: {
    ticker: string;
    snapshot_date: string;
    raw_model_score: number;
    weight: number;
    hybrid_consensus_score: number;
    signal: 'LONG' | 'SHORT' | 'NEUTRAL' | null;
    confidence_numeric: number | null;
    governance_score: number | null;
    risk_level: string | null;
    volatility_regime: string | null;
    technical_bias: string | null;
    drift_state: string;
    warnings: string[];
    explanation: string;
    llm: {
      llm_enabled: boolean;
      model: string;
      structured: {
        summary: string;
        rationale: string;
        risk_commentary: string;
        outlook: string;
      };
    } | null;
  };
}

// --- API Functions ---

export const authApi = {
  loginOwner: (payload: any) => api.post('/auth/owner-login', payload),
  loginDemo: () => api.post('/auth/demo-login'),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<AuthMeResponse>('/auth/me'),
};

export const predictionApi = {
  getSnapshot: async () => {
    const { data } = await api.post<SnapshotResponse>('/snapshot');
    return data;
  },
  getLiveSnapshot: async () => {
    const { data } = await api.get<SnapshotResponse>('/predict/live-snapshot');
    return data;
  },
  getSignalExplanation: async (ticker: string) => {
    const { data } = await api.get(`/predict/signal-explanation/${ticker}`);
    return data;
  },
  getPriceHistory: async (ticker: string, days = 90) => {
    const { data } = await api.get(`/predict/price-history/${ticker}?days=${days}`);
    return data;
  },
};

export const portfolioApi = {
  getPortfolio: async () => {
    const { data } = await api.get<PortfolioResponse>('/portfolio');
    return data;
  },
  getSummary: async () => {
    const { data } = await api.get<PortfolioResponse>('/portfolio-summary');
    return data;
  },
};

export const driftApi = {
  getDrift: async () => {
    const { data } = await api.get<DriftResponse>('/drift');
    return data;
  },
  getStatus: async () => {
    const { data } = await api.get<DriftResponse>('/drift-status');
    return data;
  },
};

export const equityApi = {
  getEquity: async (ticker: string) => {
    const { data } = await api.get(`/equity/${ticker}`);
    return data;
  },
  getHistory: async (ticker: string, days = 90) => {
    const { data } = await api.get(`/equity/${ticker}/history?days=${days}`);
    return data;
  },
};

export const performanceApi = {
  getPerformance: async (tickers?: string, days = 252) => {
    const url = tickers ? `/performance?tickers=${tickers}&days=${days}` : `/performance?days=${days}`;
    const { data } = await api.get<PerformanceResponse>(url);
    return data;
  },
  getTickerPerformance: async (ticker: string, days = 252) => {
    const { data } = await api.get(`/performance/${ticker}?days=${days}`);
    return data;
  },
};

export const modelApi = {
  getInfo: async () => {
    const { data } = await api.get<ModelInfoResponse>('/model/info');
    return data;
  },
  getFeatureImportance: async () => {
    const { data } = await api.get('/model/feature-importance');
    return data;
  },
  getDiagnostics: async () => {
    const { data } = await api.get('/model/diagnostics');
    return data;
  },
};

export const healthApi = {
  getReady: async () => {
    const { data } = await api.get<HealthReadyResponse>('/health/ready');
    return data;
  },
  getDb: async () => {
    const { data } = await api.get('/health/db');
    return data;
  },
  getLive: async () => {
    const { data } = await api.get('/health/live');
    return data;
  },
  getModel: async () => {
    const { data } = await api.get('/health/model');
    return data;
  },
};

export const agentApi = {
  explain: async (ticker: string) => {
    const { data } = await api.get<AgentExplainResponse>(`/agent/explain?ticker=${ticker}`);
    return data;
  },
  getAgents: async () => {
    const { data } = await api.get('/agent/agents');
    return data;
  },
  getPoliticalRisk: async (ticker: string) => {
    const { data } = await api.get(`/agent/political-risk?ticker=${ticker}`);
    return data;
  },
};

export const universeApi = {
  getUniverse: async () => {
    const { data } = await api.get('/universe');
    return data;
  },
};
