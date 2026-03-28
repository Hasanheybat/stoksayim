/**
 * Dil Middleware — Accept-Language header'dan veya ?lang= query'den dil belirler
 * Öncelik: query param > header > default (az)
 */
const { SUPPORTED_LANGS, DEFAULT_LANG } = require('../lib/messages');

function langMiddleware(req, res, next) {
  // 1. Query param: ?lang=tr
  const qLang = (req.query.lang || '').toLowerCase();
  if (SUPPORTED_LANGS.includes(qLang)) {
    req.lang = qLang;
    return next();
  }

  // 2. Accept-Language header
  const header = (req.headers['accept-language'] || '').split(',')[0].split('-')[0].toLowerCase();
  if (SUPPORTED_LANGS.includes(header)) {
    req.lang = header;
    return next();
  }

  // 3. Default
  req.lang = DEFAULT_LANG;
  next();
}

module.exports = langMiddleware;
