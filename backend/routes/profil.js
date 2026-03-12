const router = require('express').Router();
const { pool } = require('../lib/db');
const authGuard = require('../middleware/authGuard');

router.use(authGuard);

// GET /api/profil/isletmelerim — kullanıcının işletmeleri (pasif dahil, RLS bypass)
router.get('/isletmelerim', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT i.id, i.ad, i.kod, i.aktif
       FROM kullanici_isletme ki
       JOIN isletmeler i ON i.id = ki.isletme_id
       WHERE ki.kullanici_id = ? AND ki.aktif = 1`,
      [req.user.id]
    );

    res.json(rows || []);
  } catch (err) {
    return res.status(500).json({ hata: err.message });
  }
});

// GET /api/profil/stats — Kullanıcının sayım/ürün/depo istatistikleri
router.get('/stats', async (req, res) => {
  try {
    // Kullanıcının bağlı işletmelerini bul
    const [kis] = await pool.execute(
      'SELECT isletme_id FROM kullanici_isletme WHERE kullanici_id = ? AND aktif = 1',
      [req.user.id]
    );

    const isletmeIds = (kis || []).map(k => k.isletme_id);

    // Sayımlar: kullanıcının kendi sayımları
    const [[{ sayimCount }]] = await pool.execute(
      "SELECT COUNT(*) AS sayimCount FROM sayimlar WHERE kullanici_id = ? AND durum <> 'silindi'",
      [req.user.id]
    );

    let urunCount = 0;
    let depoCount = 0;

    if (isletmeIds.length > 0) {
      const placeholders = isletmeIds.map(() => '?').join(',');

      const [[{ uc }], [{ dc }]] = await Promise.all([
        pool.execute(
          `SELECT COUNT(*) AS uc FROM isletme_urunler WHERE isletme_id IN (${placeholders}) AND aktif = 1`,
          isletmeIds
        ).then(r => r[0]),
        pool.execute(
          `SELECT COUNT(*) AS dc FROM depolar WHERE isletme_id IN (${placeholders}) AND aktif = 1`,
          isletmeIds
        ).then(r => r[0]),
      ]);
      urunCount = uc || 0;
      depoCount = dc || 0;
    }

    res.json({ sayimlar: sayimCount || 0, urunler: urunCount, depolar: depoCount });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// PUT /api/profil/ayarlar — kullanıcı ayarlarını güncelle
router.put('/ayarlar', async (req, res) => {
  const { ayarlar } = req.body;
  if (!ayarlar) return res.status(400).json({ hata: 'Ayarlar zorunludur.' });

  try {
    await pool.execute(
      'UPDATE kullanicilar SET ayarlar = ? WHERE id = ?',
      [JSON.stringify(ayarlar), req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

module.exports = router;
