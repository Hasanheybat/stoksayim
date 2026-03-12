import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: '/api'
});

// Her istekte Supabase token'ını header'a ekle
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Hata yönetimi
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      supabase.auth.signOut();
      window.location.href = '/app-login';
    }
    return Promise.reject(err);
  }
);

export default api;
