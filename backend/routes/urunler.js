const router = require('express').Router();
const crypto = require('crypto');
const multer = require('multer');
const XLSX = require('xlsx');
const { pool } = require('../lib/db');
const authGuard = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');
const yetkiGuard = require('../middleware/yetkiGuard');

const IZINLI_MIME_TURLERI = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',                                           // .xls
  'application/octet-stream',                                           // bazı tarayıcılar generic gönderir
]);
const IZINLI_UZANTILAR = /\.(xlsx|xls)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    // Uzantı her zaman zorunlu — MIME tek başına geçemez (e.g. .exe + octet-stream)
    const uzantiOk = IZINLI_UZANTILAR.test(file.originalname);
    const mimeOk   = IZINLI_MIME_TURLERI.has(file.mimetype);
    if (!uzantiOk || !mimeOk) {
      return cb(new Error('Sadece .xlsx veya .xls dosyası yüklenebilir.'));
    }
    cb(null, true);
  },
});

/* ── Yetki kontrol yardımcısı (isletme_id yoksa DB'den çeker) ── */
async function checkUrunYetki(req, res, islem) {
  if (req.user.rol === 'admin') return true;

  // isletme_id'yi ürün kaydından çek
  const [rows] = await pool.execute(
    'SELECT isletme_id FROM isletme_urunler WHERE id = ?',
    [req.params.id]
  );

  if (!rows.length) {
    res.status(404).json({ hata: 'Ürün bulunamadı.' });
    return false;
  }

  const urun = rows[0];

  const [kiRows] = await pool.execute(
    'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
    [req.user.id, urun.isletme_id]
  );

  if (!kiRows.length) {
    res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
    return false;
  }

  if (!kiRows[0].yetkiler?.urun?.[islem]) {
    res.status(403).json({ hata: `Ürün ${islem} yetkiniz yok.` });
    return false;
  }

  return true;
}

// Aynı işletmede başka bir üründe bu barkod var mı kontrol et
// conn parametresi verilirse transaction içinde çalışır (race condition koruması)
async function barkodBenzersizKontrol(isletmeId, barkodlar, haricUrunId = null, conn = null) {
  if (!barkodlar || !barkodlar.length) return null;
  const db = conn || pool;
  // FOR UPDATE ile satırları kilitle (transaction içindeyse race condition önlenir)
  const lockSuffix = conn ? ' FOR UPDATE' : '';
  const [rows] = await db.execute(
    `SELECT id, urun_adi, barkodlar FROM isletme_urunler WHERE isletme_id = ? AND aktif = 1${lockSuffix}`,
    [isletmeId]
  );
  for (const row of rows) {
    if (haricUrunId && String(row.id) === String(haricUrunId)) continue;
    const mevcutBarkodlar = (row.barkodlar || '').split(',').map(b => b.trim()).filter(Boolean);
    for (const barkod of barkodlar) {
      if (mevcutBarkodlar.includes(barkod)) {
        return { barkod, urunAdi: row.urun_adi };
      }
    }
  }
  return null;
}

// Tüm rotalar kimlik doğrulaması gerektirir
router.use(authGuard);

// ── Kullanıcı erişimli: PUT /:id (Stok Düzenle) ──
// authGuard'dan sonra, adminGuard'dan ÖNCE → giriş yapmış herkes erişebilir
router.put('/:id', async (req, res) => {
  if (!await checkUrunYetki(req, res, 'duzenle')) return;

  const { urun_adi, urun_kodu, isim_2, barkodlar, birim } = req.body;

  if (!urun_adi?.trim()) return res.status(400).json({ hata: 'İsim 1 (sayım ismi) boş olamaz.' });
  // urun_kodu boşsa mevcut kodu koru
  const kodGuncelle = urun_kodu?.trim() || null;

  const barkodArr = Array.isArray(barkodlar)
    ? barkodlar.map(b => b.trim()).filter(Boolean)
    : (typeof barkodlar === 'string' ? barkodlar.split(',').map(b => b.trim()).filter(Boolean) : []);
  const barkodStr = barkodArr.join(',');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Aynı işletmede başka üründe bu barkod var mı? (transaction ile kilitli)
    const [urunRow] = await conn.execute('SELECT isletme_id FROM isletme_urunler WHERE id = ? FOR UPDATE', [req.params.id]);
    if (urunRow.length && barkodArr.length) {
      const cakisan = await barkodBenzersizKontrol(urunRow[0].isletme_id, barkodArr, req.params.id, conn);
      if (cakisan) {
        await conn.rollback();
        return res.status(409).json({ hata: `"${cakisan.barkod}" barkodu "${cakisan.urunAdi}" ürününe zaten tanımlı.` });
      }
    }

    // urun_kodu boş geldiyse mevcut değeri koru
    const [mevcutRow] = kodGuncelle ? [[]] : await conn.execute('SELECT urun_kodu FROM isletme_urunler WHERE id = ?', [req.params.id]);
    const finalKod = kodGuncelle || (mevcutRow[0]?.urun_kodu ?? '');

    await conn.execute(
      `UPDATE isletme_urunler SET
        urun_adi = ?, urun_kodu = ?, isim_2 = ?, barkodlar = ?, birim = ?,
        son_guncelleme = NOW(), guncelleme_kaynagi = 'kullanici',
        kullanici_guncelledi = 1, guncelleyen_kullanici_id = ?
      WHERE id = ?`,
      [urun_adi.trim(), finalKod, (isim_2 || '').trim(), barkodStr, birim || null, req.user.id, req.params.id]
    );

    await conn.commit();

    const [rows] = await pool.execute('SELECT * FROM isletme_urunler WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ hata: 'Ürün bulunamadı.' });
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('[PUT /urunler/:id]', err.message);
    console.error('[urunler]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  } finally {
    conn.release();
  }
});

// ── Kullanıcı erişimli: POST / (Yeni Stok Ekle) ──
router.post('/', yetkiGuard('urun', 'ekle', 'body'), async (req, res) => {
  const { isletme_id, urun_kodu, urun_adi, isim_2, birim, barkodlar, kategori } = req.body;

  if (!isletme_id || !urun_adi?.trim()) {
    return res.status(400).json({ hata: 'isletme_id ve urun_adi zorunludur.' });
  }

  const barkodArr = Array.isArray(barkodlar)
    ? barkodlar.map(b => b.trim()).filter(Boolean)
    : (typeof barkodlar === 'string' ? barkodlar.split(',').map(b => b.trim()).filter(Boolean) : []);
  const barkodStr = barkodArr.join(',');

  const id = crypto.randomUUID();
  const kod = urun_kodu?.trim() || `STK-${id.slice(0, 8)}`;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Aynı işletmede başka üründe bu barkod var mı? (transaction ile kilitli)
    if (barkodArr.length) {
      const cakisan = await barkodBenzersizKontrol(isletme_id, barkodArr, null, conn);
      if (cakisan) {
        await conn.rollback();
        return res.status(409).json({ hata: `"${cakisan.barkod}" barkodu "${cakisan.urunAdi}" ürününe zaten tanımlı.` });
      }
    }

    await conn.execute(
      `INSERT INTO isletme_urunler
        (id, isletme_id, urun_kodu, urun_adi, isim_2, birim, barkodlar, kategori, guncelleme_kaynagi, guncelleyen_kullanici_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'kullanici', ?)`,
      [id, isletme_id, kod, urun_adi.trim(), (isim_2 || '').trim(), birim || 'ADET', barkodStr, kategori || null, req.user.id]
    );

    await conn.commit();

    const [rows] = await pool.execute('SELECT * FROM isletme_urunler WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    if (err.errno === 1062) return res.status(409).json({ hata: 'Bu ürün kodu bu işletmede zaten var.' });
    console.error('[urunler]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  } finally {
    conn.release();
  }
});

// ── Kullanıcı erişimli: DELETE /:id (Stok Sil) ──
router.delete('/:id', async (req, res) => {
  if (!await checkUrunYetki(req, res, 'sil')) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Aktif sayımda kullanılıyor mu kontrol et (FOR UPDATE ile kilitle)
    const [aktifSayimlar] = await conn.execute(
      `SELECT DISTINCT s.ad FROM sayim_kalemleri sk
       JOIN sayimlar s ON s.id = sk.sayim_id
       WHERE sk.urun_id = ? AND s.durum = 'devam' FOR UPDATE`,
      [req.params.id]
    );
    if (aktifSayimlar.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        hata: 'Bu ürün aktif sayımlarda kullanılıyor.',
        sayimlar: aktifSayimlar.map(s => s.ad),
      });
    }

    await conn.execute('UPDATE isletme_urunler SET aktif = 0 WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.json({ mesaj: 'Ürün silindi.' });
  } catch (err) {
    await conn.rollback();
    console.error('[urunler]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  } finally {
    conn.release();
  }
});

// PUT /:id/restore — Silinen ürünü geri al (admin only)
router.put('/:id/restore', adminGuard, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, aktif FROM isletme_urunler WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ hata: 'Ürün bulunamadı.' });
    if (rows[0].aktif === 1) return res.status(400).json({ hata: 'Bu ürün zaten aktif.' });
    await pool.execute('UPDATE isletme_urunler SET aktif = 1, son_guncelleme = NOW() WHERE id = ?', [req.params.id]);
    res.json({ mesaj: 'Ürün geri alındı.' });
  } catch (err) {
    console.error('[urunler]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// ── Kullanıcı erişimli: GET /barkod/:barkod?isletme_id=X ──
router.get('/barkod/:barkod', async (req, res, next) => {
  try {
  if (req.user.rol === 'admin') return next();

  const { isletme_id } = req.query;
  if (!isletme_id) return res.status(400).json({ hata: 'isletme_id zorunludur.' });

  const [kiRows] = await pool.execute(
    'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
    [req.user.id, isletme_id]
  );

  if (!kiRows.length) return res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
  if (!kiRows[0].yetkiler?.urun?.goruntule) return res.status(403).json({ hata: 'Ürün görüntüleme yetkiniz yok.' });

  const [data] = await pool.execute(
    'SELECT * FROM isletme_urunler WHERE isletme_id = ? AND aktif = 1 AND barkodlar LIKE ?',
    [isletme_id, `%${req.params.barkod}%`]
  );

  const urun = (data || []).find(u => {
    const barkodlar = (u.barkodlar || '').split(',').map(b => b.trim());
    return barkodlar.includes(req.params.barkod);
  });

  if (!urun) return res.status(404).json({ hata: 'Barkod sistemde bulunamadı.' });
  res.json(urun);
  } catch (err) {
    console.error('[urunler GET /barkod user]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// ── Kullanıcı erişimli: GET /?isletme_id=X&q=arama ──
// Admin ise adminGuard'dan sonraki tam listeye next() ile geç
router.get('/', async (req, res, next) => {
  try {
  if (req.user.rol === 'admin') return next();

  const { isletme_id, q } = req.query;
  if (!isletme_id) return res.status(400).json({ hata: 'isletme_id zorunludur.' });

  const [kiRows] = await pool.execute(
    'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
    [req.user.id, isletme_id]
  );

  if (!kiRows.length) return res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
  if (!kiRows[0].yetkiler?.urun?.goruntule) return res.status(403).json({ hata: 'Ürün görüntüleme yetkiniz yok.' });

  const where = ['isletme_id = ?', 'aktif = 1'];
  const params = [isletme_id];

  if (q) {
    where.push('(urun_adi LIKE ? OR urun_kodu LIKE ? OR barkodlar LIKE ? OR isim_2 LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  const [data] = await pool.execute(
    `SELECT id, urun_kodu, urun_adi, isim_2, birim, kategori, barkodlar
     FROM isletme_urunler
     WHERE ${where.join(' AND ')}
     ORDER BY urun_adi`,
    params
  );

  res.json(data || []);
  } catch (err) {
    console.error('[urunler GET / user]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// ── Admin yetkisi gerektiren rotalar ──
router.use(adminGuard);

// GET /api/urunler/sablon — Boş şablon Excel indir
router.get('/sablon', (req, res) => {
  const ws = XLSX.utils.aoa_to_sheet([
    // Açıklama satırı
    ['ℹ️  İşletme, yükleme ekranındaki dropdown\'dan seçilir. Bu dosyaya işletme yazmak gerekmez.'],
    [],
    ['urun_kodu', 'urun_adi', 'isim_2', 'birim', 'barkodlar'],
    ['SHK001', 'ŞEKER 1KG', 'Sugar 1KG', 'KG', '8690814000015'],
    ['UN001', 'UN 50KG', '', 'KG', '8691234567890,8699999999999'],
  ]);
  ws['!cols'] = [
    { wch: 12 }, // urun_kodu
    { wch: 30 }, // urun_adi
    { wch: 25 }, // isim_2
    { wch: 8  }, // birim
    { wch: 35 }, // barkodlar
  ];
  // Açıklama satırını birleştir (A1:E1)
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Urunler');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="stoksay_sablon.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// GET /api/urunler?isletme_id=X&q=arama&sayfa=1  (isletme_id opsiyonel)
router.get('/', async (req, res) => {
  try {
  const { isletme_id, q, alan, aktif, sayfa = 1, limit = 20 } = req.query;

  const sp = Math.max(1, (v => Number.isNaN(v) ? 1 : v)(parseInt(sayfa)));
  const lm = Math.min(200, Math.max(1, (v => Number.isNaN(v) ? 20 : v)(parseInt(limit))));
  const offset = (sp - 1) * lm;

  const where = [];
  const params = [];

  // Admin aktif/pasif filtresi: ?aktif=0 (silinenleri), ?aktif=all (hepsini), default aktif=1
  if (req.user.rol === 'admin' && aktif === '0') {
    where.push('u.aktif = 0');
  } else if (req.user.rol === 'admin' && aktif === 'all') {
    // filtre yok — hepsini getir
  } else {
    where.push('u.aktif = 1');
  }

  if (isletme_id) {
    where.push('u.isletme_id = ?');
    params.push(isletme_id);
  }
  if (q) {
    if (alan === 'isim_2') {
      where.push('u.isim_2 LIKE ?');
      params.push(`%${q}%`);
    } else {
      where.push('(u.urun_adi LIKE ? OR u.urun_kodu LIKE ? OR u.barkodlar LIKE ? OR u.isim_2 LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [[{ toplam }]] = await pool.execute(
    `SELECT COUNT(*) AS toplam FROM isletme_urunler u ${whereClause}`,
    params
  );

  const [data] = await pool.execute(
    `SELECT u.*, i.id AS isletme_id_j, i.ad AS isletme_ad
     FROM isletme_urunler u
     LEFT JOIN isletmeler i ON i.id = u.isletme_id
     ${whereClause}
     ORDER BY u.urun_adi
     LIMIT ${lm} OFFSET ${offset}`,
    params
  );

  const enriched = data.map(row => {
    const { isletme_id_j, isletme_ad, ...rest } = row;
    return {
      ...rest,
      isletmeler: { id: isletme_id_j, ad: isletme_ad },
    };
  });

  res.json({ data: enriched, toplam, sayfa: parseInt(sayfa), limit: parseInt(limit) });
  } catch (err) {
    console.error('[urunler GET / admin]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/urunler/barkod/:barkod?isletme_id=X
router.get('/barkod/:barkod', async (req, res) => {
  try {
  const { isletme_id } = req.query;

  if (!isletme_id) {
    return res.status(400).json({ hata: 'isletme_id zorunludur.' });
  }

  const [data] = await pool.execute(
    'SELECT * FROM isletme_urunler WHERE isletme_id = ? AND aktif = 1 AND barkodlar LIKE ?',
    [isletme_id, `%${req.params.barkod}%`]
  );

  const urun = data.find(u => {
    const barkodlar = (u.barkodlar || '').split(',').map(b => b.trim());
    return barkodlar.includes(req.params.barkod);
  });

  if (!urun) return res.status(404).json({ hata: 'Barkod sistemde bulunamadı.' });
  res.json(urun);
  } catch (err) {
    console.error('[urunler GET /barkod admin]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/urunler/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM isletme_urunler WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ hata: 'Ürün bulunamadı.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[urunler GET /:id]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});


// POST /api/urunler/:id/barkod — Barkod ekle
router.post('/:id/barkod', async (req, res) => {
  try {
  const { barkod } = req.body;

  if (!barkod) return res.status(400).json({ hata: 'barkod zorunludur.' });
  if (!/^[a-zA-Z0-9\-]{1,50}$/.test(barkod)) {
    return res.status(400).json({ hata: 'Geçerli bir barkod giriniz.' });
  }

  const [mevcutRows] = await pool.execute(
    'SELECT barkodlar FROM isletme_urunler WHERE id = ?',
    [req.params.id]
  );

  if (!mevcutRows.length) return res.status(404).json({ hata: 'Ürün bulunamadı.' });

  const barkodlar = (mevcutRows[0].barkodlar || '')
    .split(',')
    .map(b => b.trim())
    .filter(b => b.length > 0);

  if (barkodlar.includes(barkod)) {
    return res.status(409).json({ hata: 'Bu barkod zaten bu ürüne tanımlı.' });
  }

  // Aynı işletmede başka üründe bu barkod var mı?
  const [isletmeRow] = await pool.execute('SELECT isletme_id FROM isletme_urunler WHERE id = ?', [req.params.id]);
  if (isletmeRow.length) {
    const cakisan = await barkodBenzersizKontrol(isletmeRow[0].isletme_id, [barkod], req.params.id);
    if (cakisan) return res.status(409).json({ hata: `"${barkod}" barkodu "${cakisan.urunAdi}" ürününe zaten tanımlı.` });
  }

  barkodlar.push(barkod);

  await pool.execute(
    'UPDATE isletme_urunler SET barkodlar = ?, son_guncelleme = NOW() WHERE id = ?',
    [barkodlar.join(','), req.params.id]
  );

  const [rows] = await pool.execute('SELECT * FROM isletme_urunler WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
  } catch (err) {
    console.error('[urunler POST /:id/barkod]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// DELETE /api/urunler/:id/barkod/:barkod — Barkod sil
router.delete('/:id/barkod/:barkod', async (req, res) => {
  try {
  const [mevcutRows] = await pool.execute(
    'SELECT barkodlar FROM isletme_urunler WHERE id = ?',
    [req.params.id]
  );

  if (!mevcutRows.length) return res.status(404).json({ hata: 'Ürün bulunamadı.' });

  const barkodlar = (mevcutRows[0].barkodlar || '')
    .split(',')
    .map(b => b.trim())
    .filter(b => b.length > 0 && b !== req.params.barkod);

  await pool.execute(
    'UPDATE isletme_urunler SET barkodlar = ?, son_guncelleme = NOW() WHERE id = ?',
    [barkodlar.join(','), req.params.id]
  );

  const [rows] = await pool.execute('SELECT * FROM isletme_urunler WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
  } catch (err) {
    console.error('[urunler DELETE /:id/barkod]', err.message);
    return res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// POST /api/urunler/yukle?isletme_id=X&preview=true/false
router.post('/yukle', (req, res, next) => {
  upload.single('dosya')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ hata: 'Dosya 10 MB sınırını aşıyor.' });
    }
    if (err) return res.status(400).json({ hata: 'Dosya yüklenemedi.' });
    next();
  });
}, async (req, res) => {
  const { isletme_id, preview } = req.query;

  if (!isletme_id) return res.status(400).json({ hata: 'isletme_id zorunludur.' });
  if (!req.file)   return res.status(400).json({ hata: 'Excel dosyası gereklidir.' });

  const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  const sonuclar = { yeni: [], degisecek: [], korunacak: [], hatali: [] };
  const upsertListesi = [];

  for (const row of rows) {
    if (!row.urun_kodu) {
      sonuclar.hatali.push({ satir: row, sebep: 'Ürün kodu eksik' });
      continue;
    }

    const barkodlar = (row.barkodlar || '')
      .toString()
      .split(',')
      .map(b => b.trim())
      .filter(b => b.length > 0)
      .join(',');

    const [mevcutRows] = await pool.execute(
      'SELECT id, urun_adi, birim, barkodlar, kullanici_guncelledi, admin_version FROM isletme_urunler WHERE isletme_id = ? AND urun_kodu = ?',
      [isletme_id, row.urun_kodu.toString()]
    );

    const mevcut = mevcutRows.length ? mevcutRows[0] : null;

    if (!mevcut) {
      sonuclar.yeni.push({ ...row, barkodlar });
    } else if (mevcut.kullanici_guncelledi) {
      sonuclar.korunacak.push({ ...row, barkodlar, sebep: 'Kullanıcı düzenledi' });
    } else {
      sonuclar.degisecek.push({ ...row, barkodlar });
    }

    upsertListesi.push({
      isletme_id,
      urun_kodu: row.urun_kodu.toString(),
      urun_adi: row.urun_adi || '',
      isim_2: row.isim_2 ? row.isim_2.toString().trim() : '',
      birim: row.birim || 'ADET',
      barkodlar,
      kategori: row.kategori || null,
      admin_version: (mevcut?.admin_version || 0) + 1
    });
  }

  if (preview === 'true') {
    return res.json(sonuclar);
  }

  for (const urun of upsertListesi) {
    const [mevcutRows] = await pool.execute(
      'SELECT barkodlar, kullanici_guncelledi FROM isletme_urunler WHERE isletme_id = ? AND urun_kodu = ?',
      [isletme_id, urun.urun_kodu]
    );

    const mevcut = mevcutRows.length ? mevcutRows[0] : null;

    const eskiBarkodlar = (mevcut?.barkodlar || '').split(',').map(b => b.trim()).filter(Boolean);
    const yeniBarkodlar = urun.barkodlar.split(',').map(b => b.trim()).filter(Boolean);
    const tumBarkodlar = [...new Set([...eskiBarkodlar, ...yeniBarkodlar])].join(',');

    if (mevcut) {
      if (!mevcut.kullanici_guncelledi) {
        await pool.execute(
          `UPDATE isletme_urunler SET
            urun_adi = ?, isim_2 = ?, birim = ?, kategori = ?,
            barkodlar = ?, admin_version = ?, son_guncelleme = NOW(), guncelleme_kaynagi = 'admin'
          WHERE isletme_id = ? AND urun_kodu = ?`,
          [urun.urun_adi, urun.isim_2, urun.birim, urun.kategori, tumBarkodlar, urun.admin_version, isletme_id, urun.urun_kodu]
        );
      } else {
        await pool.execute(
          `UPDATE isletme_urunler SET
            barkodlar = ?, admin_version = ?, son_guncelleme = NOW(), guncelleme_kaynagi = 'admin'
          WHERE isletme_id = ? AND urun_kodu = ?`,
          [tumBarkodlar, urun.admin_version, isletme_id, urun.urun_kodu]
        );
      }
    } else {
      const id = crypto.randomUUID();
      await pool.execute(
        `INSERT INTO isletme_urunler
          (id, isletme_id, urun_kodu, urun_adi, isim_2, birim, barkodlar, kategori, admin_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, isletme_id, urun.urun_kodu, urun.urun_adi, urun.isim_2, urun.birim, tumBarkodlar, urun.kategori, urun.admin_version]
      );
    }
  }

  res.json({
    mesaj: 'Yükleme tamamlandı.',
    yeni: sonuclar.yeni.length,
    degisecek: sonuclar.degisecek.length,
    korunacak: sonuclar.korunacak.length,
    hatali: sonuclar.hatali.length
  });
});

module.exports = router;
