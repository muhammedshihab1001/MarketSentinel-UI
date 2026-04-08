import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { 
  AuthMeResponse,
  SnapshotResponse, 
  PortfolioResponse, 
  DriftResponse, 
  HealthReadyResponse, 
  ModelInfoResponse, 
  PerformanceResponse, 
  AgentExplainResponse 
} from '@/types';

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
    // Check top-level or nested in usage object
    this.resetInSeconds = data.reset_in_seconds ?? data.usage?.reset_in_seconds ?? 0;
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

// Helper to map URL to feature for quota checking
const identifyFeatureFromUrl = (url?: string): string | null => {
  if (!url) return null;
  if (url.includes('/snapshot') || url.includes('/predict/live-snapshot')) return 'snapshot';
  if (url.includes('/portfolio')) return 'portfolio';
  if (url.includes('/drift')) return 'drift';
  if (url.includes('/performance')) return 'performance';
  if (url.includes('/agent/explain') || url.includes('/agent/political-risk') || url.includes('/predict/signal-explanation')) return 'agent';
  return null;
};

// --- Request Interceptor: Block calls to locked features ---
api.interceptors.request.use(async (config) => {
  const feature = identifyFeatureFromUrl(config.url);
  if (feature) {
    try {
      const { useAuthStore } = await import('../store/authStore');
      const isLocked = useAuthStore.getState().isFeatureLocked(feature);
      if (isLocked) {
        // Block the request locally
        throw new DemoLockedError({
          feature,
          message: 'Local quota check: Feature is currently locked. No request sent.',
          usage: useAuthStore.getState().usage
        });
      }
    } catch (err) {
      if (err instanceof DemoLockedError) throw err;
      // If store import fails, just let the request through
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Check for specific demo_locked structure in 200 responses
    if (response.data?.demo_locked) {
      const { feature, message, usage } = response.data;
      
      // Immediate toast notification
      const featureNames: Record<string, string> = {
        agent: 'AI Analysis',
        drift: 'Stability Monitor',
        signals: 'Market Signals',
        strategy: 'Performance Backtest',
        snapshot: 'System Status',
        universe: 'Market Universe'
      };
      const displayName = featureNames[feature] || feature;

      toast.warning(
        `Demo limit reached for ${displayName}. ${message || 'Upgrade for full access.'}`,
        { duration: 5000 }
      );

      // Handle redirect if fully locked
      if (usage?.fully_locked) {
        window.location.href = '/demo';
      }

      // Sync store (dynamic import to avoid circular dependency)
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().updateUsage(usage);
      }).catch(err => console.error('Store sync failed:', err));

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
    
    if (status === 401) {
      const requestUrl = error.config?.url ?? '';
      // Do not redirect on auth/me — it legitimately returns 401
      if (!requestUrl.includes('/auth/me') && !requestUrl.includes('/auth/owner-login')) {
        window.location.href = '/login';
      }
    }
    
    if (status === 403) {
      throw new OwnerOnlyError(typeof message === 'string' ? message : 'Owner access required');
    }
    
    // Convert to a more readable error
    const customError = new Error(typeof message === 'string' ? message : 'internal_server_error');
    (customError as any).status = status;
    
    throw customError;
  }
);

// Interfaces are now imported from @/types to avoid duplication.

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
