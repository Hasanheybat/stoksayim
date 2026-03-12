const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const authGuard = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');
const yetkiGuard = require('../middleware/yetkiGuard');

/* ── Yetki kontrol yardımcısı (PUT/DELETE için isletme_id DB'den çekilir) ── */
async function checkDepoYetki(req, res, islem) {
  if (req.user.rol === 'admin') return true;

  const { data: depo, error } = await supabaseAdmin
    .from('depolar')
    .select('isletme_id')
    .eq('id', req.params.id)
    .single();

  if (error || !depo) {
    res.status(404).json({ hata: 'Depo bulunamadı.' });
    return false;
  }

  const { data: ki, error: kiErr } = await supabaseAdmin
    .from('kullanici_isletme')
    .select('yetkiler')
    .eq('kullanici_id', req.user.id)
    .eq('isletme_id', depo.isletme_id)
    .eq('aktif', true)
    .single();

  if (kiErr || !ki) {
    res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
    return false;
  }

  if (!ki.yetkiler?.depo?.[islem]) {
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

  const { data, error } = await supabaseAdmin
    .from('depolar')
    .insert({ isletme_id, ad: ad.trim() })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ hata: 'Bu depo bu işletmede zaten var.' });
    return res.status(500).json({ hata: error.message });
  }

  res.status(201).json(data);
});

// ── PUT /:id (Kullanıcı: sadece ad | Admin: ad + kod + konum + aktif) ──
router.put('/:id', async (req, res) => {
  if (!await checkDepoYetki(req, res, 'duzenle')) return;

  const { ad, kod, konum, aktif } = req.body;

  if (!ad?.trim()) {
    return res.status(400).json({ hata: 'Depo adı boş olamaz.' });
  }

  // Admin ek alanları da güncelleyebilir; kullanıcı sadece ad
  const guncelle = { ad: ad.trim() };
  if (req.user.rol === 'admin') {
    if (kod    !== undefined) guncelle.kod    = kod;
    if (konum  !== undefined) guncelle.konum  = konum;
    if (aktif  !== undefined) guncelle.aktif  = aktif;
  }

  const { data, error } = await supabaseAdmin
    .from('depolar')
    .update(guncelle)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data);
});

// ── Kullanıcı erişimli: DELETE /:id (Depo Sil) ──
router.delete('/:id', async (req, res) => {
  if (!await checkDepoYetki(req, res, 'sil')) return;

  const { error } = await supabaseAdmin
    .from('depolar')
    .update({ aktif: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ hata: error.message });
  res.json({ mesaj: 'Depo silindi.' });
});

// ── Kullanıcı erişimli: GET /?isletme_id=X ──
// Admin ise adminGuard'dan sonraki tam listeye next() ile geç
router.get('/', async (req, res, next) => {
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

  if (!ki)                        return res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
  if (!ki.yetkiler?.depo?.goruntule) return res.status(403).json({ hata: 'Depo görüntüleme yetkiniz yok.' });

  const { data, error } = await supabaseAdmin
    .from('depolar')
    .select('id, ad, konum')
    .eq('isletme_id', isletme_id)
    .eq('aktif', true)
    .order('ad');

  if (error) return res.status(500).json({ hata: error.message });
  res.json({ data: data || [], toplam: (data || []).length });
});

// ── Admin yetkisi gerektiren rotalar ──
router.use(adminGuard);

// GET /api/depolar?isletme_id=X&isletme_ids=X,Y&q=arama&sayfa=1&limit=50
router.get('/', async (req, res) => {
  const { isletme_id, isletme_ids, aktif, q, sayfa, limit = 50 } = req.query;

  let query = supabaseAdmin
    .from('depolar')
    .select('*, isletmeler(id, ad, kod)', { count: 'exact' })
    .order('isletmeler(ad)', { ascending: true })
    .order('ad', { ascending: true });

  if (isletme_id)  query = query.eq('isletme_id', isletme_id);
  if (isletme_ids) query = query.in('isletme_id', isletme_ids.split(',').filter(Boolean));
  if (aktif !== undefined) query = query.eq('aktif', aktif === 'true');
  if (q) query = query.or(`ad.ilike.%${q}%,kod.ilike.%${q}%`);

  if (sayfa) {
    const sp = Math.max(1, (v => Number.isNaN(v) ? 1 : v)(parseInt(sayfa)));
    const lm = Math.min(200, Math.max(1, (v => Number.isNaN(v) ? 50 : v)(parseInt(limit))));
    const offset = (sp - 1) * lm;
    query = query.range(offset, offset + lm - 1);
  }

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ hata: error.message });

  if (!sayfa) return res.json(data); // backward compat

  // Sayfa içindeki depolar için sayım sayısını al
  const depoIds = (data || []).map(d => d.id);
  let sayimMap = {};
  if (depoIds.length > 0) {
    const { data: sayimlar } = await supabaseAdmin
      .from('sayimlar')
      .select('depo_id')
      .in('depo_id', depoIds)
      .neq('durum', 'silindi');
    (sayimlar || []).forEach(s => {
      sayimMap[s.depo_id] = (sayimMap[s.depo_id] || 0) + 1;
    });
  }

  const enriched = (data || []).map(d => ({
    ...d,
    sayim_sayisi: sayimMap[d.id] || 0,
  }));

  res.json({ data: enriched, toplam: count });
});

// GET /api/depolar/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('depolar')
    .select('*, isletmeler(ad, kod)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ hata: 'Depo bulunamadı.' });
  res.json(data);
});

// POST /api/depolar
router.post('/', async (req, res) => {
  const { isletme_id, ad, kod, konum } = req.body;

  if (!isletme_id || !ad) {
    return res.status(400).json({ hata: 'isletme_id ve ad zorunludur.' });
  }

  const { data, error } = await supabaseAdmin
    .from('depolar')
    .insert({ isletme_id, ad, kod, konum })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ hata: 'Bu depo kodu bu işletmede zaten var.' });
    }
    return res.status(500).json({ hata: error.message });
  }

  res.status(201).json(data);
});

// NOT: PUT /:id ve DELETE /:id adminGuard öncesinde tanımlandığından
// bu noktaya hiç ulaşılmaz. Mantık authGuard öncesindeki route'lara taşındı.

module.exports = router;
