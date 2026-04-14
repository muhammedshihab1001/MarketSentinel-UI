import { create } from 'zustand';

let refreshUsageTimeout: ReturnType<typeof setTimeout> | null = null;

interface FeatureUsage {
  used: number;
  limit: number;
  remaining: number;
  locked: boolean;
}

interface UsageState {
  features: Record<string, FeatureUsage>;
  fully_locked: boolean;
  reset_in_seconds: number;
  limit_per_feature: number;
}

interface AuthState {
  role: 'owner' | 'demo' | null;
  username: string | null;
  usage: UsageState | null;
  fullyLocked: boolean;
  resetInSeconds: number;
  initialized: boolean;

  // Actions
  setAuth: (
    role: 'owner' | 'demo' | null,
    username: string | null,
    usage: UsageState | null
  ) => void;
  updateUsage: (usage: UsageState) => void;
  logout: () => void;
  isFeatureLocked: (feature: string) => boolean;
  setInitialized: (val: boolean) => void;
  refreshUsage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  role: null,
  username: null,
  usage: null,
  fullyLocked: false,
  resetInSeconds: 0,
  initialized: false,

  setAuth: (role, username, usage) => {
    const defaultUsage = {
      features: {},
      fully_locked: false,
      reset_in_seconds: 604800,
      limit_per_feature: 10
    };
    const safeUsage = usage || defaultUsage;
    set({
      role,
      username,
      usage: safeUsage,
      resetInSeconds: safeUsage?.reset_in_seconds || 0,
      fullyLocked: safeUsage?.fully_locked || false,
      initialized: true,
    });
  },

  updateUsage: (usage) => {
    set({ 
      usage,
      fullyLocked: usage.fully_locked,
      resetInSeconds: usage.reset_in_seconds,
    });
  },

  logout: () => {
    set({
      role: null,
      username: null,
      usage: null,
      fullyLocked: false,
      resetInSeconds: 0,
    });
  },

  isFeatureLocked: (feature: string) => {
    const { role, usage, fullyLocked } = get();
    if (role === 'owner') return false;
    if (fullyLocked) return true;
    if (!usage) return false;
    
    // Check if the specific feature is locked
    return usage?.features?.[feature]?.locked || false;
  },

  refreshUsage: async () => {
    if (refreshUsageTimeout) clearTimeout(refreshUsageTimeout);
    return new Promise<void>((resolve) => {
      refreshUsageTimeout = setTimeout(async () => {
        try {
          const { authApi } = await import('../lib/api');
          const { data } = await authApi.me();
          if (data?.authenticated === false) {
            get().logout();
            return;
          }
          if (data?.usage) {
            get().updateUsage(data.usage);
          }
        } catch (error: any) {
          if (error?.status === 401 || error?.response?.status === 401) {
            get().logout();
          }
          // Non-401 refresh failures are silently ignored — session remains valid
        }
        resolve();
      }, 500); // 500ms — was 2000ms, caused stale quota display in DemoBanner
    });
  },

  setInitialized: (val: boolean) => set({ initialized: val }),
}));
