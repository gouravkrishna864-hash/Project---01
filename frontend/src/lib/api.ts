import axios, { AxiosInstance, AxiosError } from 'axios';
import { SearchFilters, Property, Lead, Transaction, User, ApiResponse, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('reos_access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('reos_refresh_token');
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
            localStorage.setItem('reos_access_token', data.data.accessToken);
            localStorage.setItem('reos_refresh_token', data.data.refreshToken);
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
              return client.request(error.config);
            }
          } catch {
            localStorage.removeItem('reos_access_token');
            localStorage.removeItem('reos_refresh_token');
            window.location.href = '/login';
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

const api = createClient();

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; phone: string; password: string; role?: string; city?: string }) =>
    api.post('/auth/register', data),

  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (typeof window !== 'undefined') {
      localStorage.setItem('reos_access_token', res.data.data.accessToken);
      localStorage.setItem('reos_refresh_token', res.data.data.refreshToken);
    }
    return res.data.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('reos_access_token');
      localStorage.removeItem('reos_refresh_token');
    }
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: (): Promise<ApiResponse<User>> => api.get('/users/me').then((r) => r.data),
  updateMe: (data: Partial<User>) => api.put('/users/me', data).then((r) => r.data),
};

// ─── Properties ───────────────────────────────────────────────────────────────
export const propertiesApi = {
  list: (filters: SearchFilters = {}): Promise<PaginatedResponse<Property>> =>
    api.get('/properties', { params: filters }).then((r) => r.data),

  get: (id: string): Promise<ApiResponse<Property>> =>
    api.get(`/properties/${id}`).then((r) => r.data),

  create: (data: Partial<Property>) =>
    api.post('/properties', data).then((r) => r.data),

  update: (id: string, data: Partial<Property>) =>
    api.put(`/properties/${id}`, data).then((r) => r.data),

  getRecommendations: (): Promise<ApiResponse<Property[]>> =>
    api.get('/properties/recommendations').then((r) => r.data),

  getPriceTrend: (params: { city: string; type?: string; bedrooms?: number }) =>
    api.get('/properties/price-trend', { params }).then((r) => r.data),
};

// ─── Leads ────────────────────────────────────────────────────────────────────
export const leadsApi = {
  create: (data: { property_id: string; budget?: number; source?: string }) =>
    api.post('/leads', data).then((r) => r.data),

  getBrokerLeads: (params?: { status?: string; priority?: string; page?: number }) =>
    api.get('/leads/broker', { params }).then((r) => r.data),

  updateStatus: (id: string, data: { status: string; notes?: string; follow_up_date?: string }) =>
    api.patch(`/leads/${id}/status`, data).then((r) => r.data),

  getStats: () => api.get('/leads/stats').then((r) => r.data),
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionsApi = {
  makeOffer: (data: { property_id: string; offer_price: number; notes?: string }) =>
    api.post('/transactions/offer', data).then((r) => r.data),

  getMyTransactions: (): Promise<ApiResponse<Transaction[]>> =>
    api.get('/transactions/my').then((r) => r.data),

  update: (id: string, data: Partial<Transaction>) =>
    api.patch(`/transactions/${id}`, data).then((r) => r.data),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
const AI_BASE = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

export const aiApi = {
  parseSearch: (query: string) =>
    axios.post(`${AI_BASE}/search/parse`, { query }).then((r) => r.data),

  getPriceTrend: (params: { city: string; locality?: string; type?: string; bedrooms?: number }) =>
    axios.get(`${AI_BASE}/price-trend`, { params }).then((r) => r.data),
};

export default api;
