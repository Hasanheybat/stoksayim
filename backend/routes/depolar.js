const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../lib/db');
const authGuard = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');
const yetkiGuard = require('../middleware/yetkiGuard');

/* ── Yetki kontrol yardımcısı (PUT/DELETE için isletme_id DB'den çekilir) ── */
async function checkDepoYetki(req, res, islem) {
  if (req.user.rol === 'admin') return true;

  const [rows] = await pool.execute(
    'SELECT isletme_id FROM depolar WHERE id = ?',
    [req.params.id]
  );

  if (!rows.length) {
    res.status(404).json({ hata: 'Depo bulunamadı.' });
    return false;
  }

  const depo = rows[0];

  const [kiRows] = await pool.execute(
    'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
    [req.user.id, depo.isletme_id]
  );

  if (!kiRows.length) {
    res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
    return false;
  }

  if (!kiRows[0].yetkiler?.depo?.[islem]) {
    res.status(403).json({ hata: `Depo ${islem} yetkiniz yok.` });
    return false;
  }

  return true;
}

router.use(authGuard);

// ── Kullanıcı erişimli: POST / (Depo Ekle) ──
router.post('/', yetkiGuard('depo', 'ekle', 'body'), async (req, res) => {
  const { isletme_id, ad } = req.body;

  if (!isletme_id || !ad?.trim()) {
    return res.status(400).json({ hata: 'isletme_id ve ad zorunludur.' });
  }

  const id = crypto.randomUUID();
  try {
    await pool.execute(
      'INSERT INTO depolar (id, isletme_id, ad) VALUES (?, ?, ?)',
      [id, isletme_id, ad.trim()]
    );
    const [rows] = await pool.execute('SELECT * FROM depolar WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.errno === 1062) return res.status(409).json({ hata: 'Bu depo bu işletmede zaten var.' });
    return res.status(500).json({ hata: err.message });
  }
});

// ── PUT /:id (Kullanıcı: sadece ad | Admin: ad + kod + konum + aktif) ──
router.put('/:id', async (req, res) => {
  if (!await checkDepoYetki(req, res, 'duzenle')) return;

  const { ad, kod, konum, aktif } = req.body;

  if (!ad?.trim()) {
    return res.status(400).json({ hata: 'Depo adı boş olamaz.' });
  }

  // Admin ek alanları da güncelleyebilir; kullanıcı sadece ad
  const fields = ['ad = ?'];
  const params = [ad.trim()];

  if (req.user.rol === 'admin') {
    if (kod !== undefined) { fields.push('kod = ?'); params.push(kod); }
    if (konum !== undefined) { fields.push('konum = ?'); params.push(konum); }
    if (aktif !== undefined) { fields.push('aktif = ?'); params.push(aktif); }
  }

  params.push(req.params.id);

  try {
    await pool.execute(`UPDATE depolar SET ${fields.join(', ')} WHERE id = ?`, params);
    const [rows] = await pool.execute('SELECT * FROM depolar WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ hata: 'Depo bulunamadı.' });
    res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ hata: err.message });
  }
});

// ── Kullanıcı erişimli: DELETE /:id (Depo Sil) ──
router.delete('/:id', async (req, res) => {
  if (!await checkDepoYetki(req, res, 'sil')) return;

  try {
    await pool.execute('UPDATE depolar SET aktif = 0 WHERE id = ?', [req.params.id]);
    res.json({ mesaj: 'Depo silindi.' });
  } catch (err) {
    return res.status(500).json({ hata: err.message });
  }
});

// ── Kullanıcı erişimli: GET /?isletme_id=X ──
// Admin ise adminGuard'dan sonraki tam listeye next() ile geç
router.get('/', async (req, res, next) => {
  if (req.user.rol === 'admin') return next();

  const { isletme_id } = req.query;
  if (!isletme_id) return res.status(400).json({ hata: 'isletme_id zorunludur.' });

  const [kiRows] = await pool.execute(
    'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
    [req.user.id, isletme_id]
  );

  if (!kiRows.length) return res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
  if (!kiRows[0].yetkiler?.depo?.goruntule) return res.status(403).json({ hata: 'Depo görüntüleme yetkiniz yok.' });

  const [data] = await pool.execute(
    'SELECT id, ad, konum FROM depolar WHERE isletme_id = ? AND aktif = 1 ORDER BY ad',
    [isletme_id]
  );

  res.json({ data: data || [], toplam: data.length });
});

// ── Admin yetkisi gerektiren rotalar ──
router.use(adminGuard);

// GET /api/depolar?isletme_id=X&isletme_ids=X,Y&q=arama&sayfa=1&limit=50
router.get('/', async (req, res) => {
  const { isletme_id, isletme_ids, aktif, q, sayfa, limit = 50 } = req.query;

  const where = [];
  const params = [];

  if (isletme_id) {
    where.push('d.isletme_id = ?');
    params.push(isletme_id);
  }
  if (isletme_ids) {
    const ids = isletme_ids.split(',').filter(Boolean);
    if (ids.length) {
      where.push(`d.isletme_id IN (${ids.map(() => '?').join(',')})`);
      params.push(...ids);
    }
  }
  if (aktif !== undefined) {
    where.push('d.aktif = ?');
    params.push(aktif === 'true' ? 1 : 0);
  }
  if (q) {
    where.push('(d.ad LIKE ? OR d.kod LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  if (!sayfa) {
    // backward compat — no pagination
    const [data] = await pool.execute(
      `SELECT d.*, i.id AS isletme_id_j, i.ad AS isletme_ad, i.kod AS isletme_kod
       FROM depolar d
       LEFT JOIN isletmeler i ON i.id = d.isletme_id
       ${whereClause}
       ORDER BY i.ad ASC, d.ad ASC`,
      params
    );
    const enriched = data.map(row => ({
      id: row.id, isletme_id: row.isletme_id, ad: row.ad, kod: row.kod,
      konum: row.konum, aktif: row.aktif, created_at: row.created_at, updated_at: row.updated_at,
      isletmeler: { id: row.isletme_id, ad: row.isletme_ad, kod: row.isletme_kod },
    }));
    return res.json(enriched);
  }

  const sp = Math.max(1, (v => Number.isNaN(v) ? 1 : v)(parseInt(sayfa)));
  const lm = Math.min(200, Math.max(1, (v => Number.isNaN(v) ? 50 : v)(parseInt(limit))));
  const offset = (sp - 1) * lm;

  // Count query
  const [[{ toplam }]] = await pool.execute(
    `SELECT COUNT(*) AS toplam FROM depolar d ${whereClause}`,
    params
  );

  // Data query with LEFT JOIN + sayim count subquery
  const [data] = await pool.execute(
    `SELECT d.*, i.ad AS isletme_ad, i.kod AS isletme_kod,
       (SELECT COUNT(*) FROM sayimlar s WHERE s.depo_id = d.id AND s.durum <> 'silindi') AS sayim_sayisi
     FROM depolar d
     LEFT JOIN isletmeler i ON i.id = d.isletme_id
     ${whereClause}
     ORDER BY i.ad ASC, d.ad ASC
     LIMIT ${lm} OFFSET ${offset}`,
    params
  );

  const enriched = data.map(row => ({
    id: row.id, isletme_id: row.isletme_id, ad: row.ad, kod: row.kod,
    konum: row.konum, aktif: row.aktif, created_at: row.created_at, updated_at: row.updated_at,
    isletmeler: { id: row.isletme_id, ad: row.isletme_ad, kod: row.isletme_kod },
    sayim_sayisi: row.sayim_sayisi || 0,
  }));

  res.json({ data: enriched, toplam });
});

// GET /api/depolar/:id
router.get('/:id', async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT d.*, i.ad AS isletme_ad, i.kod AS isletme_kod
     FROM depolar d
     LEFT JOIN isletmeler i ON i.id = d.isletme_id
     WHERE d.id = ?`,
    [req.params.id]
  );

  if (!rows.length) return res.status(404).json({ hata: 'Depo bulunamadı.' });

  const row = rows[0];
  res.json({
    ...row,
    isletme_ad: undefined, isletme_kod: undefined,
    isletmeler: { ad: row.isletme_ad, kod: row.isletme_kod },
  });
});

// POST /api/depolar
router.post('/', async (req, res) => {
  const { isletme_id, ad, kod, konum } = req.body;

  if (!isletme_id || !ad) {
    return res.status(400).json({ hata: 'isletme_id ve ad zorunludur.' });
  }

  const id = crypto.randomUUID();
  try {
    await pool.execute(
      'INSERT INTO depolar (id, isletme_id, ad, kod, konum) VALUES (?, ?, ?, ?, ?)',
      [id, isletme_id, ad, kod || null, konum || null]
    );
    const [rows] = await pool.execute('SELECT * FROM depolar WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.errno === 1062) {
      return res.status(409).json({ hata: 'Bu depo kodu bu işletmede zaten var.' });
    }
    return res.status(500).json({ hata: err.message });
  }
});

// NOT: PUT /:id ve DELETE /:id adminGuard öncesinde tanımlandığından
// bu noktaya hiç ulaşılmaz. Mantık authGuard öncesindeki route'lara taşındı.

module.exports = router;
