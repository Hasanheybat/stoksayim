import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  kullanici: JSON.parse(localStorage.getItem('stoksay-user') || 'null'),
  token: localStorage.getItem('stoksay-token') || null,
  yukleniyor: true,

  setKullanici: (k) => {
    localStorage.setItem('stoksay-user', JSON.stringify(k));
    set({ kullanici: k });
  },

  oturumKontrol: async () => {
    const token = localStorage.getItem('stoksay-token');
    if (!token) { set({ yukleniyor: false }); return; }
    try {
      const { data } = await api.get('/auth/me');
      const k = data.kullanici;
      k.yetkilerMap = data.yetkilerMap;
      localStorage.setItem('stoksay-user', JSON.stringify(k));
      set({ kullanici: k, token, yukleniyor: false });
    } catch {
      localStorage.removeItem('stoksay-token');
      localStorage.removeItem('stoksay-user');
      set({ kullanici: null, token: null, yukleniyor: false });
    }
  },

  girisYap: async (email, sifre) => {
    const { data } = await api.post('/auth/login', { email, sifre });
    localStorage.setItem('stoksay-token', data.token);
    localStorage.setItem('stoksay-user', JSON.stringify(data.kullanici));
    set({ kullanici: data.kullanici, token: data.token });
    return data;
  },

  cikisYap: () => {
    localStorage.removeItem('stoksay-token');
    localStorage.removeItem('stoksay-user');
    set({ kullanici: null, token: null });
  },
}));

export default useAuthStore;
