const { supabaseAdmin } = require('../lib/supabase');

module.exports = async function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ hata: 'Oturum açılmamış.' });
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ hata: 'Geçersiz veya süresi dolmuş oturum.' });
  }

  // Kullanıcı bilgisini veritabanından çek (rol için)
  const { data: kullanici, error: kullaniciHata } = await supabaseAdmin
    .from('kullanicilar')
    .select('id, ad_soyad, email, rol, aktif, ayarlar')
    .eq('id', user.id)
    .single();

  if (kullaniciHata || !kullanici) {
    return res.status(401).json({ hata: 'Kullanıcı bulunamadı.' });
  }

  if (!kullanici.aktif) {
    return res.status(403).json({ hata: 'Hesabınız pasif durumdadır.' });
  }

  req.user = kullanici;
  next();
};
