const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const authGuard = require('../middleware/authGuard');
const adminGuard = require('../middleware/adminGuard');

// Tüm route'lar auth + admin gerektirir
router.use(authGuard, adminGuard);

// GET /api/isletmeler?aktif=true&q=arama&sayfa=1&limit=50
router.get('/', async (req, res) => {
  const { aktif, q, sayfa, limit = 50 } = req.query;

  let query = supabaseAdmin
    .from('isletmeler')
    .select('*', { count: 'exact' })
    .order('ad');

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

  if (sayfa) return res.json({ data, toplam: count });
  res.json(data); // backward compat — dropdown listeler için
});

// GET /api/isletmeler/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('isletmeler')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ hata: 'İşletme bulunamadı.' });
  res.json(data);
});

// POST /api/isletmeler
router.post('/', async (req, res) => {
  const { ad, kod, adres, telefon } = req.body;

  if (!ad || !kod) {
    return res.status(400).json({ hata: 'Ad ve kod zorunludur.' });
  }

  const { data, error } = await supabaseAdmin
    .from('isletmeler')
    .insert({ ad, kod, adres, telefon })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ hata: 'Bu kod zaten kullanımda.' });
    }
    return res.status(500).json({ hata: error.message });
  }

  res.status(201).json(data);
});

// PUT /api/isletmeler/:id
router.put('/:id', async (req, res) => {
  const { ad, kod, adres, telefon, aktif } = req.body;

  const { data, error } = await supabaseAdmin
    .from('isletmeler')
    .update({ ad, kod, adres, telefon, aktif })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ hata: error.message });
  res.json(data);
});

// DELETE /api/isletmeler/:id — Soft delete (pasife al)
router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('isletmeler')
    .update({ aktif: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ hata: error.message });
  res.json({ mesaj: 'İşletme pasife alındı.' });
});

module.exports = router;
