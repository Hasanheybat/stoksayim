import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiAdm from '../lib/apiAdm';

const useAuthStoreAdm = create(
  persist(
    (set) => ({
      kullanici: null,
      yukleniyor: true,

      setKullanici: (kullanici) => set({ kullanici }),

      oturumKontrol: async () => {
        set({ yukleniyor: true });
        const token = localStorage.getItem('stoksay-adm-token');

        if (!token) {
          set({ kullanici: null, yukleniyor: false });
          return;
        }

        try {
          const { data } = await apiAdm.get('/auth/me');
          set({ kullanici: data.kullanici, yukleniyor: false });
        } catch (err) {
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('stoksay-adm-token');
            set({ kullanici: null, yukleniyor: false });
          } else {
            set({ yukleniyor: false });
          }
        }
      },

      cikisYap: async () => {
        localStorage.removeItem('stoksay-adm-token');
        set({ kullanici: null });
      }
    }),
    {
      name: 'stoksay-adm-auth',
      partialize: (state) => ({ kullanici: state.kullanici })
    }
  )
);

export default useAuthStoreAdm;
