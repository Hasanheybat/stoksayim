const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../lib/db');
const authGuard = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');

// Tüm route'lar auth + admin gerektirir
router.use(authGuard, adminGuard);

// GET /api/isletmeler?aktif=true&q=arama&sayfa=1&limit=50
router.get('/', async (req, res) => {
  const { aktif, q, sayfa, limit = 50 } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (aktif !== undefined) {
      conditions.push('aktif = ?');
      params.push(aktif === 'true' ? 1 : 0);
    }

    if (q) {
      conditions.push('(ad LIKE ? OR kod LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    if (sayfa) {
      const sp = Math.max(1, (v => Number.isNaN(v) ? 1 : v)(parseInt(sayfa)));
      const lm = Math.min(200, Math.max(1, (v => Number.isNaN(v) ? 50 : v)(parseInt(limit))));
      const offset = (sp - 1) * lm;

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as toplam FROM isletmeler ${where}`,
        params
      );

      const [data] = await pool.execute(
        `SELECT * FROM isletmeler ${where} ORDER BY ad LIMIT ${lm} OFFSET ${offset}`,
        params
      );

      return res.json({ data, toplam: countRows[0].toplam });
    }

    // backward compat — dropdown listeler için
    const [data] = await pool.execute(
      `SELECT * FROM isletmeler ${where} ORDER BY ad`,
      params
    );

    res.json(data);
  } catch (err) {
    console.error('[isletmeler]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/isletmeler/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM isletmeler WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ hata: 'İşletme bulunamadı.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[isletmeler]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// POST /api/isletmeler
router.post('/', async (req, res) => {
  const { ad, kod, adres, telefon } = req.body;

  if (!ad || !kod) {
    return res.status(400).json({ hata: 'Ad ve kod zorunludur.' });
  }
  if (telefon && !/^[0-9+\-\s()]{7,20}$/.test(telefon)) {
    return res.status(400).json({ hata: 'Geçerli bir telefon numarası giriniz.' });
  }

  try {
    const id = crypto.randomUUID();

    await pool.execute(
      'INSERT INTO isletmeler (id, ad, kod, adres, telefon) VALUES (?, ?, ?, ?, ?)',
      [id, ad, kod, adres || null, telefon || null]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM isletmeler WHERE id = ?',
      [id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.errno === 1062) {
      return res.status(409).json({ hata: 'Bu kod zaten kullanımda.' });
    }
    console.error('[isletmeler]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// PUT /api/isletmeler/:id
router.put('/:id', async (req, res) => {
  const { ad, kod, adres, telefon, aktif } = req.body;

  if (telefon && !/^[0-9+\-\s()]{7,20}$/.test(telefon)) {
    return res.status(400).json({ hata: 'Geçerli bir telefon numarası giriniz.' });
  }

  try {
    const fields = [];
    const params = [];

    if (ad !== undefined)      { fields.push('ad = ?');      params.push(ad); }
    if (kod !== undefined)     { fields.push('kod = ?');     params.push(kod); }
    if (adres !== undefined)   { fields.push('adres = ?');   params.push(adres); }
    if (telefon !== undefined) { fields.push('telefon = ?'); params.push(telefon); }
    if (aktif !== undefined)   { fields.push('aktif = ?');   params.push(aktif ? 1 : 0); }

    if (!fields.length) {
      return res.status(400).json({ hata: 'Güncellenecek alan yok.' });
    }

    params.push(req.params.id);

    await pool.execute(
      `UPDATE isletmeler SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    const [rows] = await pool.execute(
      'SELECT * FROM isletmeler WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ hata: 'İşletme bulunamadı.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[isletmeler]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// DELETE /api/isletmeler/:id — Soft delete (pasife al)
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE isletmeler SET aktif = 0 WHERE id = ?',
      [req.params.id]
    );

    res.json({ mesaj: 'İşletme pasife alındı.' });
  } catch (err) {
    console.error('[isletmeler]', err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// PUT /api/isletmeler/:id/restore — Silinen işletmeyi geri al
router.put('/:id/restore', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, aktif FROM isletmeler WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ hata: 'İşletme bulunamadı.' });
    if (rows[0].aktif === 1) return res.status(400).json({ hata: 'Bu işletme zaten aktif.' });
    await pool.execute('UPDATE isletmeler SET aktif = 1 WHERE id = ?', [req.params.id]);
    res.json({ mesaj: 'İşletme geri alındı.' });
  } catch (err) {
    console.error('[isletmeler]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

module.exports = router;
