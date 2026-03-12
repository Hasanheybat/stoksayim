const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../lib/db');
const authGuard  = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');

// Tüm roller rotaları: auth + admin gerektirir
router.use(authGuard, adminGuard);

// GET /api/roller — Tüm rolleri listele
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM roller ORDER BY sistem DESC, created_at ASC'
    );

    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// POST /api/roller — Yeni özel rol oluştur
router.post('/', async (req, res) => {
  const { ad, yetkiler } = req.body;

  if (!ad?.trim()) {
    return res.status(400).json({ hata: 'Rol adı zorunludur.' });
  }

  const varsayilanYetkiler = {
    urun:   { goruntule: true,  ekle: false, duzenle: false, sil: false },
    depo:   { goruntule: true,  ekle: false, duzenle: false, sil: false },
    barkod: { tanimla: false,   duzenle: false, sil: false },
    sayim:  { goruntule: true,  ekle: true,  duzenle: false, sil: false },
  };

  try {
    const id = crypto.randomUUID();

    await pool.execute(
      'INSERT INTO roller (id, ad, yetkiler, sistem) VALUES (?, ?, ?, 0)',
      [id, ad.trim(), JSON.stringify(yetkiler || varsayilanYetkiler)]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM roller WHERE id = ?',
      [id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.errno === 1062) {
      return res.status(409).json({ hata: 'Bu rol adı zaten mevcut.' });
    }
    res.status(500).json({ hata: err.message });
  }
});

// PUT /api/roller/:id — Rol güncelle (yetki matrisi + ad)
router.put('/:id', async (req, res) => {
  const { ad, yetkiler } = req.body;

  const guncelle = {};
  if (ad !== undefined)       guncelle.ad = ad.trim();
  if (yetkiler !== undefined) guncelle.yetkiler = yetkiler;

  if (Object.keys(guncelle).length === 0) {
    return res.status(400).json({ hata: 'Güncellenecek alan yok.' });
  }

  try {
    // Sistem rollerinin adı değiştirilemez
    if (ad !== undefined) {
      const [mevcutRows] = await pool.execute(
        'SELECT sistem FROM roller WHERE id = ?',
        [req.params.id]
      );

      if (mevcutRows.length && mevcutRows[0].sistem) {
        delete guncelle.ad;
      }
    }

    const fields = [];
    const params = [];

    if (guncelle.ad !== undefined)       { fields.push('ad = ?');       params.push(guncelle.ad); }
    if (guncelle.yetkiler !== undefined) { fields.push('yetkiler = ?'); params.push(JSON.stringify(guncelle.yetkiler)); }

    if (fields.length) {
      params.push(req.params.id);
      await pool.execute(
        `UPDATE roller SET ${fields.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Yetkiler değiştiyse, bu role atanmış tüm kullanici_isletme kayıtlarını da güncelle
    if (yetkiler !== undefined) {
      await pool.execute(
        'UPDATE kullanici_isletme SET yetkiler = ? WHERE rol_id = ?',
        [JSON.stringify(yetkiler), req.params.id]
      );
    }

    const [rows] = await pool.execute(
      'SELECT * FROM roller WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ hata: 'Rol bulunamadı.' });
    }

    res.json(rows[0]);
  } catch (err) {
    if (err.errno === 1062) {
      return res.status(409).json({ hata: 'Bu rol adı zaten mevcut.' });
    }
    res.status(500).json({ hata: err.message });
  }
});

// DELETE /api/roller/:id — Rol sil (sadece özel roller)
router.delete('/:id', async (req, res) => {
  try {
    // Sistem rolü olup olmadığını kontrol et
    const [rolRows] = await pool.execute(
      'SELECT sistem, ad FROM roller WHERE id = ?',
      [req.params.id]
    );

    if (!rolRows.length) {
      return res.status(404).json({ hata: 'Rol bulunamadı.' });
    }

    if (rolRows[0].sistem) {
      return res.status(403).json({ hata: `"${rolRows[0].ad}" sistem rolü silinemez.` });
    }

    // Bu role atanmış kullanici_isletme kayıtlarının rol_id'sini temizle
    await pool.execute(
      'UPDATE kullanici_isletme SET rol_id = NULL WHERE rol_id = ?',
      [req.params.id]
    );

    await pool.execute(
      'DELETE FROM roller WHERE id = ?',
      [req.params.id]
    );

    res.json({ mesaj: 'Rol silindi.' });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

module.exports = router;
