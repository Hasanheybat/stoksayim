import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabaseAdm } from '../lib/supabaseAdm';

const useAuthStoreAdm = create(
  persist(
    (set) => ({
      kullanici: null,
      yukleniyor: true,

      setKullanici: (kullanici) => set({ kullanici }),

      oturumKontrol: async () => {
        set({ yukleniyor: true });
        const { data: { session } } = await supabaseAdm.auth.getSession();

        if (session?.user) {
          const { data } = await supabaseAdm
            .from('kullanicilar')
            .select('id, ad_soyad, email, rol, aktif, ayarlar')
            .eq('id', session.user.id)
            .single();
          set({ kullanici: data, yukleniyor: false });
        } else {
          set({ kullanici: null, yukleniyor: false });
        }
      },

      cikisYap: async () => {
        await supabaseAdm.auth.signOut();
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
