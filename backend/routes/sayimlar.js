const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const authGuard = require('../middleware/authGuard');
const yetkiGuard = require('../middleware/yetkiGuard');

router.use(authGuard);

// GET /api/sayimlar?isletme_id=X&isletme_ids=X,Y&depo_id=Y&durum=Z&q=arama&sayfa=1&limit=50
router.get('/', yetkiGuard('sayim', 'goruntule'), async (req, res) => {
  const { isletme_id, isletme_ids, depo_id, durum, q, sayfa = 1, limit = 50 } = req.query;
  const sp = Math.max(1, (v => Number.isNaN(v) ? 1 : v)(parseInt(sayfa)));
  const lm = Math.min(200, Math.max(1, (v => Number.isNaN(v) ? 50 : v)(parseInt(limit))));
  const offset = (sp - 1) * lm;

  let query = supabaseAdmin
    .from('sayimlar')
    .select(`
      id, ad, tarih, durum, notlar, created_at, isletme_id, depo_id,
      depolar ( id, ad ),
      isletmeler ( id, ad ),
      kullanicilar ( id, ad_soyad )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + lm - 1);

  if (isletme_id)  query = query.eq('isletme_id', isletme_id);
  if (isletme_ids) query = query.in('isletme_id', isletme_ids.split(',').filter(Boolean));
  if (depo_id)     query = query.eq('depo_id', depo_id);
  if (durum)       query = query.eq('durum', durum);
  if (q)           query = query.ilike('ad', `%${q}%`);

  // Normal kullanıcı sadece kendi sayımlarını görür ve isletme_id zorunlu
  if (req.user.rol !== 'admin') {
    if (!isletme_id) return res.status(400).json({ hata: 'isletme_id zorunludur.' });
    query = query.eq('kullanici_id', req.user.id);
  }

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ hata: error.message });

  res.json({ data: data || [], toplam: count || 0 });
});

// GET /api/sayimlar/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('sayimlar')
    .select(`
      *,
      depolar ( id, ad, kod ),
      kullanicilar ( id, ad_soyad ),
      isletmeler ( id, ad, aktif ),
      sayim_kalemleri (
        id, miktar, birim, notlar, created_at,
        isletme_urunler ( id, urun_kodu, urun_adi, isim_2, barkodlar, birim )
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ hata: 'Sayım bulunamadı.' });

  // Kullanıcı sadece kendi sayımını görebilir + sayim.goruntule yetkisi
  if (req.user.rol !== 'admin') {
    if (data.kullanici_id !== req.user.id) {
      return res.status(403).json({ hata: 'Bu sayıma erişim yetkiniz yok.' });
    }
    const { data: ki } = await supabaseAdmin
      .from('kullanici_isletme')
      .select('yetkiler')
      .eq('kullanici_id', req.user.id)
      .eq('isletme_id', data.isletme_id)
      .eq('aktif', true)
      .single();
    if (!ki?.yetkiler?.sayim?.goruntule) {
      return res.status(403).json({ hata: 'Sayım görüntüleme yetkiniz yok.' });
    }
  }

  res.json(data);
});

// DELETE /api/sayimlar/:id (durum = 'silindi')
router.delete('/:id', async (req, res) => {
  const { data: sayim } = await supabaseAdmin
    .from('sayimlar')
    .select('kullanici_id, durum, isletme_id')
    .eq('id', req.params.id)
    .single();

  if (!sayim) return res.status(404).json({ hata: 'Sayım bulunamadı.' });

  if (req.user.rol !== 'admin') {
    if (sayim.kullanici_id !== req.user.id) {
      return res.status(403).json({ hata: 'Bu sayımı silme yetkiniz yok.' });
    }
    const { data: ki } = await supabaseAdmin
      .from('kullanici_isletme')
      .select('yetkiler')
      .eq('kullanici_id', req.user.id)
      .eq('isletme_id', sayim.isletme_id)
      .eq('aktif', true)
      .single();
    if (!ki?.yetkiler?.sayim?.sil) {
      return res.status(403).json({ hata: 'Sayım silme yetkiniz yok.' });
    }
  }

  if (sayim.durum === 'tamamlandi') {
    return res.status(400).json({ hata: 'Tamamlanmış sayım silinemez.' });
  }

  await supabaseAdmin.from('sayimlar').update({ durum: 'silindi' }).eq('id', req.params.id);
  res.json({ mesaj: 'Sayım silindi.' });
});

// POST /api/sayimlar
router.post('/', yetkiGuard('sayim', 'ekle', 'body'), async (req, res) => {
  const { isletme_id, depo_id, ad, tarih, notlar } = req.body;

  if (!isletme_id || !depo_id || !ad) {
    return res.status(400).json({ hata: 'isletme_id, depo_id ve ad zorunludur.' });
  }

  const { data, error } = await supabaseAdmin
    .from('sayimlar')
    .insert({
      isletme_id,
      depo_id,
      kullanici_id: req.user.id,
      ad,
      tarih: tarih || new Date().toISOString().split('T')[0],
      notlar
    })
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.status(201).json(data);
});

// PUT /api/sayimlar/:id  — sayim.duzenle yetkisi gerekli (depo, kişiler güncelle)
router.put('/:id', async (req, res) => {
  const { depo_id, ad, kisiler } = req.body;

  const { data: sayim } = await supabaseAdmin
    .from('sayimlar')
    .select('kullanici_id, isletme_id, durum')
    .eq('id', req.params.id)
    .single();

  if (!sayim) return res.status(404).json({ hata: 'Sayım bulunamadı.' });

  // Sadece sahiplik kontrolü — yetki gerektirmez
  if (req.user.rol !== 'admin') {
    if (sayim.kullanici_id !== req.user.id) return res.status(403).json({ hata: 'Bu sayımı düzenleme yetkiniz yok.' });
  }

  if (sayim.durum !== 'devam') return res.status(400).json({ hata: 'Tamamlanmış sayım düzenlenemez.' });

  const guncelle = {};
  if (depo_id !== undefined) guncelle.depo_id = depo_id;
  if (ad      !== undefined) guncelle.ad      = ad;
  if (kisiler !== undefined) guncelle.kisiler  = kisiler;

  const { data, error } = await supabaseAdmin
    .from('sayimlar')
    .update(guncelle)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data);
});

// PUT /api/sayimlar/:id/tamamla
router.put('/:id/tamamla', async (req, res) => {
  const { data: sayim } = await supabaseAdmin
    .from('sayimlar')
    .select('kullanici_id, durum, isletme_id')
    .eq('id', req.params.id)
    .single();

  if (!sayim) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
  if (req.user.rol !== 'admin') {
    if (sayim.kullanici_id !== req.user.id) return res.status(403).json({ hata: 'Yetki yok.' });
    const { data: ki } = await supabaseAdmin.from('kullanici_isletme').select('yetkiler')
      .eq('kullanici_id', req.user.id).eq('isletme_id', sayim.isletme_id).eq('aktif', true).single();
    if (!ki?.yetkiler?.sayim?.duzenle) return res.status(403).json({ hata: 'Sayım düzenleme yetkiniz yok.' });
  }
  if (sayim.durum !== 'devam') {
    return res.status(400).json({ hata: 'Sadece devam eden sayımlar tamamlanabilir.' });
  }

  const { data, error } = await supabaseAdmin
    .from('sayimlar')
    .update({ durum: 'tamamlandi' })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data);
});

// PUT /api/sayimlar/:id/yeniden-ac  (sadece admin)
router.put('/:id/yeniden-ac', async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ hata: 'Sayımı yeniden açma yetkisi yalnızca adminlere aittir.' });
  }

  const { data: sayim } = await supabaseAdmin
    .from('sayimlar')
    .select('durum')
    .eq('id', req.params.id)
    .single();

  if (!sayim) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
  if (sayim.durum === 'devam') return res.status(400).json({ hata: 'Sayım zaten açık durumda.' });

  const { data, error } = await supabaseAdmin
    .from('sayimlar')
    .update({ durum: 'devam' })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data);
});

// GET /api/sayimlar/:id/kalemler
router.get('/:id/kalemler', async (req, res) => {
  // Sayımın var olduğunu doğrula
  const { data: sayim } = await supabaseAdmin
    .from('sayimlar')
    .select('kullanici_id, isletme_id')
    .eq('id', req.params.id)
    .single();

  if (!sayim) return res.status(404).json({ hata: 'Sayım bulunamadı.' });

  if (req.user.rol !== 'admin') {
    if (sayim.kullanici_id !== req.user.id) {
      return res.status(403).json({ hata: 'Bu sayıma erişim yetkiniz yok.' });
    }
    const { data: ki } = await supabaseAdmin
      .from('kullanici_isletme')
      .select('yetkiler')
      .eq('kullanici_id', req.user.id)
      .eq('isletme_id', sayim.isletme_id)
      .eq('aktif', true)
      .single();
    if (!ki?.yetkiler?.sayim?.goruntule) {
      return res.status(403).json({ hata: 'Sayım görüntüleme yetkiniz yok.' });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('sayim_kalemleri')
    .select(`
      *,
      isletme_urunler ( id, urun_kodu, urun_adi, isim_2, barkodlar, birim )
    `)
    .eq('sayim_id', req.params.id)
    .order('created_at');

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data);
});

// POST /api/sayimlar/:id/kalem
router.post('/:id/kalem', async (req, res) => {
  const { urun_id, miktar, birim, notlar } = req.body;

  if (!urun_id || miktar === undefined) {
    return res.status(400).json({ hata: 'urun_id ve miktar zorunludur.' });
  }

  // Sayımın var olduğunu ve kullanıcının sahibi olduğunu doğrula
  const { data: sayim } = await supabaseAdmin
    .from('sayimlar')
    .select('kullanici_id, isletme_id, durum')
    .eq('id', req.params.id)
    .single();

  if (!sayim) return res.status(404).json({ hata: 'Sayım bulunamadı.' });

  if (req.user.rol !== 'admin') {
    if (sayim.kullanici_id !== req.user.id) {
      return res.status(403).json({ hata: 'Bu sayıma erişim yetkiniz yok.' });
    }
    const { data: ki } = await supabaseAdmin
      .from('kullanici_isletme')
      .select('yetkiler')
      .eq('kullanici_id', req.user.id)
      .eq('isletme_id', sayim.isletme_id)
      .eq('aktif', true)
      .single();
    if (!ki?.yetkiler?.sayim?.duzenle) {
      return res.status(403).json({ hata: 'Sayım düzenleme yetkiniz yok.' });
    }
  }

  if (sayim.durum !== 'devam') {
    return res.status(400).json({ hata: 'Tamamlanmış sayıma kalem eklenemez.' });
  }

  const { data, error } = await supabaseAdmin
    .from('sayim_kalemleri')
    .insert({ sayim_id: req.params.id, urun_id, miktar, birim, notlar })
    .select(`*, isletme_urunler ( id, urun_kodu, urun_adi )`)
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.status(201).json(data);
});

// PUT /api/sayimlar/:id/kalem/:kalem_id  — sayim.duzenle yetkisi gerekli
router.put('/:id/kalem/:kalem_id', async (req, res) => {
  const { miktar, birim, notlar } = req.body;

  // Yetkiyi kontrol et
  if (req.user.rol !== 'admin') {
    const { data: sayim } = await supabaseAdmin
      .from('sayimlar')
      .select('kullanici_id, isletme_id, durum')
      .eq('id', req.params.id)
      .single();
    if (!sayim) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
    if (sayim.kullanici_id !== req.user.id) return res.status(403).json({ hata: 'Bu sayıma erişim yetkiniz yok.' });
    const { data: ki } = await supabaseAdmin.from('kullanici_isletme').select('yetkiler')
      .eq('kullanici_id', req.user.id).eq('isletme_id', sayim.isletme_id).eq('aktif', true).single();
    if (!ki?.yetkiler?.sayim?.duzenle) return res.status(403).json({ hata: 'Sayım düzenleme yetkiniz yok.' });
    if (sayim.durum !== 'devam') return res.status(400).json({ hata: 'Tamamlanmış sayım düzenlenemez.' });
  }

  const { data, error } = await supabaseAdmin
    .from('sayim_kalemleri')
    .update({ miktar, birim, notlar })
    .eq('id', req.params.kalem_id)
    .eq('sayim_id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data);
});

// DELETE /api/sayimlar/:id/kalem/:kalem_id  — sayim.duzenle yetkisi gerekli
router.delete('/:id/kalem/:kalem_id', async (req, res) => {
  // Yetkiyi kontrol et
  if (req.user.rol !== 'admin') {
    const { data: sayim } = await supabaseAdmin
      .from('sayimlar')
      .select('kullanici_id, isletme_id, durum')
      .eq('id', req.params.id)
      .single();
    if (!sayim) return res.status(404).json({ hata: 'Sayım bulunamadı.' });
    if (sayim.kullanici_id !== req.user.id) return res.status(403).json({ hata: 'Bu sayıma erişim yetkiniz yok.' });
    const { data: ki } = await supabaseAdmin.from('kullanici_isletme').select('yetkiler')
      .eq('kullanici_id', req.user.id).eq('isletme_id', sayim.isletme_id).eq('aktif', true).single();
    if (!ki?.yetkiler?.sayim?.duzenle) return res.status(403).json({ hata: 'Sayım düzenleme yetkiniz yok.' });
    if (sayim.durum !== 'devam') return res.status(400).json({ hata: 'Tamamlanmış sayımdan kalem silinemez.' });
  }

  const { error } = await supabaseAdmin
    .from('sayim_kalemleri')
    .delete()
    .eq('id', req.params.kalem_id)
    .eq('sayim_id', req.params.id);

  if (error) return res.status(500).json({ hata: error.message });
  res.json({ mesaj: 'Kalem silindi.' });
});

module.exports = router;
