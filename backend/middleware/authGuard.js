const jwt = require('jsonwebtoken');
const { pool } = require('../lib/db');
const { msg, messages } = require('../lib/messages');

module.exports = async function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ hata: msg(req.lang, 'SESSION_NOT_FOUND') });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      'SELECT id, ad_soyad, email, rol, aktif, ayarlar FROM kullanicilar WHERE id = ?',
      [payload.sub]
    );

    if (!rows.length) {
      return res.status(401).json({ hata: msg(req.lang, 'USER_NOT_FOUND') });
    }

    const kullanici = rows[0];

    if (!kullanici.aktif) {
      return res.status(403).json({ hata: msg(req.lang, 'ACCOUNT_INACTIVE') });
    }

    req.user = kullanici;
    next();
  } catch (err) {
    return res.status(401).json({ hata: msg(req.lang, 'SESSION_INVALID') });
  }
};
