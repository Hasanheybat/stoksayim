import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      kullanici:   null,
      yetkilerMap: {}, // { [isletme_id]: { urun:{...}, depo:{...}, ... } }
      yukleniyor:  true,

      setKullanici: (kullanici) => set({ kullanici }),

      oturumKontrol: async () => {
        set({ yukleniyor: true, yetkilerMap: {} });
        const token = localStorage.getItem('stoksay-token');

        if (!token) {
          set({ kullanici: null, yetkilerMap: {}, yukleniyor: false });
          return;
        }

        try {
          const { data } = await api.get('/auth/me');
          set({
            kullanici: data.kullanici,
            yetkilerMap: data.yetkilerMap || {},
            yukleniyor: false
          });
        } catch {
          localStorage.removeItem('stoksay-token');
          set({ kullanici: null, yetkilerMap: {}, yukleniyor: false });
        }
      },

      // Herhangi bir işletmede o yetki var mı?
      hasYetki: (kategori, islem) => {
        const { kullanici, yetkilerMap } = get();
        if (!kullanici) return false;
        if (kullanici.rol === 'admin') return true;
        return Object.values(yetkilerMap).some(y => y?.[kategori]?.[islem]);
      },

      // Belirli bir işletmede yetki var mı?
      isletmeYetkisi: (isletme_id, kategori, islem) => {
        const { kullanici, yetkilerMap } = get();
        if (!kullanici) return false;
        if (kullanici.rol === 'admin') return true;
        return !!yetkilerMap[isletme_id]?.[kategori]?.[islem];
      },

      cikisYap: async () => {
        localStorage.removeItem('stoksay-token');
        set({ kullanici: null, yetkilerMap: {} });
      }
    }),
    {
      name: 'stoksay-auth',
      version: 2,
      partialize: (state) => ({ kullanici: state.kullanici })
    }
  )
);

export default useAuthStore;
