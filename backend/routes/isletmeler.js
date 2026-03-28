const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../lib/db');
const authGuard = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');
const { msg, messages } = require('../lib/messages');

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
    res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
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
      return res.status(404).json({ hata: msg(req.lang, 'BUSINESS_NOT_FOUND') });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[isletmeler]', err.message);
    res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// POST /api/isletmeler
router.post('/', async (req, res) => {
  const { ad, kod, adres, telefon } = req.body;

  if (!ad || !kod) {
    return res.status(400).json({ hata: msg(req.lang, 'BUSINESS_NAME_AND_CODE_REQUIRED') });
  }
  if (ad.length > 255) return res.status(400).json({ hata: msg(req.lang, 'BUSINESS_NAME_MAX_LENGTH') });
  if (kod.length > 50) return res.status(400).json({ hata: msg(req.lang, 'BUSINESS_CODE_MAX_LENGTH') });
  if (adres && adres.length > 500) return res.status(400).json({ hata: msg(req.lang, 'BUSINESS_ADDRESS_MAX_LENGTH') });
  if (telefon && !/^[0-9+\-\s()]{7,20}$/.test(telefon)) {
    return res.status(400).json({ hata: msg(req.lang, 'INVALID_PHONE') });
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
      return res.status(409).json({ hata: msg(req.lang, 'BUSINESS_CODE_IN_USE') });
    }
    console.error('[isletmeler]', err.message);
    res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// PUT /api/isletmeler/:id
router.put('/:id', async (req, res) => {
  const { ad, kod, adres, telefon, aktif } = req.body;

  if (telefon && !/^[0-9+\-\s()]{7,20}$/.test(telefon)) {
    return res.status(400).json({ hata: msg(req.lang, 'INVALID_PHONE') });
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
      return res.status(400).json({ hata: msg(req.lang, 'NO_FIELDS_TO_UPDATE') });
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
      return res.status(404).json({ hata: msg(req.lang, 'BUSINESS_NOT_FOUND') });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[isletmeler]', err.message);
    res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// DELETE /api/isletmeler/:id — Soft delete (pasife al)
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE isletmeler SET aktif = 0 WHERE id = ?',
      [req.params.id]
    );

    res.json({ mesaj: msg(req.lang, 'BUSINESS_DEACTIVATED') });
  } catch (err) {
    console.error('[isletmeler]', err.message);
    res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// PUT /api/isletmeler/:id/restore — Silinen işletmeyi geri al
router.put('/:id/restore', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, aktif FROM isletmeler WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ hata: msg(req.lang, 'BUSINESS_NOT_FOUND') });
    if (rows[0].aktif === 1) return res.status(400).json({ hata: msg(req.lang, 'BUSINESS_ALREADY_ACTIVE') });
    await pool.execute('UPDATE isletmeler SET aktif = 1 WHERE id = ?', [req.params.id]);
    res.json({ mesaj: msg(req.lang, 'BUSINESS_RESTORED') });
  } catch (err) {
    console.error('[isletmeler]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

module.exports = router;
