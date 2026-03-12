import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      kullanici:   null,
      yetkilerMap: {}, // { [isletme_id]: { urun:{...}, depo:{...}, ... } }
      yukleniyor:  true,

      setKullanici: (kullanici) => set({ kullanici }),

      oturumKontrol: async () => {
        // Önce sıfırla — eski localStorage'dan kalan stale yetkilerMap'i temizle
        set({ yukleniyor: true, yetkilerMap: {} });
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data } = await supabase
            .from('kullanicilar')
            .select('id, ad_soyad, email, rol, aktif, ayarlar')
            .eq('id', session.user.id)
            .single();

          // Admin için yetkilerMap'e gerek yok
          let yetkilerMap = {};
          if (data && data.rol !== 'admin') {
            const { data: kisler } = await supabase
              .from('kullanici_isletme')
              .select('isletme_id, yetkiler')
              .eq('kullanici_id', session.user.id)
              .eq('aktif', true);
            // yetkiler null olan atamalar için varsayılan okuma yetkileri
            const varsayilanYetkiler = {
              urun:   { goruntule: true, ekle: false, duzenle: false, sil: false },
              depo:   { goruntule: true, ekle: false, duzenle: false, sil: false },
              barkod: { tanimla: false, duzenle: false, sil: false },
              sayim:  { goruntule: true, ekle: true,  duzenle: false, sil: false },
            };
            (kisler || []).forEach(ki => {
              yetkilerMap[ki.isletme_id] = ki.yetkiler || varsayilanYetkiler;
            });
          }

          set({ kullanici: data, yetkilerMap, yukleniyor: false });
        } else {
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
        await supabase.auth.signOut();
        set({ kullanici: null, yetkilerMap: {} });
      }
    }),
    {
      name: 'stoksay-auth',
      version: 2, // Eski yetkilerMap içeren localStorage'ı temizler
      partialize: (state) => ({ kullanici: state.kullanici })
    }
  )
);

export default useAuthStore;
