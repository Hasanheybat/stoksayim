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
    console.error('[roller]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// POST /api/roller — Yeni özel rol oluştur
router.post('/', async (req, res) => {
  const { ad, yetkiler } = req.body;

  if (!ad?.trim()) {
    return res.status(400).json({ hata: 'Rol adı zorunludur.' });
  }

  const varsayilanYetkiler = {
    urun:         { goruntule: true,  ekle: false, duzenle: false, sil: false },
    depo:         { goruntule: true,  ekle: false, duzenle: false, sil: false },
    sayim:        { goruntule: true,  ekle: true,  duzenle: false, sil: false },
    toplam_sayim: { goruntule: false, ekle: false, duzenle: false, sil: false },
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
    console.error('[roller]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
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
    console.error('[roller]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/roller/:id/atanmislar — Bu role atanmış kullanıcıları getir
router.get('/:id/atanmislar', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ki.id as ki_id, ki.kullanici_id, ki.isletme_id, k.ad_soyad, k.email, i.ad as isletme_ad
       FROM kullanici_isletme ki
       JOIN kullanicilar k ON ki.kullanici_id = k.id
       JOIN isletmeler i ON ki.isletme_id = i.id
       WHERE ki.rol_id = ? AND ki.aktif = 1`,
      [req.params.id]
    );
    res.json(rows || []);
  } catch (err) {
    console.error('[roller]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// DELETE /api/roller/:id — Rol sil (sadece özel roller)
// Body: { atamalar: [{ ki_id, yeni_rol_id }] } — isteğe bağlı yeniden atama
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

    const atamalar = req.body?.atamalar || [];
    const bosYetkiler = JSON.stringify({
      urun:         { goruntule: false, ekle: false, duzenle: false, sil: false },
      depo:         { goruntule: false, ekle: false, duzenle: false, sil: false },
      sayim:        { goruntule: false, ekle: false, duzenle: false, sil: false },
      toplam_sayim: { goruntule: false, ekle: false, duzenle: false, sil: false },
    });

    // Transaction ile atomik işlem
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      // Yeniden atama yapılanları işle
      for (const atama of atamalar) {
        if (!atama.ki_id || !atama.yeni_rol_id) continue;
        const [yeniRolRows] = await conn.execute('SELECT yetkiler FROM roller WHERE id = ?', [atama.yeni_rol_id]);
        if (yeniRolRows.length) {
          await conn.execute(
            'UPDATE kullanici_isletme SET rol_id = ?, yetkiler = ? WHERE id = ?',
            [atama.yeni_rol_id, yeniRolRows[0].yetkiler, atama.ki_id]
          );
        }
      }

      // Yeniden atama yapılmayan kullanıcıların yetkilerini sıfırla
      await conn.execute(
        'UPDATE kullanici_isletme SET rol_id = NULL, yetkiler = ? WHERE rol_id = ?',
        [bosYetkiler, req.params.id]
      );

      await conn.execute(
        'DELETE FROM roller WHERE id = ?',
        [req.params.id]
      );

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    res.json({ mesaj: 'Rol silindi.' });
  } catch (err) {
    console.error('[roller]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

module.exports = router;
