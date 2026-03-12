const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const authGuard  = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');

router.use(authGuard, adminGuard);

// GET /api/stats — Dashboard için tek sorguda tüm sayılar
router.get('/', async (req, res) => {
  const [isletme, depo, kullanici, urun, sayimDevam, sayimTamamlandi] = await Promise.all([
    supabaseAdmin.from('isletmeler').select('*', { count: 'exact', head: true }).eq('aktif', true),
    supabaseAdmin.from('depolar').select('*', { count: 'exact', head: true }).eq('aktif', true),
    supabaseAdmin.from('kullanicilar').select('*', { count: 'exact', head: true }).eq('aktif', true),
    supabaseAdmin.from('isletme_urunler').select('*', { count: 'exact', head: true }).eq('aktif', true),
    supabaseAdmin.from('sayimlar').select('*', { count: 'exact', head: true }).eq('durum', 'devam'),
    supabaseAdmin.from('sayimlar').select('*', { count: 'exact', head: true }).eq('durum', 'tamamlandi'),
  ]);

  res.json({
    isletme:          isletme.count    || 0,
    depo:             depo.count       || 0,
    kullanici:        kullanici.count  || 0,
    urun:             urun.count       || 0,
    sayim_devam:      sayimDevam.count      || 0,
    sayim_tamamlandi: sayimTamamlandi.count || 0,
    sayim_toplam:     (sayimDevam.count || 0) + (sayimTamamlandi.count || 0),
  });
});

// GET /api/stats/sayim-trend — Son 6 ay aylık sayım sayıları
router.get('/sayim-trend', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('sayimlar')
    .select('durum, created_at')
    .neq('durum', 'silindi')
    .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data || []);
});

// GET /api/stats/isletme-sayimlar — Her işletmedeki sayım dağılımı (top 10)
router.get('/isletme-sayimlar', async (req, res) => {
  // Tüm tabloyu çekmek yerine sadece ihtiyaç duyulan sayıları topluyoruz
  const [devamRes, tamamRes] = await Promise.all([
    supabaseAdmin
      .from('sayimlar')
      .select('isletme_id, isletmeler(ad)', { count: 'exact' })
      .eq('durum', 'devam'),
    supabaseAdmin
      .from('sayimlar')
      .select('isletme_id, isletmeler(ad)', { count: 'exact' })
      .eq('durum', 'tamamlandi'),
  ]);

  if (devamRes.error) return res.status(500).json({ hata: devamRes.error.message });

  // Gruplama — her iki durum listesini birleştir
  const map = {};
  const ekle = (rows, durum) => {
    for (const s of (rows || [])) {
      const id = s.isletme_id;
      const ad = s.isletmeler?.ad || id;
      if (!map[id]) map[id] = { ad, toplam: 0, devam: 0, tamamlandi: 0 };
      map[id].toplam++;
      map[id][durum]++;
    }
  };
  ekle(devamRes.data, 'devam');
  ekle(tamamRes.data, 'tamamlandi');

  const sonuc = Object.values(map)
    .sort((a, b) => b.toplam - a.toplam)
    .slice(0, 10);

  res.json(sonuc);
});

// GET /api/stats/son-sayimlar — Son 5 sayım
router.get('/son-sayimlar', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('sayimlar')
    .select('id, ad, tarih, durum, created_at, isletmeler(ad), depolar(ad), kullanicilar(ad_soyad)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data || []);
});

module.exports = router;
