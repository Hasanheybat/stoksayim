const jwt = require('jsonwebtoken');
const { pool } = require('../lib/db');

module.exports = async function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ hata: 'Oturum açılmamış.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      'SELECT id, ad_soyad, email, rol, aktif, ayarlar FROM kullanicilar WHERE id = ?',
      [payload.sub]
    );

    if (!rows.length) {
      return res.status(401).json({ hata: 'Kullanıcı bulunamadı.' });
    }

    const kullanici = rows[0];

    if (!kullanici.aktif) {
      return res.status(403).json({ hata: 'Hesabınız pasif durumdadır.' });
    }

    req.user = kullanici;
    next();
  } catch (err) {
    return res.status(401).json({ hata: 'Geçersiz veya süresi dolmuş oturum.' });
  }
};
