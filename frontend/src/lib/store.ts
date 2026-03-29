import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, SearchFilters } from '@/types';
import { usersApi } from './api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      setUser: (user) => set({ user }),

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const res = await usersApi.getMe();
          set({ user: res.data, isLoading: false });
        } catch {
          set({ user: null, isLoading: false });
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('reos_access_token');
          localStorage.removeItem('reos_refresh_token');
        }
        set({ user: null });
      },
    }),
    { name: 'reos-auth', partialize: (state) => ({ user: state.user }) }
  )
);

interface SearchState {
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  nlpQuery: string;
  setNlpQuery: (q: string) => void;
}

const defaultFilters: SearchFilters = { listing_type: 'sale', page: 1 };

export const useSearchStore = create<SearchState>()((set) => ({
  filters: defaultFilters,
  nlpQuery: '',

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters, page: 1 } })),

  resetFilters: () => set({ filters: defaultFilters, nlpQuery: '' }),

  setNlpQuery: (nlpQuery) => set({ nlpQuery }),
}));
