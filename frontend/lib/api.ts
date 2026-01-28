import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth API
export const authAPI = {
  googleLogin: async (data: { email: string; name: string; avatar: string; googleId: string }) => {
    const response = await api.post('/api/auth/google', data);
    return response.data;
  },
  verifyToken: async () => {
    const response = await api.get('/api/auth/verify');
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Email API
export const emailAPI = {
  scheduleEmail: async (data: {
    subject: string;
    body: string;
    recipients: string[];
    scheduledAt?: string;
    delayBetweenEmails?: number;
    hourlyLimit?: number;
  }) => {
    const response = await api.post('/api/emails/schedule', data);
    return response.data;
  },
  getScheduledEmails: async (userId: string) => {
    const response = await api.get(`/api/emails/scheduled/${userId}`);
    return response.data;
  },
  getSentEmails: async (userId: string) => {
    const response = await api.get(`/api/emails/sent/${userId}`);
    return response.data;
  },
  getStats: async (userId: string) => {
    const response = await api.get(`/api/emails/stats/${userId}`);
    return response.data;
  },
  cancelEmail: async (id: string) => {
    const response = await api.delete(`/api/emails/${id}`);
    return response.data;
  },
};
