const { pool } = require('../lib/db');
const { msg, messages } = require('../lib/messages');

/**
 * Yetki kontrolü middleware factory
 * @param {string} kategori - 'urun' | 'depo' | 'sayim' | 'toplam_sayim'
 * @param {string} islem    - 'goruntule' | 'ekle' | 'duzenle' | 'sil'
 * @param {string} isletmeIdSource - req objesinden isletme_id'nin alınacağı yer
 *   'body' | 'params' | 'query' (default: 'query')
 */
function yetkiGuard(kategori, islem, isletmeIdSource = 'query') {
  return async function (req, res, next) {
    try {
      // Admin her şeyi yapabilir
      if (req.user.rol === 'admin') return next();

      const isletme_id =
        isletmeIdSource === 'body'   ? req.body.isletme_id :
        isletmeIdSource === 'params' ? req.params.isletme_id :
        req.query.isletme_id;

      if (!isletme_id) {
        return res.status(400).json({ hata: msg(req.lang, 'BUSINESS_ID_MISSING') });
      }

      const [rows] = await pool.execute(
        'SELECT yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND isletme_id = ? AND aktif = 1',
        [req.user.id, isletme_id]
      );

      if (!rows.length) {
        return res.status(403).json({ hata: msg(req.lang, 'NO_ACCESS_TO_BUSINESS') });
      }

      const yetkiler = rows[0].yetkiler || {};

      if (!yetkiler[kategori] || !yetkiler[kategori][islem]) {
        return res.status(403).json({
          hata: messages._NO_PERMISSION(req.lang, kategori, islem)
        });
      }

      req.yetkiler = yetkiler;
      next();
    } catch (err) {
      console.error('[yetkiGuard]', err.message);
      return res.status(500).json({ hata: msg(req.lang, 'SERVER_ERROR') });
    }
  };
}

module.exports = yetkiGuard;
