const router = require('express').Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { supabaseAdmin } = require('../lib/supabase');
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
  const { data: urun, error } = await supabaseAdmin
    .from('isletme_urunler')
    .select('isletme_id')
    .eq('id', req.params.id)
    .single();

  if (error || !urun) {
    res.status(404).json({ hata: 'Ürün bulunamadı.' });
    return false;
  }

  const { data: ki, error: kiErr } = await supabaseAdmin
    .from('kullanici_isletme')
    .select('yetkiler')
    .eq('kullanici_id', req.user.id)
    .eq('isletme_id', urun.isletme_id)
    .eq('aktif', true)
    .single();

  if (kiErr || !ki) {
    res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
    return false;
  }

  if (!ki.yetkiler?.urun?.[islem]) {
    res.status(403).json({ hata: `Ürün ${islem} yetkiniz yok.` });
    return false;
  }

  return true;
}

// Tüm rotalar kimlik doğrulaması gerektirir
router.use(authGuard);

// ── Kullanıcı erişimli: PUT /:id (Stok Düzenle) ──
// authGuard'dan sonra, adminGuard'dan ÖNCE → giriş yapmış herkes erişebilir
router.put('/:id', async (req, res) => {
  if (!await checkUrunYetki(req, res, 'duzenle')) return;

  const { urun_adi, urun_kodu, isim_2, barkodlar, birim } = req.body;

  if (!urun_adi?.trim()) return res.status(400).json({ hata: 'İsim 1 (sayım ismi) boş olamaz.' });
  if (!urun_kodu?.trim()) return res.status(400).json({ hata: 'Stok kodu boş olamaz.' });

  const barkodStr = Array.isArray(barkodlar)
    ? barkodlar.map(b => b.trim()).filter(Boolean).join(',')
    : (typeof barkodlar === 'string' ? barkodlar : '');

  const { data, error } = await supabaseAdmin
    .from('isletme_urunler')
    .update({
      urun_adi:                   urun_adi.trim(),
      urun_kodu:                  urun_kodu.trim(),
      isim_2:                     (isim_2 || '').trim(),
      barkodlar:                  barkodStr,
      birim,
      son_guncelleme:             new Date(),
      guncelleme_kaynagi:         'kullanici',
      kullanici_guncelledi:       true,
      guncelleyen_kullanici_id:   req.user.id,
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error('[PUT /urunler/:id]', error.message);
    return res.status(500).json({ hata: error.message });
  }
  res.json(data);
});

// ── Kullanıcı erişimli: POST / (Yeni Stok Ekle) ──
router.post('/', yetkiGuard('urun', 'ekle', 'body'), async (req, res) => {
  const { isletme_id, urun_kodu, urun_adi, isim_2, birim, barkodlar, kategori } = req.body;

  if (!isletme_id || !urun_kodu?.trim() || !urun_adi?.trim()) {
    return res.status(400).json({ hata: 'isletme_id, urun_kodu ve urun_adi zorunludur.' });
  }

  const barkodStr = Array.isArray(barkodlar)
    ? barkodlar.map(b => b.trim()).filter(Boolean).join(',')
    : (typeof barkodlar === 'string' ? barkodlar : '');

  const { data, error } = await supabaseAdmin
    .from('isletme_urunler')
    .insert({
      isletme_id,
      urun_kodu:                  urun_kodu.trim(),
      urun_adi:                   urun_adi.trim(),
      isim_2:                     (isim_2 || '').trim(),
      birim:                      birim || 'ADET',
      barkodlar:                  barkodStr,
      kategori:                   kategori || null,
      guncelleme_kaynagi:         'kullanici',
      guncelleyen_kullanici_id:   req.user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ hata: 'Bu ürün kodu bu işletmede zaten var.' });
    return res.status(500).json({ hata: error.message });
  }
  res.status(201).json(data);
});

// ── Kullanıcı erişimli: DELETE /:id (Stok Sil) ──
router.delete('/:id', async (req, res) => {
  if (!await checkUrunYetki(req, res, 'sil')) return;

  const { error } = await supabaseAdmin
    .from('isletme_urunler')
    .update({ aktif: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ hata: error.message });
  res.json({ mesaj: 'Ürün silindi.' });
});

// ── Kullanıcı erişimli: GET /barkod/:barkod?isletme_id=X ──
router.get('/barkod/:barkod', async (req, res, next) => {
  if (req.user.rol === 'admin') return next();

  const { isletme_id } = req.query;
  if (!isletme_id) return res.status(400).json({ hata: 'isletme_id zorunludur.' });

  const { data: ki } = await supabaseAdmin
    .from('kullanici_isletme')
    .select('yetkiler')
    .eq('kullanici_id', req.user.id)
    .eq('isletme_id', isletme_id)
    .eq('aktif', true)
    .single();

  if (!ki)                           return res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
  if (!ki.yetkiler?.urun?.goruntule) return res.status(403).json({ hata: 'Ürün görüntüleme yetkiniz yok.' });

  const { data, error } = await supabaseAdmin
    .from('isletme_urunler')
    .select('*')
    .eq('isletme_id', isletme_id)
    .eq('aktif', true)
    .like('barkodlar', `%${req.params.barkod}%`);

  if (error) return res.status(500).json({ hata: error.message });

  const urun = (data || []).find(u => {
    const barkodlar = (u.barkodlar || '').split(',').map(b => b.trim());
    return barkodlar.includes(req.params.barkod);
  });

  if (!urun) return res.status(404).json({ hata: 'Barkod sistemde bulunamadı.' });
  res.json(urun);
});

// ── Kullanıcı erişimli: GET /?isletme_id=X&q=arama ──
// Admin ise adminGuard'dan sonraki tam listeye next() ile geç
router.get('/', async (req, res, next) => {
  if (req.user.rol === 'admin') return next();

  const { isletme_id, q } = req.query;
  if (!isletme_id) return res.status(400).json({ hata: 'isletme_id zorunludur.' });

  const { data: ki } = await supabaseAdmin
    .from('kullanici_isletme')
    .select('yetkiler')
    .eq('kullanici_id', req.user.id)
    .eq('isletme_id', isletme_id)
    .eq('aktif', true)
    .single();

  if (!ki)                           return res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
  if (!ki.yetkiler?.urun?.goruntule) return res.status(403).json({ hata: 'Ürün görüntüleme yetkiniz yok.' });

  let query = supabaseAdmin
    .from('isletme_urunler')
    .select('id, urun_kodu, urun_adi, isim_2, birim, kategori, barkodlar')
    .eq('isletme_id', isletme_id)
    .eq('aktif', true)
    .order('urun_adi');

  if (q) {
    query = query.or(`urun_adi.ilike.%${q}%,urun_kodu.ilike.%${q}%,barkodlar.ilike.%${q}%,isim_2.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ hata: error.message });
  res.json(data || []);
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
  const { isletme_id, q, sayfa = 1, limit = 20 } = req.query;

  const sp = Math.max(1, (v => Number.isNaN(v) ? 1 : v)(parseInt(sayfa)));
  const lm = Math.min(200, Math.max(1, (v => Number.isNaN(v) ? 20 : v)(parseInt(limit))));
  const offset = (sp - 1) * lm;

  let query = supabaseAdmin
    .from('isletme_urunler')
    .select('*, isletmeler ( id, ad )', { count: 'exact' })
    .eq('aktif', true)
    .order('urun_adi')
    .range(offset, offset + lm - 1);

  if (isletme_id) query = query.eq('isletme_id', isletme_id);

  if (q) {
    query = query.or(`urun_adi.ilike.%${q}%,urun_kodu.ilike.%${q}%,barkodlar.ilike.%${q}%,isim_2.ilike.%${q}%`);
  }

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ hata: error.message });

  res.json({ data, toplam: count, sayfa: parseInt(sayfa), limit: parseInt(limit) });
});

// GET /api/urunler/barkod/:barkod?isletme_id=X
router.get('/barkod/:barkod', async (req, res) => {
  const { isletme_id } = req.query;

  if (!isletme_id) {
    return res.status(400).json({ hata: 'isletme_id zorunludur.' });
  }

  const { data, error } = await supabaseAdmin
    .from('isletme_urunler')
    .select('*')
    .eq('isletme_id', isletme_id)
    .eq('aktif', true)
    .like('barkodlar', `%${req.params.barkod}%`);

  if (error) return res.status(500).json({ hata: error.message });

  const urun = data.find(u => {
    const barkodlar = u.barkodlar.split(',').map(b => b.trim());
    return barkodlar.includes(req.params.barkod);
  });

  if (!urun) return res.status(404).json({ hata: 'Barkod sistemde bulunamadı.' });
  res.json(urun);
});

// GET /api/urunler/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('isletme_urunler')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ hata: 'Ürün bulunamadı.' });
  res.json(data);
});


// POST /api/urunler/:id/barkod — Barkod ekle
router.post('/:id/barkod', async (req, res) => {
  const { barkod } = req.body;

  if (!barkod) return res.status(400).json({ hata: 'barkod zorunludur.' });

  const { data: mevcut, error: getError } = await supabaseAdmin
    .from('isletme_urunler')
    .select('barkodlar')
    .eq('id', req.params.id)
    .single();

  if (getError) return res.status(404).json({ hata: 'Ürün bulunamadı.' });

  const barkodlar = mevcut.barkodlar
    .split(',')
    .map(b => b.trim())
    .filter(b => b.length > 0);

  if (barkodlar.includes(barkod)) {
    return res.status(409).json({ hata: 'Bu barkod zaten tanımlı.' });
  }

  barkodlar.push(barkod);

  const { data, error } = await supabaseAdmin
    .from('isletme_urunler')
    .update({ barkodlar: barkodlar.join(','), son_guncelleme: new Date() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data);
});

// DELETE /api/urunler/:id/barkod/:barkod — Barkod sil
router.delete('/:id/barkod/:barkod', async (req, res) => {
  const { data: mevcut, error: getError } = await supabaseAdmin
    .from('isletme_urunler')
    .select('barkodlar')
    .eq('id', req.params.id)
    .single();

  if (getError) return res.status(404).json({ hata: 'Ürün bulunamadı.' });

  const barkodlar = mevcut.barkodlar
    .split(',')
    .map(b => b.trim())
    .filter(b => b.length > 0 && b !== req.params.barkod);

  const { data, error } = await supabaseAdmin
    .from('isletme_urunler')
    .update({ barkodlar: barkodlar.join(','), son_guncelleme: new Date() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data);
});

// POST /api/urunler/yukle?isletme_id=X&preview=true/false
router.post('/yukle', (req, res, next) => {
  upload.single('dosya')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ hata: 'Dosya 10 MB sınırını aşıyor.' });
    }
    if (err) return res.status(400).json({ hata: err.message });
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

    const { data: mevcut } = await supabaseAdmin
      .from('isletme_urunler')
      .select('id, urun_adi, birim, barkodlar, kullanici_guncelledi')
      .eq('isletme_id', isletme_id)
      .eq('urun_kodu', row.urun_kodu.toString())
      .single();

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
    const { data: mevcut } = await supabaseAdmin
      .from('isletme_urunler')
      .select('barkodlar, kullanici_guncelledi')
      .eq('isletme_id', isletme_id)
      .eq('urun_kodu', urun.urun_kodu)
      .single();

    const eskiBarkodlar = (mevcut?.barkodlar || '').split(',').map(b => b.trim()).filter(Boolean);
    const yeniBarkodlar = urun.barkodlar.split(',').map(b => b.trim()).filter(Boolean);
    const tumBarkodlar = [...new Set([...eskiBarkodlar, ...yeniBarkodlar])].join(',');

    if (mevcut) {
      const guncelle = {
        barkodlar: tumBarkodlar,
        admin_version: urun.admin_version,
        son_guncelleme: new Date(),
        guncelleme_kaynagi: 'admin'
      };
      if (!mevcut.kullanici_guncelledi) {
        guncelle.urun_adi = urun.urun_adi;
        guncelle.isim_2   = urun.isim_2;
        guncelle.birim    = urun.birim;
        guncelle.kategori = urun.kategori;
      }
      await supabaseAdmin
        .from('isletme_urunler')
        .update(guncelle)
        .eq('isletme_id', isletme_id)
        .eq('urun_kodu', urun.urun_kodu);
    } else {
      await supabaseAdmin
        .from('isletme_urunler')
        .insert({ ...urun, barkodlar: tumBarkodlar });
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
