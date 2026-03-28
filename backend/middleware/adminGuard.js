const { msg, messages } = require('../lib/messages');

module.exports = function adminGuard(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ hata: msg(req.lang, 'ADMIN_ONLY') });
  }
  next();
};
