const router = require('express').Router();
const { pool } = require('../lib/db');
const authGuard  = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');

router.use(authGuard, adminGuard);

// GET /api/stats — Dashboard için tek sorguda tüm sayılar
router.get('/', async (req, res) => {
  try {
    const [
      [{ c: isletme }],
      [{ c: depo }],
      [{ c: kullanici }],
      [{ c: urun }],
      [{ c: sayimDevam }],
      [{ c: sayimTamamlandi }],
    ] = await Promise.all([
      pool.execute('SELECT COUNT(*) AS c FROM isletmeler WHERE aktif = 1').then(r => r[0]),
      pool.execute('SELECT COUNT(*) AS c FROM depolar WHERE aktif = 1').then(r => r[0]),
      pool.execute('SELECT COUNT(*) AS c FROM kullanicilar WHERE aktif = 1').then(r => r[0]),
      pool.execute('SELECT COUNT(*) AS c FROM isletme_urunler WHERE aktif = 1').then(r => r[0]),
      pool.execute("SELECT COUNT(*) AS c FROM sayimlar WHERE durum = 'devam'").then(r => r[0]),
      pool.execute("SELECT COUNT(*) AS c FROM sayimlar WHERE durum = 'tamamlandi'").then(r => r[0]),
    ]);

    res.json({
      isletme:          isletme    || 0,
      depo:             depo       || 0,
      kullanici:        kullanici  || 0,
      urun:             urun       || 0,
      sayim_devam:      sayimDevam      || 0,
      sayim_tamamlandi: sayimTamamlandi || 0,
      sayim_toplam:     (sayimDevam || 0) + (sayimTamamlandi || 0),
    });
  } catch (err) {
    console.error('[stats]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/stats/sayim-trend — Son 6 ay aylık sayım sayıları
router.get('/sayim-trend', async (req, res) => {
  try {
    const altıAyOnce = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

    const [data] = await pool.execute(
      "SELECT durum, created_at FROM sayimlar WHERE durum <> 'silindi' AND created_at >= ? ORDER BY created_at ASC",
      [altıAyOnce]
    );

    res.json(data || []);
  } catch (err) {
    console.error('[stats]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/stats/isletme-sayimlar — Her işletmedeki sayım dağılımı (top 10)
router.get('/isletme-sayimlar', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         i.ad,
         COUNT(*) AS toplam,
         SUM(CASE WHEN s.durum = 'devam' THEN 1 ELSE 0 END) AS devam,
         SUM(CASE WHEN s.durum = 'tamamlandi' THEN 1 ELSE 0 END) AS tamamlandi
       FROM sayimlar s
       JOIN isletmeler i ON i.id = s.isletme_id
       WHERE s.durum IN ('devam', 'tamamlandi')
       GROUP BY s.isletme_id, i.ad
       ORDER BY toplam DESC
       LIMIT 10`
    );

    res.json(rows || []);
  } catch (err) {
    console.error('[stats]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/stats/son-sayimlar — Son 5 sayım
router.get('/son-sayimlar', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.id, s.ad, s.tarih, s.durum, s.created_at,
         i.ad AS isletme_ad, d.ad AS depo_ad, k.ad_soyad AS kullanici_ad_soyad
       FROM sayimlar s
       LEFT JOIN isletmeler i ON i.id = s.isletme_id
       LEFT JOIN depolar d ON d.id = s.depo_id
       LEFT JOIN kullanicilar k ON k.id = s.kullanici_id
       ORDER BY s.created_at DESC
       LIMIT 5`
    );

    const enriched = rows.map(row => ({
      id: row.id, ad: row.ad, tarih: row.tarih, durum: row.durum, created_at: row.created_at,
      isletmeler: { ad: row.isletme_ad },
      depolar: { ad: row.depo_ad },
      kullanicilar: { ad_soyad: row.kullanici_ad_soyad },
    }));

    res.json(enriched);
  } catch (err) {
    console.error('[stats]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

module.exports = router;
