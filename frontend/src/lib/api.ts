import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  refresh: () => api.post('/auth/refresh'),
};

// Users API
export const usersApi = {
  list: (params?: { page?: number; per_page?: number; search?: string; role?: string; status?: string }) =>
    api.get('/users', { params }),

  get: (id: number) => api.get(`/users/${id}`),

  create: (data: { name: string; email: string; password: string; role?: string; status?: string }) =>
    api.post('/users', data),

  update: (id: number, data: { name?: string; email?: string; password?: string; role?: string; status?: string }) =>
    api.put(`/users/${id}`, data),

  delete: (id: number) => api.delete(`/users/${id}`),

  assignRole: (id: number, role: string) =>
    api.post(`/users/${id}/assign-role`, { role }),
};

// Dashboard API
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
};

// Profile API
export const profileApi = {
  update: (data: { name?: string; email?: string; phone?: string }) =>
    api.put('/profile', data),

  changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    api.put('/profile/password', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.postForm('/profile/avatar', formData);
  },
};

// Settings API
export const settingsApi = {
  getAll: () => api.get('/settings'),
  getByGroup: (group: string) => api.get(`/settings/${group}`),
  update: (settings: Array<{ key: string; value: unknown; type?: string; group?: string }>) =>
    api.put('/settings', { settings }),
  updateSingle: (key: string, value: unknown, type?: string, group?: string) =>
    api.put(`/settings/${key}`, { value, type, group }),
};

// Admin Activity Logs API
export const adminActivityLogsApi = {
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    action?: string;
    user_id?: number;
    start_date?: string;
    end_date?: string;
  }) => api.get('/admin/activity-logs', { params }),

  stats: (days?: number) => api.get('/admin/activity-logs/stats', { params: { days } }),

  actions: () => api.get('/admin/activity-logs/actions'),
};

// Admin Moods API (view all users' moods)
export const adminMoodsApi = {
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    mood_type?: string;
    min_score?: number;
    max_score?: number;
    user_id?: number;
    start_date?: string;
    end_date?: string;
  }) => api.get('/admin/moods', { params }),

  get: (id: number) => api.get(`/admin/moods/${id}`),

  delete: (id: number) => api.delete(`/admin/moods/${id}`),

  stats: (days?: number) => api.get('/admin/moods/stats', { params: { days } }),
};

// Admin Tasks API (view all users' tasks)
export const adminTasksApi = {
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    category?: string;
    priority?: string;
    user_id?: number;
  }) => api.get('/admin/tasks', { params }),

  get: (id: number) => api.get(`/admin/tasks/${id}`),

  delete: (id: number) => api.delete(`/admin/tasks/${id}`),

  stats: (days?: number) => api.get('/admin/tasks/stats', { params: { days } }),
};

// Sounds API
export const soundsApi = {
  list: (params?: { type?: string; category?: string; free_only?: boolean }) =>
    api.get('/sounds', { params }),

  get: (key: string) => api.get(`/sounds/${key}`),

  create: (data: { key: string; name: string; name_en?: string; type: string; category: string; is_premium?: boolean; sort_order?: number }) =>
    api.post('/sounds', data),

  update: (key: string, data: { name?: string; name_en?: string; category?: string; is_premium?: boolean; is_active?: boolean; sort_order?: number }) =>
    api.put(`/sounds/${key}`, data),

  upload: async (key: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`${API_URL}/sounds/${key}/upload`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(errorData.message || `Upload failed with status ${res.status}`) as Error & { response?: { data: unknown; status: number } };
      error.response = { data: errorData, status: res.status };
      throw error;
    }
    return { data: await res.json() };
  },
};

// Admin Achievements API (view all users' achievements)
export const adminAchievementsApi = {
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    is_unlocked?: boolean;
    user_id?: number;
  }) => api.get('/admin/achievements', { params }),

  get: (id: number) => api.get(`/admin/achievements/${id}`),

  delete: (id: number) => api.delete(`/admin/achievements/${id}`),

  stats: (days?: number) => api.get('/admin/achievements/stats', { params: { days } }),

  categories: () => api.get('/admin/achievements/categories'),
};

// Admin Focus Sessions API (view all users' focus sessions)
export const adminFocusSessionsApi = {
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    was_completed?: boolean;
    user_id?: number;
    start_date?: string;
    end_date?: string;
    min_duration?: number;
  }) => api.get('/admin/focus-sessions', { params }),

  get: (id: number) => api.get(`/admin/focus-sessions/${id}`),

  delete: (id: number) => api.delete(`/admin/focus-sessions/${id}`),

  stats: (days?: number) => api.get('/admin/focus-sessions/stats', { params: { days } }),
};

// Admin Daily Login API (view all users' daily login rewards)
export const adminDailyLoginsApi = {
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    day_in_cycle?: number;
    user_id?: number;
    start_date?: string;
    end_date?: string;
    bonus_reward_given?: boolean;
  }) => api.get('/admin/daily-logins', { params }),

  progress: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    user_id?: number;
  }) => api.get('/admin/daily-logins/progress', { params }),

  delete: (id: number) => api.delete(`/admin/daily-logins/${id}`),

  stats: (days?: number) => api.get('/admin/daily-logins/stats', { params: { days } }),
};

export default api;
