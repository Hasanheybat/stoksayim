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
    res.status(500).json({ hata: err.message });
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
    res.status(500).json({ hata: err.message });
  }
});

// POST /api/isletmeler
router.post('/', async (req, res) => {
  const { ad, kod, adres, telefon } = req.body;

  if (!ad || !kod) {
    return res.status(400).json({ hata: 'Ad ve kod zorunludur.' });
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
    res.status(500).json({ hata: err.message });
  }
});

// PUT /api/isletmeler/:id
router.put('/:id', async (req, res) => {
  const { ad, kod, adres, telefon, aktif } = req.body;

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
    res.status(500).json({ hata: err.message });
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
    res.status(500).json({ hata: err.message });
  }
});

module.exports = router;
