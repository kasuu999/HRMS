import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/register-tenant'
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post('/api/auth/refresh-token', { refreshToken });
          if (res.data && res.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (form) => api.post('/auth/register-tenant', form),
  login: (form) => api.post('/auth/login', form),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const employeeAPI = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (form) => api.post('/employees', form),
  update: (id, form) => api.put(`/employees/${id}`, form),
  departments: () => api.get('/employees/org/departments'),
  designations: () => api.get('/employees/org/designations'),
  locations: () => api.get('/employees/org/locations'),
};

export const attendanceAPI = {
  today: () => api.get('/attendance/today'),
  list: (params) => api.get('/attendance', { params }),
  punch: (payload) => api.post('/attendance/punch', payload),
  regularize: (payload) => api.post('/attendance/regularize', payload),
  approveRegularize: (id, payload) => api.put(`/attendance/regularize/${id}/approve`, payload),
};

export const leaveAPI = {
  balance: () => api.get('/leave/balance'),
  list: (params) => api.get('/leave', { params }),
  apply: (payload) => api.post('/leave/apply', payload),
  cancel: (id, payload) => api.put(`/leave/${id}/cancel`, payload),
  types: () => api.get('/leave/types'),
  approve: (id, payload) => api.put(`/leave/${id}/approve`, payload),
};

export const workflowAPI = {
  pending: () => api.get('/workflow/pending'),
};

export const reportAPI = {
  headcount: () => api.get('/reports/headcount'),
  attendanceSummary: (params) => api.get('/reports/attendance-summary', { params }),
  leaveUtilization: (params) => api.get('/reports/leave-utilization', { params }),
};

export const aiAPI = {
  chat: (message, history) => api.post('/ai/chat', { message, conversationHistory: history }),
  search: (query) => api.post('/ai/search', { query }),
  summary: (employeeId) => api.get(`/ai/summary/${employeeId}`),
};

export default api;
