import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Her istekte localStorage'daki token'ı header'a ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stoksay-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Hata yönetimi
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('stoksay-token');
      window.location.href = '/app-login';
    }
    return Promise.reject(err);
  }
);

export default api;
