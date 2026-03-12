const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const authGuard = require('../middleware/authGuard');

router.use(authGuard);

// GET /api/profil/isletmelerim — kullanıcının işletmeleri (pasif dahil, RLS bypass)
router.get('/isletmelerim', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('kullanici_isletme')
    .select('isletmeler(id, ad, kod, aktif)')
    .eq('kullanici_id', req.user.id)
    .eq('aktif', true);

  if (error) return res.status(500).json({ hata: error.message });

  const isletmeler = (data || []).map(r => r.isletmeler).filter(Boolean);
  res.json(isletmeler);
});

// GET /api/profil/stats — Kullanıcının sayım/ürün/depo istatistikleri
router.get('/stats', async (req, res) => {
  try {
    // Kullanıcının bağlı işletmelerini bul
    const { data: kis } = await supabaseAdmin
      .from('kullanici_isletme')
      .select('isletme_id')
      .eq('kullanici_id', req.user.id)
      .eq('aktif', true);

    const isletmeIds = (kis || []).map(k => k.isletme_id);

    // Sayımlar: kullanıcının kendi sayımları
    const { count: sayimCount } = await supabaseAdmin
      .from('sayimlar')
      .select('id', { count: 'exact', head: true })
      .eq('kullanici_id', req.user.id)
      .neq('durum', 'silindi');

    let urunCount = 0;
    let depoCount = 0;

    if (isletmeIds.length > 0) {
      const [{ count: uc }, { count: dc }] = await Promise.all([
        supabaseAdmin
          .from('isletme_urunler')
          .select('id', { count: 'exact', head: true })
          .in('isletme_id', isletmeIds)
          .eq('aktif', true),
        supabaseAdmin
          .from('depolar')
          .select('id', { count: 'exact', head: true })
          .in('isletme_id', isletmeIds)
          .eq('aktif', true),
      ]);
      urunCount = uc || 0;
      depoCount = dc || 0;
    }

    res.json({ sayimlar: sayimCount || 0, urunler: urunCount, depolar: depoCount });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

module.exports = router;
