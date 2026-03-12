import axios from 'axios';
import { supabaseAdm } from './supabaseAdm';

const apiAdm = axios.create({ baseURL: '/api' });

// Her istekte admin Supabase token'ını header'a ekle
apiAdm.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabaseAdm.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

apiAdm.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      supabaseAdm.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default apiAdm;
