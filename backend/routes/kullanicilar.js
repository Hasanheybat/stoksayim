const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const authGuard = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');

router.use(authGuard, adminGuard);

// GET /api/kullanicilar?q=arama&sayfa=1&limit=50&filtre=Tümü&rol=admin|kullanici
router.get('/', async (req, res) => {
  const { q, sayfa, limit = 50, filtre, rol } = req.query;

  let query = supabaseAdmin
    .from('kullanicilar')
    .select(`
      id, ad_soyad, email, rol, telefon, aktif, created_at,
      kullanici_isletme ( aktif, rol_id, roller(id, ad), isletmeler ( id, ad, kod ) )
    `, { count: 'exact' })
    .order('ad_soyad');

  if (q) query = query.or(`ad_soyad.ilike.%${q}%,email.ilike.%${q}%`);
  if (filtre === 'Aktif')   query = query.eq('aktif', true);
  if (filtre === 'Pasif')   query = query.eq('aktif', false);
  if (rol === 'admin')      query = query.eq('rol', 'admin');
  if (rol === 'kullanici')  query = query.neq('rol', 'admin');

  if (sayfa) {
    const sp = Math.max(1, (v => Number.isNaN(v) ? 1 : v)(parseInt(sayfa)));
    const lm = Math.min(200, Math.max(1, (v => Number.isNaN(v) ? 50 : v)(parseInt(limit))));
    const offset = (sp - 1) * lm;
    query = query.range(offset, offset + lm - 1);
  }

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ hata: error.message });

  const list = (data || []).map(k => ({
    ...k,
    isletmeler: (k.kullanici_isletme || [])
      .filter(ki => ki.aktif && ki.isletmeler)
      .map(ki => ({
        ...ki.isletmeler,
        atanan_rol_id: ki.rol_id || null,
        atanan_rol_adi: ki.roller?.ad || null,
      })),
  }));

  if (sayfa) return res.json({ data: list, toplam: count });
  res.json(list); // backward compat
});

// GET /api/kullanicilar/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('kullanicilar')
    .select(`
      id, ad_soyad, email, rol, telefon, aktif, ayarlar, created_at,
      kullanici_isletme (
        id, aktif, yetkiler,
        isletmeler ( id, ad, kod )
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ hata: 'Kullanıcı bulunamadı.' });
  res.json(data);
});

// POST /api/kullanicilar — Yeni kullanıcı oluştur
router.post('/', async (req, res) => {
  const { ad_soyad, email, sifre, rol, telefon } = req.body;

  if (!ad_soyad || !email || !sifre) {
    return res.status(400).json({ hata: 'ad_soyad, email ve sifre zorunludur.' });
  }

  // Supabase Auth'da kullanıcı oluştur
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: sifre,
    email_confirm: true
  });

  if (authError) {
    return res.status(400).json({ hata: authError.message });
  }

  // kullanicilar tablosuna kayıt ekle
  const { data, error } = await supabaseAdmin
    .from('kullanicilar')
    .insert({
      id: authData.user.id,
      ad_soyad,
      email,
      rol: rol || 'kullanici',
      telefon
    })
    .select()
    .single();

  if (error) {
    // Auth kullanıcısını geri sil
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return res.status(500).json({ hata: error.message });
  }

  res.status(201).json(data);
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

  // DB güncellemesi
  const guncelle = {};
  if (ad_soyad  !== undefined) guncelle.ad_soyad = ad_soyad;
  if (telefon   !== undefined) guncelle.telefon  = telefon;
  if (aktif     !== undefined) guncelle.aktif    = aktif;
  if (rol       !== undefined) guncelle.rol      = rol;
  if (email     !== undefined) guncelle.email    = email;

  const { data, error } = await supabaseAdmin
    .from('kullanicilar')
    .update(guncelle)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });

  // Supabase Auth senkronizasyonu
  const authGuncelle = {};
  if (email !== undefined) authGuncelle.email    = email;
  if (sifre !== undefined) authGuncelle.password = sifre;
  if (aktif === true)      authGuncelle.ban_duration = 'none';
  else if (aktif === false) authGuncelle.ban_duration = '876000h';

  if (Object.keys(authGuncelle).length > 0) {
    await supabaseAdmin.auth.admin.updateUserById(req.params.id, authGuncelle);
  }

  res.json(data);
});

// DELETE /api/kullanicilar/:id — Pasife al
router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(403).json({ hata: 'Kendi hesabınızı silemezsiniz.' });
  }

  // 1) DB'de pasife al
  const { error } = await supabaseAdmin
    .from('kullanicilar')
    .update({ aktif: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ hata: error.message });

  // 2) Supabase Auth'da da ban'la → giriş yapamaz, mevcut token geçersiz olur
  await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
    ban_duration: '876000h', // ~100 yıl
  });

  res.json({ mesaj: 'Kullanıcı pasife alındı.' });
});

// POST /api/kullanicilar/:id/isletme — İşletme ata
router.post('/:id/isletme', async (req, res) => {
  const { isletme_id } = req.body;

  if (!isletme_id) {
    return res.status(400).json({ hata: 'isletme_id zorunludur.' });
  }

  // Mevcut atamayı kontrol et — varsa yetkilerini koru
  const { data: mevcut } = await supabaseAdmin
    .from('kullanici_isletme')
    .select('yetkiler')
    .eq('kullanici_id', req.params.id)
    .eq('isletme_id', isletme_id)
    .maybeSingle();

  // Yeni atama için varsayılan okuma yetkileri (mevcut atamada yetkiler zaten varsa dokunma)
  const varsayilanYetkiler = {
    urun:   { goruntule: true, ekle: false, duzenle: false, sil: false },
    depo:   { goruntule: true, ekle: false, duzenle: false, sil: false },
    barkod: { tanimla: false, duzenle: false, sil: false },
    sayim:  { goruntule: true, ekle: false, duzenle: false, sil: false },
  };

  const { data, error } = await supabaseAdmin
    .from('kullanici_isletme')
    .upsert({
      kullanici_id: req.params.id,
      isletme_id,
      aktif: true,
      yetkiler: mevcut?.yetkiler || varsayilanYetkiler,
    }, { onConflict: 'kullanici_id,isletme_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.status(201).json(data);
});

// DELETE /api/kullanicilar/:id/isletme/:isletme_id — İşletme atamasını kaldır
router.delete('/:id/isletme/:isletme_id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('kullanici_isletme')
    .update({ aktif: false })
    .eq('kullanici_id', req.params.id)
    .eq('isletme_id', req.params.isletme_id);

  if (error) return res.status(500).json({ hata: error.message });
  res.json({ mesaj: 'İşletme ataması kaldırıldı.' });
});

// GET /api/kullanicilar/:id/yetkiler?isletme_id=X
router.get('/:id/yetkiler', async (req, res) => {
  const { isletme_id } = req.query;

  if (!isletme_id) {
    return res.status(400).json({ hata: 'isletme_id zorunludur.' });
  }

  const { data, error } = await supabaseAdmin
    .from('kullanici_isletme')
    .select('yetkiler, rol_id, roller(id, ad)')
    .eq('kullanici_id', req.params.id)
    .eq('isletme_id', isletme_id)
    .single();

  if (error) return res.status(404).json({ hata: 'Atama bulunamadı.' });
  res.json({
    yetkiler: data.yetkiler,
    rol_id:   data.rol_id   || null,
    rol_adi:  data.roller?.ad || null,
  });
});

// PUT /api/kullanicilar/:id/yetkiler
router.put('/:id/yetkiler', async (req, res) => {
  const { isletme_id, yetkiler, rol_id } = req.body;

  if (!isletme_id || !yetkiler) {
    return res.status(400).json({ hata: 'isletme_id ve yetkiler zorunludur.' });
  }

  const guncelle = { yetkiler };
  if (rol_id !== undefined) guncelle.rol_id = rol_id || null;

  const { data, error } = await supabaseAdmin
    .from('kullanici_isletme')
    .update(guncelle)
    .eq('kullanici_id', req.params.id)
    .eq('isletme_id', isletme_id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data);
});

module.exports = router;
