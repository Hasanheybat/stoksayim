const { supabaseAdmin } = require('../lib/supabase');

/**
 * Yetki kontrolü middleware factory
 * @param {string} kategori - 'urun' | 'depo' | 'barkod' | 'sayim'
 * @param {string} islem    - 'goruntule' | 'ekle' | 'duzenle' | 'sil' | 'tanimla'
 * @param {string} isletmeIdSource - req objesinden isletme_id'nin alınacağı yer
 *   'body' | 'params' | 'query' (default: 'query')
 */
function yetkiGuard(kategori, islem, isletmeIdSource = 'query') {
  return async function (req, res, next) {
    // Admin her şeyi yapabilir
    if (req.user.rol === 'admin') return next();

    const isletme_id =
      isletmeIdSource === 'body'   ? req.body.isletme_id :
      isletmeIdSource === 'params' ? req.params.isletme_id :
      req.query.isletme_id;

    if (!isletme_id) {
      return res.status(400).json({ hata: 'isletme_id gerekli.' });
    }

    const { data, error } = await supabaseAdmin
      .from('kullanici_isletme')
      .select('yetkiler')
      .eq('kullanici_id', req.user.id)
      .eq('isletme_id', isletme_id)
      .eq('aktif', true)
      .single();

    if (error || !data) {
      return res.status(403).json({ hata: 'Bu işletmeye erişim yetkiniz yok.' });
    }

    const yetkiler = data.yetkiler;

    if (!yetkiler[kategori] || !yetkiler[kategori][islem]) {
      return res.status(403).json({
        hata: `${kategori} ${islem} yetkisine sahip değilsiniz.`
      });
    }

    req.yetkiler = yetkiler;
    next();
  };
}

module.exports = yetkiGuard;
