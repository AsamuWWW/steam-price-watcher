/// <reference types="vite/client" />
import type { ApiResponse } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        ok: false,
        data: null as T,
        error: errorData.message || `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      ok: false,
      data: null as T,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export const api = {
  // Health
  health: () => request('/health'),

  // Games
  searchGames: (keyword: string, limit = 20) =>
    request(`/games/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`),

  // Watchlist
  getWatchlist: () => request('/watchlist'),
  createWatch: (data: {
    steamAppId: number;
    name: string;
    discountThreshold?: number;
    priceThresholdEnabled?: boolean;
    priceThresholdCents?: number;
  }) =>
    request('/watchlist', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateWatch: (
    id: number,
    data: {
      enabled?: boolean;
      discountThreshold?: number;
      priceThresholdEnabled?: boolean;
      priceThresholdCents?: number;
    },
  ) =>
    request(`/watchlist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteWatch: (id: number) =>
    request(`/watchlist/${id}`, { method: 'DELETE' }),

  // Prices
  refreshPrice: (watchId: number) =>
    request(`/prices/refresh/${watchId}`, { method: 'POST' }),
  getPriceHistory: (gameId: number, days = 30) =>
    request(`/prices/history/${gameId}?days=${days}`),

  // Notifications
  getNotifications: () => request('/notifications'),
  markRead: (id: number) =>
    request(`/notifications/${id}/read`, { method: 'POST' }),

  // Admin
  getAdminOverview: () => request('/admin/overview'),
  triggerDaily: () => request('/admin/trigger-daily', { method: 'POST' }),
};
