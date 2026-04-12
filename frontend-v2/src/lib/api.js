import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stoksay-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const lang = localStorage.getItem('stoksay-lang') || 'az';
  config.headers['Accept-Language'] = lang;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('stoksay-token');
      localStorage.removeItem('stoksay-user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
