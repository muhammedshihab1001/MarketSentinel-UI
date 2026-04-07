import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DriftState } from '@/types';
import { useAuthStore } from './authStore';

interface ModelStore {
  version: string | null;
  artifactHash: string | null;
  schemaSignature: string | null;
  setModelMeta: (meta: { version: string, artifactHash: string, schemaSignature: string }) => void;
}

interface PortfolioStore {
  healthScore: number | null;
  driftState: DriftState | null;
  longCount: number;
  shortCount: number;
  setPortfolioMeta: (meta: { healthScore: number, driftState: DriftState, longCount: number, shortCount: number }) => void;
}

interface UIStore {
  selectedTicker: string | null;
  setSelectedTicker: (ticker: string | null) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

type AppState = ModelStore & PortfolioStore & UIStore;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // --- Model Store ---
      version: null,
      artifactHash: null,
      schemaSignature: null,
      setModelMeta: (meta) => set({ 
        version: meta.version, 
        artifactHash: meta.artifactHash,
        schemaSignature: meta.schemaSignature
      }),

      // --- Portfolio Store ---
      healthScore: null,
      driftState: null,
      longCount: 0,
      shortCount: 0,
      setPortfolioMeta: (meta) => set({
        healthScore: meta.healthScore,
        driftState: meta.driftState,
        longCount: meta.longCount,
        shortCount: meta.shortCount
      }),

      // --- UI Store ---
      selectedTicker: 'NVDA', // Default for showcase
      setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      get isAuthenticated() {
        return useAuthStore.getState().role !== null;
      },
      logout: () => {
        // Auth is cookie-based, state is managed in authStore
      },
    }),
    {
      name: 'market-sentinel-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist UI settings so session state is maintained across reloads
        theme: state.theme,
        selectedTicker: state.selectedTicker,
        sidebarOpen: state.sidebarOpen,
        // (API Keys usually aren't stored in Zustand, kept strictly in LocalStorage bypassing React for security)
      }),
    }
  )
);

