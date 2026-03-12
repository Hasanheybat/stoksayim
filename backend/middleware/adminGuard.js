module.exports = function adminGuard(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ hata: 'Bu işlem için admin yetkisi gereklidir.' });
  }
  next();
};
