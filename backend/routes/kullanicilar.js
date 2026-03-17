const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../lib/db');
const authGuard = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');

router.use(authGuard, adminGuard);

// GET /api/kullanicilar?q=arama&sayfa=1&limit=50&filtre=Tümü&rol=admin|kullanici
router.get('/', async (req, res) => {
  const { q, sayfa, limit = 50, filtre, rol } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (q) {
      conditions.push('(k.ad_soyad LIKE ? OR k.email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (filtre === 'Aktif')   { conditions.push('k.aktif = 1'); }
    if (filtre === 'Pasif')   { conditions.push('k.aktif = 0'); }
    if (rol === 'admin')      { conditions.push("k.rol = 'admin'"); }
    if (rol === 'kullanici')  { conditions.push("k.rol != 'admin'"); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    let userIds;
    let toplam;

    if (sayfa) {
      const sp = Math.max(1, (v => Number.isNaN(v) ? 1 : v)(parseInt(sayfa)));
      const lm = Math.min(200, Math.max(1, (v => Number.isNaN(v) ? 50 : v)(parseInt(limit))));
      const offset = (sp - 1) * lm;

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as toplam FROM kullanicilar k ${where}`,
        params
      );
      toplam = countRows[0].toplam;

      const [idRows] = await pool.execute(
        `SELECT k.id FROM kullanicilar k ${where} ORDER BY k.ad_soyad LIMIT ${lm} OFFSET ${offset}`,
        params
      );
      userIds = idRows.map(r => r.id);
    } else {
      const [idRows] = await pool.execute(
        `SELECT k.id FROM kullanicilar k ${where} ORDER BY k.ad_soyad`,
        params
      );
      userIds = idRows.map(r => r.id);
    }

    if (!userIds.length) {
      return sayfa
        ? res.json({ data: [], toplam: toplam || 0 })
        : res.json([]);
    }

    const placeholders = userIds.map(() => '?').join(',');

    const [rows] = await pool.execute(
      `SELECT k.id, k.ad_soyad, k.email, k.rol, k.telefon, k.aktif, k.created_at,
              ki.aktif as ki_aktif, ki.rol_id,
              r.ad as rol_adi,
              i.id as isletme_id_ref, i.ad as isletme_ad, i.kod as isletme_kod
       FROM kullanicilar k
       LEFT JOIN kullanici_isletme ki ON ki.kullanici_id = k.id AND ki.aktif = 1
       LEFT JOIN roller r ON r.id = ki.rol_id
       LEFT JOIN isletmeler i ON i.id = ki.isletme_id
       WHERE k.id IN (${placeholders})
       ORDER BY k.ad_soyad`,
      userIds
    );

    // Group flat rows by kullanici id
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          ad_soyad: row.ad_soyad,
          email: row.email,
          rol: row.rol,
          telefon: row.telefon,
          aktif: row.aktif,
          created_at: row.created_at,
          isletmeler: [],
        });
      }

      if (row.isletme_id_ref) {
        map.get(row.id).isletmeler.push({
          id: row.isletme_id_ref,
          ad: row.isletme_ad,
          kod: row.isletme_kod,
          atanan_rol_id: row.rol_id || null,
          atanan_rol_adi: row.rol_adi || null,
        });
      }
    }

    // Preserve ordering from userIds
    const list = userIds.map(id => map.get(id)).filter(Boolean);

    if (sayfa) return res.json({ data: list, toplam });
    res.json(list);
  } catch (err) {
    console.error('[kullanicilar]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/kullanicilar/:id
router.get('/:id', async (req, res) => {
  try {
    const [userRows] = await pool.execute(
      'SELECT id, ad_soyad, email, rol, telefon, aktif, ayarlar, created_at FROM kullanicilar WHERE id = ?',
      [req.params.id]
    );

    if (!userRows.length) {
      return res.status(404).json({ hata: 'Kullanıcı bulunamadı.' });
    }

    const kullanici = userRows[0];

    const [kiRows] = await pool.execute(
      `SELECT ki.id, ki.aktif, ki.yetkiler,
              i.id as isletme_id, i.ad as isletme_ad, i.kod as isletme_kod
       FROM kullanici_isletme ki
       LEFT JOIN isletmeler i ON i.id = ki.isletme_id
       WHERE ki.kullanici_id = ?`,
      [req.params.id]
    );

    kullanici.kullanici_isletme = kiRows.map(ki => ({
      id: ki.id,
      aktif: ki.aktif,
      yetkiler: ki.yetkiler,
      isletmeler: ki.isletme_id ? { id: ki.isletme_id, ad: ki.isletme_ad, kod: ki.isletme_kod } : null,
    }));

    res.json(kullanici);
  } catch (err) {
    console.error('[kullanicilar]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// POST /api/kullanicilar — Yeni kullanıcı oluştur
router.post('/', async (req, res) => {
  const { ad_soyad, email, sifre, rol, telefon } = req.body;

  if (!ad_soyad || !email || !sifre) {
    return res.status(400).json({ hata: 'ad_soyad, email ve sifre zorunludur.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ hata: 'Geçerli bir email adresi giriniz.' });
  }
  if (sifre.length < 8) {
    return res.status(400).json({ hata: 'Şifre en az 8 karakter olmalıdır.' });
  }
  if (rol && !['admin', 'kullanici'].includes(rol)) {
    return res.status(400).json({ hata: 'Geçersiz rol. admin veya kullanici olmalı.' });
  }
  if (telefon && !/^[0-9+\-\s()]{7,20}$/.test(telefon)) {
    return res.status(400).json({ hata: 'Geçerli bir telefon numarası giriniz.' });
  }

  try {
    const id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(sifre, 10);

    await pool.execute(
      'INSERT INTO kullanicilar (id, ad_soyad, email, password_hash, rol, telefon) VALUES (?, ?, ?, ?, ?, ?)',
      [id, ad_soyad, email, password_hash, rol || 'kullanici', telefon || null]
    );

    const [rows] = await pool.execute(
      'SELECT id, ad_soyad, email, rol, telefon, aktif, created_at FROM kullanicilar WHERE id = ?',
      [id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.errno === 1062) {
      return res.status(409).json({ hata: 'Bu email zaten kullanımda.' });
    }
    console.error('[kullanicilar]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// PUT /api/kullanicilar/:id
router.put('/:id', async (req, res) => {
  const { ad_soyad, telefon, aktif, rol, email, sifre } = req.body;

  // Adminler kendi rollerini düşüremez ve kendilerini pasife alamaz
  if (req.params.id === req.user.id) {
    if (rol !== undefined && rol !== 'admin') {
      return res.status(403).json({ hata: 'Kendi admin rolünüzü değiştiremezsiniz.' });
    }
    if (aktif === false) {
      return res.status(403).json({ hata: 'Kendi hesabınızı pasife alamazsınız.' });
    }
  }

  try {
    const fields = [];
    const params = [];

    if (ad_soyad !== undefined) { fields.push('ad_soyad = ?'); params.push(ad_soyad); }
    if (telefon !== undefined)  { fields.push('telefon = ?');  params.push(telefon); }
    if (aktif !== undefined)    { fields.push('aktif = ?');    params.push(aktif ? 1 : 0); }
    if (rol !== undefined)      { fields.push('rol = ?');      params.push(rol); }
    if (email !== undefined)    { fields.push('email = ?');    params.push(email); }

    if (sifre !== undefined) {
      const password_hash = await bcrypt.hash(sifre, 10);
      fields.push('password_hash = ?');
      params.push(password_hash);
    }

    if (!fields.length) {
      return res.status(400).json({ hata: 'Güncellenecek alan yok.' });
    }

    params.push(req.params.id);

    await pool.execute(
      `UPDATE kullanicilar SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    const [rows] = await pool.execute(
      'SELECT id, ad_soyad, email, rol, telefon, aktif, created_at FROM kullanicilar WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ hata: 'Kullanıcı bulunamadı.' });
    }

    res.json(rows[0]);
  } catch (err) {
    if (err.errno === 1062) {
      return res.status(409).json({ hata: 'Bu email zaten kullanımda.' });
    }
    console.error('[kullanicilar]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// DELETE /api/kullanicilar/:id — Pasife al
router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(403).json({ hata: 'Kendi hesabınızı silemezsiniz.' });
  }

  try {
    await pool.execute(
      'UPDATE kullanicilar SET aktif = 0 WHERE id = ?',
      [req.params.id]
    );

    res.json({ mesaj: 'Kullanıcı pasife alındı.' });
  } catch (err) {
    console.error('[kullanicilar]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// POST /api/kullanicilar/:id/isletme — İşletme ata
router.post('/:id/isletme', async (req, res) => {
  const { isletme_id } = req.body;

  if (!isletme_id) {
    return res.status(400).json({ hata: 'isletme_id zorunludur.' });
  }

  const varsayilanYetkiler = {
    urun:         { goruntule: true, ekle: false, duzenle: false, sil: false },
    depo:         { goruntule: true, ekle: false, duzenle: false, sil: false },
    sayim:        { goruntule: true, ekle: false, duzenle: false, sil: false },
    toplam_sayim: { goruntule: false, ekle: false, duzenle: false, sil: false },
  };

  try {
    const id = crypto.randomUUID();

    await pool.execute(
      `INSERT INTO kullanici_isletme (id, kullanici_id, isletme_id, aktif, yetkiler)
       VALUES (?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE aktif = 1`,
      [id, req.params.id, isletme_id, JSON.stringify(varsayilanYetkiler)]
    );

    // Fetch the actual row (could be newly inserted or existing updated)
    const [rows] = await pool.execute(
      'SELECT * FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ?',
      [req.params.id, isletme_id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[kullanicilar]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// DELETE /api/kullanicilar/:id/isletme/:isletme_id — İşletme atamasını kaldır
router.delete('/:id/isletme/:isletme_id', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE kullanici_isletme SET aktif = 0 WHERE kullanici_id = ? AND isletme_id = ?',
      [req.params.id, req.params.isletme_id]
    );

    res.json({ mesaj: 'İşletme ataması kaldırıldı.' });
  } catch (err) {
    console.error('[kullanicilar]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/kullanicilar/:id/yetkiler?isletme_id=X
router.get('/:id/yetkiler', async (req, res) => {
  const { isletme_id } = req.query;

  if (!isletme_id) {
    return res.status(400).json({ hata: 'isletme_id zorunludur.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT ki.yetkiler, ki.rol_id, r.ad as rol_adi
       FROM kullanici_isletme ki
       LEFT JOIN roller r ON r.id = ki.rol_id
       WHERE ki.kullanici_id = ? AND ki.isletme_id = ?`,
      [req.params.id, isletme_id]
    );

    if (!rows.length) {
      return res.status(404).json({ hata: 'Atama bulunamadı.' });
    }

    res.json({
      yetkiler: rows[0].yetkiler,
      rol_id:   rows[0].rol_id || null,
      rol_adi:  rows[0].rol_adi || null,
    });
  } catch (err) {
    console.error('[kullanicilar]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// PUT /api/kullanicilar/:id/yetkiler
router.put('/:id/yetkiler', async (req, res) => {
  const { isletme_id, yetkiler, rol_id } = req.body;

  if (!isletme_id || !yetkiler) {
    return res.status(400).json({ hata: 'isletme_id ve yetkiler zorunludur.' });
  }

  try {
    const fields = ['yetkiler = ?'];
    const params = [JSON.stringify(yetkiler)];

    if (rol_id !== undefined) {
      fields.push('rol_id = ?');
      params.push(rol_id || null);
    }

    params.push(req.params.id, isletme_id);

    await pool.execute(
      `UPDATE kullanici_isletme SET ${fields.join(', ')} WHERE kullanici_id = ? AND isletme_id = ?`,
      params
    );

    const [rows] = await pool.execute(
      'SELECT * FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ?',
      [req.params.id, isletme_id]
    );

    if (!rows.length) {
      return res.status(404).json({ hata: 'Atama bulunamadı.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[kullanicilar]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// PUT /api/kullanicilar/:id/restore — Silinen kullanıcıyı geri al
router.put('/:id/restore', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, aktif FROM kullanicilar WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ hata: 'Kullanıcı bulunamadı.' });
    if (rows[0].aktif === 1) return res.status(400).json({ hata: 'Bu kullanıcı zaten aktif.' });
    await pool.execute('UPDATE kullanicilar SET aktif = 1 WHERE id = ?', [req.params.id]);
    res.json({ mesaj: 'Kullanıcı geri alındı.' });
  } catch (err) {
    console.error('[kullanicilar]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

module.exports = router;
