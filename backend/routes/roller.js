const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const authGuard  = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');

// Tüm roller rotaları: auth + admin gerektirir
router.use(authGuard, adminGuard);

// GET /api/roller — Tüm rolleri listele
router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('roller')
    .select('*')
    .order('sistem', { ascending: false }) // sistem rolleri önce
    .order('created_at');

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data || []);
});

// POST /api/roller — Yeni özel rol oluştur
router.post('/', async (req, res) => {
  const { ad, yetkiler } = req.body;

  if (!ad?.trim()) {
    return res.status(400).json({ hata: 'Rol adı zorunludur.' });
  }

  const { data, error } = await supabaseAdmin
    .from('roller')
    .insert({
      ad:      ad.trim(),
      yetkiler: yetkiler || {
        urun:   { goruntule: true,  ekle: false, duzenle: false, sil: false },
        depo:   { goruntule: true,  ekle: false, duzenle: false, sil: false },
        barkod: { tanimla: false,   duzenle: false, sil: false },
        sayim:  { goruntule: true,  ekle: true,  duzenle: false, sil: false },
      },
      sistem: false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ hata: 'Bu rol adı zaten mevcut.' });
    return res.status(500).json({ hata: error.message });
  }

  res.status(201).json(data);
});

// PUT /api/roller/:id — Rol güncelle (yetki matrisi + ad)
router.put('/:id', async (req, res) => {
  const { ad, yetkiler } = req.body;

  const guncelle = {};
  if (ad      !== undefined) guncelle.ad      = ad.trim();
  if (yetkiler !== undefined) guncelle.yetkiler = yetkiler;

  if (Object.keys(guncelle).length === 0) {
    return res.status(400).json({ hata: 'Güncellenecek alan yok.' });
  }

  // Sistem rollerinin adı değiştirilemez
  if (ad !== undefined) {
    const { data: mevcut } = await supabaseAdmin
      .from('roller')
      .select('sistem')
      .eq('id', req.params.id)
      .single();

    if (mevcut?.sistem) {
      delete guncelle.ad; // sistem rolünün adını değiştirme
    }
  }

  const { data, error } = await supabaseAdmin
    .from('roller')
    .update(guncelle)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });

  // Yetkiler değiştiyse, bu role atanmış tüm kullanici_isletme kayıtlarını da güncelle
  if (yetkiler !== undefined) {
    await supabaseAdmin
      .from('kullanici_isletme')
      .update({ yetkiler })
      .eq('rol_id', req.params.id);
  }

  res.json(data);
});

// DELETE /api/roller/:id — Rol sil (sadece özel roller)
router.delete('/:id', async (req, res) => {
  // Sistem rolü olup olmadığını kontrol et
  const { data: rol, error: getErr } = await supabaseAdmin
    .from('roller')
    .select('sistem, ad')
    .eq('id', req.params.id)
    .single();

  if (getErr || !rol) {
    return res.status(404).json({ hata: 'Rol bulunamadı.' });
  }

  if (rol.sistem) {
    return res.status(403).json({ hata: `"${rol.ad}" sistem rolü silinemez.` });
  }

  // Bu role atanmış kullanici_isletme kayıtlarının rol_id'sini temizle
  await supabaseAdmin
    .from('kullanici_isletme')
    .update({ rol_id: null })
    .eq('rol_id', req.params.id);

  const { error } = await supabaseAdmin
    .from('roller')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ hata: error.message });
  res.json({ mesaj: 'Rol silindi.' });
});

module.exports = router;
