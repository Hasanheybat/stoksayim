const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../lib/db');
const authGuard = require('../middleware/authGuard');
const yetkiGuard = require('../middleware/yetkiGuard');

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
    res.status(403).json({ hata: 'Bu sayıma erişim yetkiniz yok.' });
    return false;
  }
  const [rows] = await pool.execute(
    'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
    [req.user.id, sayim.isletme_id]
  );
  // Toplanmış sayım → toplam_sayim kategorisi, normal → sayim kategorisi
  const kat = toplanmis ? 'toplam_sayim' : 'sayim';
  if (!rows.length || !rows[0].yetkiler?.[kat]?.[islem]) {
    res.status(403).json({ hata: toplanmis ? `Toplanmış sayım ${islem} yetkiniz yok.` : `Sayım ${islem} yetkiniz yok.` });
    return false;
  }
  return true;
}

router.use(authGuard);

// GET /api/sayimlar?isletme_id=X&isletme_ids=X,Y&depo_id=Y&durum=Z&q=arama&sayfa=1&limit=50
router.get('/', async (req, res) => {
  const { isletme_id, isletme_ids, depo_id, durum, q, toplama, sayfa = 1, limit = 50 } = req.query;

  // Yetki kontrolü: toplama=1 ise toplam_sayim.goruntule, değilse sayim.goruntule
  const yetkiKat = toplama === '1' ? 'toplam_sayim' : 'sayim';
  if (req.user.rol !== 'admin') {
    const isId = isletme_id || (isletme_ids ? isletme_ids.split(',')[0] : null);
    if (isId) {
      const [kiRows] = await pool.execute(
        'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
        [req.user.id, isId]
      );
      if (!kiRows.length || !kiRows[0].yetkiler?.[yetkiKat]?.goruntule) {
        return res.status(403).json({ hata: `${yetkiKat} görüntüleme yetkiniz yok.` });
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
  if (q) { where.push('s.ad LIKE ?'); params.push(`%${q}%`); }
  if (toplama === '1') { where.push("s.notlar LIKE '%toplanan_sayimlar%'"); }
  if (toplama === '0') { where.push("(s.notlar IS NULL OR s.notlar NOT LIKE '%toplanan_sayimlar%')"); }

  // Normal kullanıcı sadece kendi sayımlarını görür ve isletme_id zorunlu
  if (req.user.rol !== 'admin') {
    if (!isletme_id) return res.status(400).json({ hata: 'isletme_id zorunludur.' });
    where.push('s.kullanici_id = ?');
    params.push(req.user.id);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [[{ toplam }]] = await pool.execute(
    `SELECT COUNT(*) AS toplam FROM sayimlar s ${whereClause}`,
    params
  );

  const [data] = await pool.execute(
    `SELECT s.id, s.ad, s.tarih, s.durum, s.notlar, s.created_at, s.isletme_id, s.depo_id,
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
    notlar: row.notlar, created_at: row.created_at,
    isletme_id: row.isletme_id, depo_id: row.depo_id,
    depolar: { id: row.depo_id_j, ad: row.depo_ad },
    isletmeler: { id: row.isletme_id_j, ad: row.isletme_ad },
    kullanicilar: { id: row.kullanici_id_j, ad_soyad: row.kullanici_ad_soyad },
  }));

  res.json({ data: enriched, toplam: toplam || 0 });
});

// GET /api/sayimlar/:id
router.get('/:id', async (req, res) => {
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

  if (!sayimRows.length) return res.status(404).json({ hata: 'Sayım bulunamadı.' });

  const sayim = sayimRows[0];

  // Yetki kontrolü: toplanmış → toplam_sayim.goruntule, normal → sayim.goruntule
  if (!await checkSayimYetki(sayim, req, res, 'goruntule')) return;

  // 2. Kalemler
  const [kalemler] = await pool.execute(
    `SELECT sk.id, sk.miktar, sk.birim, sk.notlar, sk.created_at,
       u.id AS urun_id, u.urun_kodu, u.urun_adi, u.isim_2, u.barkodlar, u.birim AS urun_birim
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
      } : null,
    })),
  };

  res.json(result);
});

// DELETE /api/sayimlar/:id (durum = 'silindi')
router.delete('/:id', async (req, res) => {
  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, durum, isletme_id FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
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
      return res.status(403).json({ hata: 'Bu sayımı silme yetkiniz yok.' });
    }
    const [kiRows] = await pool.execute(
      'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
      [req.user.id, sayim.isletme_id]
    );
    // Toplanmış sayım → toplam_sayim.sil, normal sayım → sayim.sil
    const yetkiKategori = isToplanmis ? 'toplam_sayim' : 'sayim';
    if (!kiRows.length || !kiRows[0].yetkiler?.[yetkiKategori]?.sil) {
      return res.status(403).json({ hata: isToplanmis ? 'Toplanmış sayım silme yetkiniz yok.' : 'Sayım silme yetkiniz yok.' });
    }
  }

  // Normal tamamlanmış sayımlar silinemez (toplanmış olanlar silinebilir)
  if (sayim.durum === 'tamamlandi' && !isToplanmis) {
    return res.status(400).json({ hata: 'Tamamlanmış sayım silinemez.' });
  }

  await pool.execute("UPDATE sayimlar SET durum = 'silindi' WHERE id = ?", [req.params.id]);
  res.json({ mesaj: 'Sayım silindi.' });
});

// POST /api/sayimlar
router.post('/', yetkiGuard('sayim', 'ekle', 'body'), async (req, res) => {
  const { isletme_id, depo_id, ad, tarih, notlar } = req.body;

  if (!isletme_id || !depo_id || !ad) {
    return res.status(400).json({ hata: 'isletme_id, depo_id ve ad zorunludur.' });
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
    return res.status(500).json({ hata: err.message });
  }
});

// PUT /api/sayimlar/:id  — sayim.duzenle / toplam_sayim.duzenle yetkisi gerekli
router.put('/:id', async (req, res) => {
  const { depo_id, ad, kisiler } = req.body;

  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, isletme_id, durum, notlar FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
  const sayim = sayimRows[0];

  // Toplanmış sayım mı kontrol et
  let isToplanmis = false;
  try {
    const parsed = typeof sayim.notlar === 'string' ? JSON.parse(sayim.notlar) : sayim.notlar;
    isToplanmis = parsed?.toplanan_sayimlar?.length > 0;
  } catch (_) {}

  if (req.user.rol !== 'admin') {
    if (!isToplanmis && sayim.kullanici_id !== req.user.id) {
      return res.status(403).json({ hata: 'Bu sayımı düzenleme yetkiniz yok.' });
    }
    const yetkiKat = isToplanmis ? 'toplam_sayim' : 'sayim';
    const [kiRows] = await pool.execute(
      'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
      [req.user.id, sayim.isletme_id]
    );
    if (!kiRows.length || !kiRows[0].yetkiler?.[yetkiKat]?.duzenle) {
      return res.status(403).json({ hata: `${isToplanmis ? 'Toplanmış sayım' : 'Sayım'} düzenleme yetkiniz yok.` });
    }
  }

  // Tamamlanmış sayımlarda sadece isim değiştirilebilir
  if (sayim.durum !== 'devam' && (depo_id !== undefined || kisiler !== undefined)) {
    return res.status(400).json({ hata: 'Tamamlanmış sayımda sadece isim değiştirilebilir.' });
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

  params.push(req.params.id);
  try {
    await pool.execute(`UPDATE sayimlar SET ${fields.join(', ')} WHERE id = ?`, params);
    const [rows] = await pool.execute('SELECT * FROM sayimlar WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ hata: err.message });
  }
});

// PUT /api/sayimlar/:id/tamamla
router.put('/:id/tamamla', async (req, res) => {
  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, durum, isletme_id, notlar FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
  const sayim = sayimRows[0];

  if (!await checkSayimYetki(sayim, req, res, 'duzenle')) return;

  if (sayim.durum !== 'devam') {
    return res.status(400).json({ hata: 'Sadece devam eden sayımlar tamamlanabilir.' });
  }

  await pool.execute("UPDATE sayimlar SET durum = 'tamamlandi' WHERE id = ?", [req.params.id]);
  const [rows] = await pool.execute('SELECT * FROM sayimlar WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

// PUT /api/sayimlar/:id/yeniden-ac  (sadece admin)
router.put('/:id/yeniden-ac', async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ hata: 'Sayımı yeniden açma yetkisi yalnızca adminlere aittir.' });
  }

  const [sayimRows] = await pool.execute(
    'SELECT durum FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
  if (sayimRows[0].durum === 'devam') return res.status(400).json({ hata: 'Sayım zaten açık durumda.' });

  await pool.execute("UPDATE sayimlar SET durum = 'devam' WHERE id = ?", [req.params.id]);
  const [rows] = await pool.execute('SELECT * FROM sayimlar WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

// GET /api/sayimlar/:id/kalemler
router.get('/:id/kalemler', async (req, res) => {
  // Sayımın var olduğunu doğrula
  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, isletme_id, notlar FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
  const sayim = sayimRows[0];

  if (!await checkSayimYetki(sayim, req, res, 'goruntule')) return;

  const [data] = await pool.execute(
    `SELECT sk.*,
       u.id AS urun_id_j, u.urun_kodu, u.urun_adi, u.isim_2, u.barkodlar, u.birim AS urun_birim
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
    } : null,
  }));

  res.json(enriched);
});

// POST /api/sayimlar/:id/kalem
router.post('/:id/kalem', async (req, res) => {
  const { urun_id, miktar, birim, notlar } = req.body;

  if (!urun_id || miktar === undefined) {
    return res.status(400).json({ hata: 'urun_id ve miktar zorunludur.' });
  }

  // Sayımın var olduğunu ve kullanıcının sahibi olduğunu doğrula
  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, isletme_id, durum, notlar FROM sayimlar WHERE id = ?',
    [req.params.id]
  );

  if (!sayimRows.length) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
  const sayim = sayimRows[0];

  if (sayim.durum !== 'devam') {
    return res.status(400).json({ hata: 'Tamamlanmış sayıma kalem eklenemez.' });
  }

  const id = crypto.randomUUID();
  try {
    await pool.execute(
      'INSERT INTO sayim_kalemleri (id, sayim_id, urun_id, miktar, birim, notlar) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.params.id, urun_id, miktar, birim || null, notlar || null]
    );

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
    return res.status(500).json({ hata: err.message });
  }
});

// PUT /api/sayimlar/:id/kalem/:kalem_id  — sayim/toplam_sayim.duzenle yetkisi gerekli
router.put('/:id/kalem/:kalem_id', async (req, res) => {
  const { miktar, birim, notlar } = req.body;

  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, isletme_id, durum, notlar AS notlar_json FROM sayimlar WHERE id = ?',
    [req.params.id]
  );
  if (!sayimRows.length) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
  const sayim = { ...sayimRows[0], notlar: sayimRows[0].notlar_json };

  if (sayim.durum !== 'devam') return res.status(400).json({ hata: 'Tamamlanmış sayım düzenlenemez.' });

  const updates = [];
  const values = [];
  if (miktar !== undefined) { updates.push('miktar = ?'); values.push(miktar); }
  if (birim !== undefined) { updates.push('birim = ?'); values.push(birim); }
  if (notlar !== undefined) { updates.push('notlar = ?'); values.push(notlar); }
  if (!updates.length) return res.status(400).json({ hata: 'Güncellenecek alan yok.' });
  values.push(req.params.kalem_id, req.params.id);

  await pool.execute(
    `UPDATE sayim_kalemleri SET ${updates.join(', ')} WHERE id = ? AND sayim_id = ?`,
    values
  );

  const [rows] = await pool.execute('SELECT * FROM sayim_kalemleri WHERE id = ? AND sayim_id = ?', [req.params.kalem_id, req.params.id]);
  if (!rows.length) return res.status(404).json({ hata: 'Kalem bulunamadı.' });
  res.json(rows[0]);
});

// DELETE /api/sayimlar/:id/kalem/:kalem_id  — sayim/toplam_sayim.duzenle yetkisi gerekli
router.delete('/:id/kalem/:kalem_id', async (req, res) => {
  const [sayimRows] = await pool.execute(
    'SELECT kullanici_id, isletme_id, durum, notlar FROM sayimlar WHERE id = ?',
    [req.params.id]
  );
  if (!sayimRows.length) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
  const sayim = sayimRows[0];

  if (sayim.durum !== 'devam') return res.status(400).json({ hata: 'Tamamlanmış sayımdan kalem silinemez.' });

  await pool.execute(
    'DELETE FROM sayim_kalemleri WHERE id = ? AND sayim_id = ?',
    [req.params.kalem_id, req.params.id]
  );

  res.json({ mesaj: 'Kalem silindi.' });
});

// POST /api/sayimlar/topla — Seçilen sayımların kalemlerini toplayarak yeni sayım oluştur
router.post('/topla', yetkiGuard('toplam_sayim', 'ekle', 'body'), async (req, res) => {
  const { sayim_ids, ad, isletme_id } = req.body;

  if (!sayim_ids || !Array.isArray(sayim_ids) || sayim_ids.length < 2) {
    return res.status(400).json({ hata: 'En az 2 sayım seçilmelidir.' });
  }
  if (!ad || !ad.trim()) {
    return res.status(400).json({ hata: 'Toplanmış sayım adı zorunludur.' });
  }
  if (!isletme_id) {
    return res.status(400).json({ hata: 'isletme_id zorunludur.' });
  }

  try {
    // 1. Seçilen sayımları doğrula
    const placeholders = sayim_ids.map(() => '?').join(',');
    const [sayimlar] = await pool.execute(
      `SELECT s.id, s.isletme_id, s.depo_id, s.kullanici_id, s.ad, s.tarih, d.ad AS depo_ad FROM sayimlar s LEFT JOIN depolar d ON s.depo_id = d.id WHERE s.id IN (${placeholders}) AND s.durum != 'silindi'`,
      sayim_ids
    );

    if (sayimlar.length !== sayim_ids.length) {
      return res.status(400).json({ hata: 'Bazı sayımlar bulunamadı.' });
    }

    // Yetki kontrolü — kullanıcı sadece kendi sayımlarını toplayabilir (admin hariç)
    if (req.user.rol !== 'admin') {
      const yetkisiz = sayimlar.find(s => s.kullanici_id !== req.user.id);
      if (yetkisiz) {
        return res.status(403).json({ hata: 'Sadece kendi sayımlarınızı toplayabilirsiniz.' });
      }
    }

    // 2. Seçilen sayımların kalemlerini çek
    const [kalemler] = await pool.execute(
      `SELECT sk.sayim_id, sk.urun_id, sk.miktar, sk.birim
       FROM sayim_kalemleri sk
       WHERE sk.sayim_id IN (${placeholders})`,
      sayim_ids
    );

    // 3. Aynı urun_id'lerin miktarlarını topla
    const toplamMap = {};
    for (const k of kalemler) {
      if (!toplamMap[k.urun_id]) {
        toplamMap[k.urun_id] = { miktar: 0, birim: k.birim };
      }
      toplamMap[k.urun_id].miktar += parseFloat(k.miktar);
    }

    // 4. İlk sayımın depo_id'sini kullan
    const depo_id = sayimlar[0].depo_id;

    // 5. Notlar alanına kaynak sayımları yaz
    const notlar = JSON.stringify({
      toplanan_sayimlar: sayimlar.map(s => ({ id: s.id, ad: s.ad, tarih: s.tarih, depo: s.depo_ad }))
    });

    // 6. Yeni sayım oluştur
    const yeniId = crypto.randomUUID();
    await pool.execute(
      `INSERT INTO sayimlar (id, isletme_id, depo_id, kullanici_id, ad, tarih, durum, notlar)
       VALUES (?, ?, ?, ?, ?, ?, 'tamamlandi', ?)`,
      [yeniId, isletme_id, depo_id, req.user.id, ad.trim(), new Date().toISOString().split('T')[0], notlar]
    );

    // 7. Toplanmış kalemleri ekle
    for (const [urun_id, data] of Object.entries(toplamMap)) {
      const kalemId = crypto.randomUUID();
      await pool.execute(
        `INSERT INTO sayim_kalemleri (id, sayim_id, urun_id, miktar, birim)
         VALUES (?, ?, ?, ?, ?)`,
        [kalemId, yeniId, urun_id, data.miktar, data.birim]
      );
    }

    // 8. Oluşturulan sayımı döndür
    const [rows] = await pool.execute('SELECT * FROM sayimlar WHERE id = ?', [yeniId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Sayım toplama hatası:', err);
    return res.status(500).json({ hata: err.message });
  }
});

module.exports = router;
