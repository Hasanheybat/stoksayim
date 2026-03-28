const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../lib/db');
const authGuard = require('../middleware/authGuard');
const yetkiGuard = require('../middleware/yetkiGuard');
const { msg, messages } = require('../lib/messages');

/* ── Toplanmış sayım mı kontrol helper ── */
function isToplanmisSayim(notlar) {
  try {
    const parsed = typeof notlar === 'string' ? JSON.parse(notlar) : notlar;
    return parsed?.toplanan_sayimlar?.length > 0;
  } catch (_) { return false; }
}

/* ── Yetki kontrol yardımcısı ── */
async function checkSayimYetki(sayim, req, res, islem) {
  if (req.user.rol === 'admin') return true;

  // Toplanmış sayım mı?
  const toplanmis = isToplanmisSayim(sayim.notlar);

  if (!toplanmis && sayim.kullanici_id !== req.user.id) {
    res.status(403).json({ hata: msg(req.lang, 'NO_ACCESS_TO_COUNT') });
    return false;
  }
  const [rows] = await pool.execute(
    'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
    [req.user.id, sayim.isletme_id]
  );
  // Toplanmış sayım → toplam_sayim kategorisi, normal → sayim kategorisi
  const kat = toplanmis ? 'toplam_sayim' : 'sayim';
  if (!rows.length || !rows[0].yetkiler?.[kat]?.[islem]) {
    res.status(403).json({ hata: messages._RESOURCE_NO_PERMISSION(req.lang, toplanmis ? 'Toplanmış sayım' : 'Sayım', islem) });
    return false;
  }
  return true;
}

router.use(authGuard);

// GET /api/sayimlar?isletme_id=X&isletme_ids=X,Y&depo_id=Y&durum=Z&q=arama&sayfa=1&limit=50
router.get('/', async (req, res) => {
  try {
  const { isletme_id, isletme_ids, depo_id, durum, q, toplama, sayfa = 1, limit = 50 } = req.query;

  // Yetki kontrolü: toplama=1 ise toplam_sayim.goruntule, değilse sayim.goruntule
  const yetkiKat = toplama === '1' ? 'toplam_sayim' : 'sayim';
  if (req.user.rol !== 'admin') {
    // Tüm isletme_ids için yetki kontrolü yap (sadece ilk değil, hepsi)
    const allIds = [];
    if (isletme_id) allIds.push(isletme_id);
    if (isletme_ids) allIds.push(...isletme_ids.split(',').filter(Boolean));
    for (const isId of allIds) {
      const [kiRows] = await pool.execute(
        'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
        [req.user.id, isId]
      );
      if (!kiRows.length || !kiRows[0].yetkiler?.[yetkiKat]?.goruntule) {
        return res.status(403).json({ hata: messages._RESOURCE_NO_PERMISSION(req.lang, yetkiKat, 'görüntüleme') });
      }
    }
  }
  const sp = Math.max(1, (v => Number.isNaN(v) ? 1 : v)(parseInt(sayfa)));
  const lm = Math.min(200, Math.max(1, (v => Number.isNaN(v) ? 50 : v)(parseInt(limit))));
  const offset = (sp - 1) * lm;

  const where = [];
  const params = [];

  if (isletme_id) { where.push('s.isletme_id = ?'); params.push(isletme_id); }
  if (isletme_ids) {
    const ids = isletme_ids.split(',').filter(Boolean);
    if (ids.length) { where.push(`s.isletme_id IN (${ids.map(() => '?').join(',')})`); params.push(...ids); }
  }
  if (depo_id) { where.push('s.depo_id = ?'); params.push(depo_id); }
  if (durum) { where.push('s.durum = ?'); params.push(durum); }
  if (q) {
    const qClean = q.replace(/^#/, '');
    where.push('(s.ad LIKE ? OR s.id LIKE ?)');
    params.push(`%${q}%`, `${qClean}%`);
  }
  if (toplama === '1') { where.push("s.notlar LIKE '%toplanan_sayimlar%'"); }
  if (toplama === '0') { where.push("(s.notlar IS NULL OR s.notlar NOT LIKE '%toplanan_sayimlar%')"); }

  // Normal kullanıcı sadece kendi sayımlarını görür ve isletme_id zorunlu
  if (req.user.rol !== 'admin') {
    if (!isletme_id) return res.status(400).json({ hata: msg(req.lang, 'BUSINESS_ID_REQUIRED') });
    where.push('s.kullanici_id = ?');
    params.push(req.user.id);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [[{ toplam }]] = await pool.execute(
    `SELECT COUNT(*) AS toplam FROM sayimlar s ${whereClause}`,
    params
  );

  const [data] = await pool.execute(
    `SELECT s.id, s.ad, s.tarih, s.durum, s.notlar, s.created_at, s.updated_at, s.isletme_id, s.depo_id,
       d.id AS depo_id_j, d.ad AS depo_ad,
       i.id AS isletme_id_j, i.ad AS isletme_ad,
       k.id AS kullanici_id_j, k.ad_soyad AS kullanici_ad_soyad
     FROM sayimlar s
     LEFT JOIN depolar d ON d.id = s.depo_id
     LEFT JOIN isletmeler i ON i.id = s.isletme_id
     LEFT JOIN kullanicilar k ON k.id = s.kullanici_id
     ${whereClause}
     ORDER BY s.created_at DESC
     LIMIT ${lm} OFFSET ${offset}`,
    params
  );

  const enriched = data.map(row => ({
    id: row.id, ad: row.ad, tarih: row.tarih, durum: row.durum,
    notlar: row.notlar, created_at: row.created_at, updated_at: row.updated_at,
    isletme_id: row.isletme_id, depo_id: row.depo_id,
    depolar: { id: row.depo_id_j, ad: row.depo_ad },
    isletmeler: { id: row.isletme_id_j, ad: row.isletme_ad },
    kullanicilar: { id: row.kullanici_id_j, ad_soyad: row.kullanici_ad_soyad },
  }));

  res.json({ data: enriched, toplam: toplam || 0 });
  } catch (err) {
    console.error('[sayimlar GET /]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// GET /api/sayimlar/:id
router.get('/:id', async (req, res) => {
  try {
  // 1. Sayım bilgisi + JOINler
  const [sayimRows] = await pool.execute(
    `SELECT s.*,
       d.id AS depo_id_j, d.ad AS depo_ad, d.kod AS depo_kod,
       k.id AS kullanici_id_j, k.ad_soyad AS kullanici_ad_soyad,
       i.id AS isletme_id_j, i.ad AS isletme_ad, i.aktif AS isletme_aktif
     FROM sayimlar s
     LEFT JOIN depolar d ON d.id = s.depo_id
     LEFT JOIN kullanicilar k ON k.id = s.kullanici_id
     LEFT JOIN isletmeler i ON i.id = s.isletme_id
     WHERE s.id = ?`,
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: msg(req.lang, 'COUNT_NOT_FOUND') });

  const sayim = sayimRows[0];

  // Yetki kontrolü: toplanmış → toplam_sayim.goruntule, normal → sayim.goruntule
  if (!await checkSayimYetki(sayim, req, res, 'goruntule')) return;

  // 2. Kalemler
  const [kalemler] = await pool.execute(
    `SELECT sk.id, sk.miktar, sk.birim, sk.notlar, sk.created_at,
       u.id AS urun_id, u.urun_kodu, u.urun_adi, u.isim_2, u.barkodlar, u.birim AS urun_birim, u.aktif AS urun_aktif
     FROM sayim_kalemleri sk
     LEFT JOIN isletme_urunler u ON u.id = sk.urun_id
     WHERE sk.sayim_id = ?
     ORDER BY sk.created_at`,
    [req.params.id]
  );

  // 3. Birleştir
  const result = {
    id: sayim.id, ad: sayim.ad, tarih: sayim.tarih, durum: sayim.durum,
    notlar: sayim.notlar, kisiler: sayim.kisiler,
    isletme_id: sayim.isletme_id, depo_id: sayim.depo_id, kullanici_id: sayim.kullanici_id,
    created_at: sayim.created_at, updated_at: sayim.updated_at,
    depolar: { id: sayim.depo_id_j, ad: sayim.depo_ad, kod: sayim.depo_kod },
    kullanicilar: { id: sayim.kullanici_id_j, ad_soyad: sayim.kullanici_ad_soyad },
    isletmeler: { id: sayim.isletme_id_j, ad: sayim.isletme_ad, aktif: sayim.isletme_aktif },
    sayim_kalemleri: kalemler.map(k => ({
      id: k.id, miktar: k.miktar, birim: k.birim, notlar: k.notlar, created_at: k.created_at,
      isletme_urunler: k.urun_id ? {
        id: k.urun_id, urun_kodu: k.urun_kodu, urun_adi: k.urun_adi,
        isim_2: k.isim_2, barkodlar: k.barkodlar, birim: k.urun_birim,
        aktif: k.urun_aktif,
      } : null,
    })),
  };

  res.json(result);
  } catch (err) {
    console.error('[sayimlar GET /:id]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// DELETE /api/sayimlar/:id (durum = 'silindi')
router.delete('/:id', async (req, res) => {
  try {
  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, durum, isletme_id FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: msg(req.lang, 'COUNT_NOT_FOUND') });
  const sayim = sayimRows[0];

  // Toplanmış sayım mı kontrol et
  let isToplanmis = false;
  if (sayim.durum === 'tamamlandi') {
    const [notlarCheck] = await pool.execute('SELECT notlar FROM sayimlar WHERE id = ?', [req.params.id]);
    const notlar = notlarCheck[0]?.notlar;
    try {
      const parsed = typeof notlar === 'string' ? JSON.parse(notlar) : notlar;
      isToplanmis = parsed?.toplanan_sayimlar?.length > 0;
    } catch (_) {}
  }

  if (req.user.rol !== 'admin') {
    if (!isToplanmis && sayim.kullanici_id !== req.user.id) {
      return res.status(403).json({ hata: msg(req.lang, 'NO_ACCESS_TO_COUNT') });
    }
    const [kiRows] = await pool.execute(
      'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
      [req.user.id, sayim.isletme_id]
    );
    // Toplanmış sayım → toplam_sayim.sil, normal sayım → sayim.sil
    const yetkiKategori = isToplanmis ? 'toplam_sayim' : 'sayim';
    if (!kiRows.length || !kiRows[0].yetkiler?.[yetkiKategori]?.sil) {
      return res.status(403).json({ hata: messages._RESOURCE_NO_PERMISSION(req.lang, isToplanmis ? 'Toplanmış sayım' : 'Sayım', 'silme') });
    }
  }

  // Normal tamamlanmış sayımlar silinemez (toplanmış olanlar silinebilir)
  if (sayim.durum === 'tamamlandi' && !isToplanmis) {
    return res.status(400).json({ hata: msg(req.lang, 'COMPLETED_COUNT_NO_DELETE') });
  }

  await pool.execute("UPDATE sayimlar SET durum = 'silindi' WHERE id = ?", [req.params.id]);
  res.json({ mesaj: msg(req.lang, 'COUNT_DELETED') });
  } catch (err) {
    console.error('[sayimlar DELETE /:id]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// PUT /api/sayimlar/:id/restore — Silinen sayımı geri al (admin only)
router.put('/:id/restore', async (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ hata: msg(req.lang, 'ONLY_ADMIN_CAN_DO_THIS') });
  try {
    const [rows] = await pool.execute('SELECT id, durum FROM sayimlar WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ hata: msg(req.lang, 'COUNT_NOT_FOUND') });
    if (rows[0].durum !== 'silindi') return res.status(400).json({ hata: msg(req.lang, 'COUNT_NOT_DELETED_STATE') });
    await pool.execute("UPDATE sayimlar SET durum = 'devam' WHERE id = ?", [req.params.id]);
    res.json({ mesaj: msg(req.lang, 'COUNT_RESTORED') });
  } catch (err) {
    console.error('[sayimlar]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// POST /api/sayimlar
router.post('/', yetkiGuard('sayim', 'ekle', 'body'), async (req, res) => {
  const { isletme_id, depo_id, ad, tarih, notlar } = req.body;

  if (!isletme_id || !depo_id || !ad) {
    return res.status(400).json({ hata: msg(req.lang, 'COUNT_FIELDS_REQUIRED') });
  }

  const id = crypto.randomUUID();
  try {
    await pool.execute(
      `INSERT INTO sayimlar (id, isletme_id, depo_id, kullanici_id, ad, tarih, notlar)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, isletme_id, depo_id, req.user.id, ad, tarih || new Date().toISOString().split('T')[0], notlar || null]
    );
    const [rows] = await pool.execute('SELECT * FROM sayimlar WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[sayimlar]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// PUT /api/sayimlar/:id  — sayim.duzenle / toplam_sayim.duzenle yetkisi gerekli
router.put('/:id', async (req, res) => {
  const { depo_id, ad, kisiler, updated_at: clientUpdatedAt } = req.body;

  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, isletme_id, durum, notlar, updated_at FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: msg(req.lang, 'COUNT_NOT_FOUND') });
  const sayim = sayimRows[0];

  // Toplanmış sayım mı kontrol et
  let isToplanmis = false;
  try {
    const parsed = typeof sayim.notlar === 'string' ? JSON.parse(sayim.notlar) : sayim.notlar;
    isToplanmis = parsed?.toplanan_sayimlar?.length > 0;
  } catch (_) {}

  if (req.user.rol !== 'admin') {
    if (!isToplanmis && sayim.kullanici_id !== req.user.id) {
      return res.status(403).json({ hata: msg(req.lang, 'NO_ACCESS_TO_COUNT') });
    }
    const yetkiKat = isToplanmis ? 'toplam_sayim' : 'sayim';
    const [kiRows] = await pool.execute(
      'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
      [req.user.id, sayim.isletme_id]
    );
    if (!kiRows.length || !kiRows[0].yetkiler?.[yetkiKat]?.duzenle) {
      return res.status(403).json({ hata: messages._RESOURCE_NO_PERMISSION(req.lang, isToplanmis ? 'Toplanmış sayım' : 'Sayım', 'düzenleme') });
    }
  }

  // Tamamlanmış sayımlarda sadece isim değiştirilebilir
  if (sayim.durum !== 'devam' && (depo_id !== undefined || kisiler !== undefined)) {
    return res.status(400).json({ hata: msg(req.lang, 'COMPLETED_COUNT_NAME_ONLY') });
  }

  const fields = [];
  const params = [];
  if (depo_id !== undefined) { fields.push('depo_id = ?'); params.push(depo_id); }
  if (ad !== undefined) { fields.push('ad = ?'); params.push(ad); }
  if (kisiler !== undefined) { fields.push('kisiler = ?'); params.push(JSON.stringify(kisiler)); }

  if (!fields.length) {
    const [rows] = await pool.execute('SELECT * FROM sayimlar WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
  }

  fields.push('updated_at = NOW()');
  params.push(req.params.id);
  try {
    // updated_at format normalize: JS ISO string → MySQL local datetime
    // mysql2 driver tarihleri JS Date (UTC) olarak döner, JSON.stringify UTC'ye çevirir
    // Ama MySQL'deki datetime local timezone'da saklanır → local time string'e çevirmek gerekir
    let normalizedUpdatedAt = clientUpdatedAt;
    if (clientUpdatedAt) {
      const d = new Date(clientUpdatedAt);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        normalizedUpdatedAt = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
    }
    const updateParams = normalizedUpdatedAt ? [...params, normalizedUpdatedAt] : params;
    const whereClause = normalizedUpdatedAt ? 'WHERE id = ? AND updated_at = ?' : 'WHERE id = ?';
    const [result] = await pool.execute(`UPDATE sayimlar SET ${fields.join(', ')} ${whereClause}`, updateParams);
    if (result.affectedRows === 0) {
      return res.status(409).json({ hata: msg(req.lang, 'OPTIMISTIC_LOCK_CONFLICT') });
    }
    const [rows] = await pool.execute('SELECT * FROM sayimlar WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('[sayimlar]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// PUT /api/sayimlar/:id/tamamla
router.put('/:id/tamamla', async (req, res) => {
  try {
  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, durum, isletme_id, notlar FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: msg(req.lang, 'COUNT_NOT_FOUND') });
  const sayim = sayimRows[0];

  if (!await checkSayimYetki(sayim, req, res, 'duzenle')) return;

  if (sayim.durum !== 'devam') {
    return res.status(400).json({ hata: msg(req.lang, 'ONLY_ONGOING_CAN_COMPLETE') });
  }

  await pool.execute("UPDATE sayimlar SET durum = 'tamamlandi' WHERE id = ?", [req.params.id]);
  const [rows] = await pool.execute('SELECT * FROM sayimlar WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
  } catch (err) {
    console.error('[sayimlar PUT /:id/tamamla]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// PUT /api/sayimlar/:id/yeniden-ac  (sadece admin)
router.put('/:id/yeniden-ac', async (req, res) => {
  try {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ hata: msg(req.lang, 'REOPEN_ADMIN_ONLY') });
  }

  const [sayimRows] = await pool.execute(
    'SELECT durum FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: msg(req.lang, 'COUNT_NOT_FOUND') });
  if (sayimRows[0].durum === 'devam') return res.status(400).json({ hata: msg(req.lang, 'COUNT_ALREADY_OPEN') });

  await pool.execute("UPDATE sayimlar SET durum = 'devam' WHERE id = ?", [req.params.id]);
  const [rows] = await pool.execute('SELECT * FROM sayimlar WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
  } catch (err) {
    console.error('[sayimlar PUT /:id/yeniden-ac]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// GET /api/sayimlar/:id/kalemler
router.get('/:id/kalemler', async (req, res) => {
  try {
  // Sayımın var olduğunu doğrula
  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, isletme_id, notlar FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: msg(req.lang, 'COUNT_NOT_FOUND') });
  const sayim = sayimRows[0];

  if (!await checkSayimYetki(sayim, req, res, 'goruntule')) return;

  const [data] = await pool.execute(
    `SELECT sk.*,
       u.id AS urun_id_j, u.urun_kodu, u.urun_adi, u.isim_2, u.barkodlar, u.birim AS urun_birim, u.aktif AS urun_aktif
     FROM sayim_kalemleri sk
     LEFT JOIN isletme_urunler u ON u.id = sk.urun_id
     WHERE sk.sayim_id = ?
     ORDER BY sk.created_at`,
    [req.params.id]
  );

  const enriched = data.map(row => ({
    id: row.id, sayim_id: row.sayim_id, urun_id: row.urun_id,
    miktar: row.miktar, birim: row.birim, notlar: row.notlar, created_at: row.created_at,
    isletme_urunler: row.urun_id_j ? {
      id: row.urun_id_j, urun_kodu: row.urun_kodu, urun_adi: row.urun_adi,
      isim_2: row.isim_2, barkodlar: row.barkodlar, birim: row.urun_birim,
      aktif: row.urun_aktif,
    } : null,
  }));

  res.json(enriched);
  } catch (err) {
    console.error('[sayimlar GET /:id/kalemler]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// POST /api/sayimlar/:id/kalem
router.post('/:id/kalem', async (req, res) => {
  const { urun_id, miktar, birim, notlar } = req.body;

  if (!urun_id || miktar === undefined) {
    return res.status(400).json({ hata: msg(req.lang, 'ITEM_ID_AND_QUANTITY_REQUIRED') });
  }
  if (isNaN(Number(miktar))) {
    return res.status(400).json({ hata: msg(req.lang, 'QUANTITY_MUST_BE_NUMBER') });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Sayımın var olduğunu ve kullanıcının sahibi olduğunu doğrula (FOR UPDATE ile kilitle)
    const [sayimRows] = await conn.execute(
      'SELECT kullanici_id, isletme_id, durum, notlar FROM sayimlar WHERE id = ? FOR UPDATE',
      [req.params.id]
    );

    if (!sayimRows.length) { await conn.rollback(); return res.status(404).json({ hata: msg(req.lang, 'COUNT_NOT_FOUND') }); }
    const sayim = sayimRows[0];

    if (!await checkSayimYetki(sayim, req, res, 'duzenle')) { await conn.rollback(); return; }

    if (sayim.durum !== 'devam') {
      await conn.rollback();
      return res.status(400).json({ hata: msg(req.lang, 'COMPLETED_COUNT_NO_ADD_ITEM') });
    }

    // Ürünün aynı işletmeye ait olduğunu kontrol et
    const [urunRows] = await conn.execute(
      'SELECT isletme_id FROM isletme_urunler WHERE id = ?', [urun_id]
    );
    if (!urunRows.length) { await conn.rollback(); return res.status(404).json({ hata: msg(req.lang, 'PRODUCT_NOT_FOUND') }); }
    if (urunRows[0].isletme_id !== sayim.isletme_id) {
      await conn.rollback();
      return res.status(400).json({ hata: msg(req.lang, 'PRODUCT_NOT_IN_BUSINESS') });
    }

    const id = crypto.randomUUID();
    await conn.execute(
      'INSERT INTO sayim_kalemleri (id, sayim_id, urun_id, miktar, birim, notlar) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.params.id, urun_id, miktar, birim || null, notlar || null]
    );

    await conn.commit();

    // Kalem + ürün bilgisi ile dön
    const [rows] = await pool.execute(
      `SELECT sk.*, u.id AS urun_id_j, u.urun_kodu, u.urun_adi
       FROM sayim_kalemleri sk
       LEFT JOIN isletme_urunler u ON u.id = sk.urun_id
       WHERE sk.id = ?`,
      [id]
    );

    const row = rows[0];
    res.status(201).json({
      id: row.id, sayim_id: row.sayim_id, urun_id: row.urun_id,
      miktar: row.miktar, birim: row.birim, notlar: row.notlar, created_at: row.created_at,
      isletme_urunler: row.urun_id_j ? {
        id: row.urun_id_j, urun_kodu: row.urun_kodu, urun_adi: row.urun_adi,
      } : null,
    });
  } catch (err) {
    await conn.rollback();
    console.error('[sayimlar]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  } finally {
    conn.release();
  }
});

// PUT /api/sayimlar/:id/kalem/:kalem_id  — sayim/toplam_sayim.duzenle yetkisi gerekli
router.put('/:id/kalem/:kalem_id', async (req, res) => {
  try {
  const { miktar, birim, notlar } = req.body;

  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, isletme_id, durum, notlar AS notlar_json FROM sayimlar WHERE id = ?',
    [req.params.id]
  );
  if (!sayimRows.length) return res.status(404).json({ hata: msg(req.lang, 'COUNT_NOT_FOUND') });
  const sayim = { ...sayimRows[0], notlar: sayimRows[0].notlar_json };

  if (!await checkSayimYetki(sayim, req, res, 'duzenle')) return;

  if (sayim.durum !== 'devam') return res.status(400).json({ hata: msg(req.lang, 'COMPLETED_COUNT_NO_EDIT') });

  const updates = [];
  const values = [];
  if (miktar !== undefined) { updates.push('miktar = ?'); values.push(miktar); }
  if (birim !== undefined) { updates.push('birim = ?'); values.push(birim); }
  if (notlar !== undefined) { updates.push('notlar = ?'); values.push(notlar); }
  if (!updates.length) return res.status(400).json({ hata: msg(req.lang, 'NO_FIELDS_TO_UPDATE') });
  values.push(req.params.kalem_id, req.params.id);

  await pool.execute(
    `UPDATE sayim_kalemleri SET ${updates.join(', ')} WHERE id = ? AND sayim_id = ?`,
    values
  );

  const [rows] = await pool.execute('SELECT * FROM sayim_kalemleri WHERE id = ? AND sayim_id = ?', [req.params.kalem_id, req.params.id]);
  if (!rows.length) return res.status(404).json({ hata: msg(req.lang, 'ITEM_NOT_FOUND') });
  res.json(rows[0]);
  } catch (err) {
    console.error('[sayimlar PUT /:id/kalem/:kalem_id]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// DELETE /api/sayimlar/:id/kalem/:kalem_id  — sayim/toplam_sayim.duzenle yetkisi gerekli
router.delete('/:id/kalem/:kalem_id', async (req, res) => {
  try {
  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, isletme_id, durum, notlar FROM sayimlar WHERE id = ?',
    [req.params.id]
  );
  if (!sayimRows.length) return res.status(404).json({ hata: msg(req.lang, 'COUNT_NOT_FOUND') });
  const sayim = sayimRows[0];

  if (!await checkSayimYetki(sayim, req, res, 'duzenle')) return;

  if (sayim.durum !== 'devam') return res.status(400).json({ hata: msg(req.lang, 'COMPLETED_COUNT_NO_DELETE_ITEM') });

  await pool.execute(
    'DELETE FROM sayim_kalemleri WHERE id = ? AND sayim_id = ?',
    [req.params.kalem_id, req.params.id]
  );

  res.json({ mesaj: msg(req.lang, 'ITEM_DELETED') });
  } catch (err) {
    console.error('[sayimlar DELETE /:id/kalem/:kalem_id]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  }
});

// POST /api/sayimlar/topla — Seçilen sayımların kalemlerini toplayarak yeni sayım oluştur
router.post('/topla', yetkiGuard('toplam_sayim', 'ekle', 'body'), async (req, res) => {
  const { sayim_ids, ad, isletme_id } = req.body;

  if (!sayim_ids || !Array.isArray(sayim_ids) || sayim_ids.length < 2) {
    return res.status(400).json({ hata: msg(req.lang, 'MERGE_MIN_TWO') });
  }
  if (!ad || !ad.trim()) {
    return res.status(400).json({ hata: msg(req.lang, 'MERGE_NAME_REQUIRED') });
  }
  if (!isletme_id) {
    return res.status(400).json({ hata: msg(req.lang, 'BUSINESS_ID_REQUIRED') });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Seçilen sayımları doğrula (FOR UPDATE ile kilitle)
    const placeholders = sayim_ids.map(() => '?').join(',');
    const [sayimlar] = await conn.execute(
      `SELECT s.id, s.isletme_id, s.depo_id, s.kullanici_id, s.ad, s.tarih, s.durum, d.ad AS depo_ad FROM sayimlar s LEFT JOIN depolar d ON s.depo_id = d.id WHERE s.id IN (${placeholders}) AND s.durum = 'tamamlandi' FOR UPDATE`,
      sayim_ids
    );

    if (sayimlar.length !== sayim_ids.length) {
      await conn.rollback();
      return res.status(400).json({ hata: msg(req.lang, 'MERGE_ONLY_COMPLETED') });
    }

    // Tüm sayımların aynı işletmeye ait olduğunu doğrula
    const ilkIsletmeId = sayimlar[0].isletme_id;
    if (!sayimlar.every(s => s.isletme_id === ilkIsletmeId)) {
      await conn.rollback();
      return res.status(400).json({ hata: msg(req.lang, 'MERGE_SAME_BUSINESS') });
    }

    // Yetki kontrolü — kullanıcı sadece kendi sayımlarını toplayabilir (admin hariç)
    if (req.user.rol !== 'admin') {
      const yetkisiz = sayimlar.find(s => s.kullanici_id !== req.user.id);
      if (yetkisiz) {
        await conn.rollback();
        return res.status(403).json({ hata: msg(req.lang, 'MERGE_OWN_COUNTS_ONLY') });
      }
    }

    // 2. Seçilen sayımların kalemlerini çek
    const [kalemler] = await conn.execute(
      `SELECT sk.sayim_id, sk.urun_id, sk.miktar, sk.birim
       FROM sayim_kalemleri sk
       WHERE sk.sayim_id IN (${placeholders}) FOR UPDATE`,
      sayim_ids
    );

    // 3. Aynı urun_id'lerin miktarlarını topla
    const toplamMap = {};
    for (const k of kalemler) {
      if (!toplamMap[k.urun_id]) {
        toplamMap[k.urun_id] = { miktar: 0, birim: k.birim };
      }
      toplamMap[k.urun_id].miktar += parseFloat(k.miktar) || 0;
    }

    // 4. İlk sayımın depo_id'sini kullan
    const depo_id = sayimlar[0].depo_id;

    // 5. Notlar alanına kaynak sayımları yaz
    const notlar = JSON.stringify({
      toplanan_sayimlar: sayimlar.map(s => ({ id: s.id, ad: s.ad, tarih: s.tarih, depo: s.depo_ad }))
    });

    // 6. Yeni sayım oluştur
    const yeniId = crypto.randomUUID();
    await conn.execute(
      `INSERT INTO sayimlar (id, isletme_id, depo_id, kullanici_id, ad, tarih, durum, notlar)
       VALUES (?, ?, ?, ?, ?, ?, 'tamamlandi', ?)`,
      [yeniId, isletme_id, depo_id, req.user.id, ad.trim(), new Date().toISOString().split('T')[0], notlar]
    );

    // 7. Toplanmış kalemleri ekle
    for (const [urun_id, data] of Object.entries(toplamMap)) {
      const kalemId = crypto.randomUUID();
      await conn.execute(
        `INSERT INTO sayim_kalemleri (id, sayim_id, urun_id, miktar, birim)
         VALUES (?, ?, ?, ?, ?)`,
        [kalemId, yeniId, urun_id, data.miktar, data.birim]
      );
    }

    await conn.commit();

    // 8. Oluşturulan sayımı döndür
    const [rows] = await pool.execute('SELECT * FROM sayimlar WHERE id = ?', [yeniId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('Sayım toplama hatası:', err);
    console.error('[sayimlar]', err.message);
    return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
  } finally {
    conn.release();
  }
});

module.exports = router;
