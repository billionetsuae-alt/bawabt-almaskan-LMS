import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  getCurrentUser: () => api.get('/api/auth/me'),
  changePassword: (data) => api.post('/api/auth/change-password', data),
};

// Employee API
export const employeeAPI = {
  getAll: () => api.get('/api/employees'),
  getOne: (id) => api.get(`/api/employees/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/api/employees', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/api/employees', data);
  },
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/api/employees/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/api/employees/${id}`, data);
  },
  downloadIdProof: (id) =>
    api.get(`/api/employees/${id}/id-proof/file`, {
      responseType: 'blob',
    }),
  delete: (id) => api.delete(`/api/employees/${id}`),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params) => api.get('/api/attendance', { params }),
  markOne: (data) => api.post('/api/attendance', data),
  markBulk: (data) => api.post('/api/attendance/bulk', data),
  update: (id, data) => api.put(`/api/attendance/${id}`, data),
  approve: (id) => api.post(`/api/attendance/${id}/approve`),
  delete: (id) => api.delete(`/api/attendance/${id}`),
};

// Site API
export const siteAPI = {
  getAll: () => api.get('/api/sites'),
  getOne: (id) => api.get(`/api/sites/${id}`),
  create: (data) => api.post('/api/sites', data),
  update: (id, data) => api.put(`/api/sites/${id}`, data),
  delete: (id) => api.delete(`/api/sites/${id}`),
};

// Site Expense API
export const siteExpenseAPI = {
  getAll: (params) => api.get('/api/site-expenses', { params }),
  create: (data) => api.post('/api/site-expenses', data),
};

// Payroll API
export const payrollAPI = {
  calculate: (year, month) => api.get(`/api/payroll/${year}/${month}`),
  calculateMonthly: (year, month) => api.get(`/api/payroll/${year}/${month}`),
  getSummary: (params) => api.get('/api/payroll/summary', { params }),
};

// Audit API
export const auditAPI = {
  getLogs: (params) => api.get('/api/audit', { params }),
};

// Backup API
export const backupAPI = {
  create: () => api.post('/api/backup/create'),
  list: (limit) => api.get('/api/backup/list', { params: { limit } }),
  getDetails: (id) => api.get(`/api/backup/${id}`),
  delete: (id) => api.delete(`/api/backup/${id}`),
  restore: (id) => api.post(`/api/backup/${id}/restore`),
  cleanup: (keepCount) => api.post('/api/backup/cleanup', null, { params: { keepCount } }),
  getSchedulerStatus: () => api.get('/api/backup/scheduler/status'),
  enableScheduler: (frequency) => api.post('/api/backup/scheduler/enable', { frequency }),
  disableScheduler: () => api.post('/api/backup/scheduler/disable'),
};

export default api;
