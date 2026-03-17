const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../lib/db');
const authGuard = require('../middleware/authGuard');

// POST /api/auth/login — email + sifre → JWT token + kullanici bilgisi
router.post('/login', async (req, res) => {
  const { email, password, sifre } = req.body;
  const pass = password || sifre;

  if (!email || !pass) {
    return res.status(400).json({ hata: 'Email ve şifre zorunludur.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ hata: 'Geçerli bir email adresi giriniz.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM kullanicilar WHERE email = ?',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ hata: 'Geçersiz email veya şifre.' });
    }

    const kullanici = rows[0];

    if (!kullanici.aktif) {
      return res.status(403).json({ hata: 'Hesabınız pasif durumdadır.' });
    }

    const eslesme = await bcrypt.compare(pass, kullanici.password_hash);
    if (!eslesme) {
      return res.status(401).json({ hata: 'Geçersiz email veya şifre.' });
    }

    const token = jwt.sign(
      { sub: kullanici.id, email: kullanici.email, rol: kullanici.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // password_hash'i yanıttan çıkar
    const { password_hash, ...kullaniciData } = kullanici;

    res.json({ token, kullanici: kullaniciData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/auth/me — authGuard → kullanici bilgisi + yetkilerMap
router.get('/me', authGuard, async (req, res) => {
  try {
    let yetkilerMap = {};

    if (req.user.rol !== 'admin') {
      const [rows] = await pool.execute(
        'SELECT isletme_id, yetkiler FROM kullanici_isletme WHERE kullanici_id = ? AND aktif = 1',
        [req.user.id]
      );

      for (const row of rows) {
        yetkilerMap[row.isletme_id] = row.yetkiler;
      }
    }

    res.json({ kullanici: req.user, yetkilerMap });
  } catch (err) {
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// PUT /api/auth/update-email — admin email güncelle
router.put('/update-email', authGuard, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ hata: 'Email zorunludur.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ hata: 'Geçerli bir email adresi giriniz.' });
  }

  try {
    await pool.execute('UPDATE kullanicilar SET email = ? WHERE id = ?', [email.trim(), req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    if (err.errno === 1062) return res.status(409).json({ hata: 'Bu email zaten kullanılıyor.' });
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// PUT /api/auth/update-password — şifre güncelle
router.put('/update-password', authGuard, async (req, res) => {
  const { eskiSifre, yeniSifre } = req.body;
  if (!eskiSifre || !yeniSifre) return res.status(400).json({ hata: 'Eski ve yeni şifre zorunludur.' });
  if (yeniSifre.length < 8) return res.status(400).json({ hata: 'Yeni şifre en az 8 karakter olmalıdır.' });

  try {
    const [rows] = await pool.execute('SELECT password_hash FROM kullanicilar WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ hata: 'Kullanıcı bulunamadı.' });

    const eslesme = await bcrypt.compare(eskiSifre, rows[0].password_hash);
    if (!eslesme) return res.status(401).json({ hata: 'Mevcut şifre hatalı.' });

    const hash = await bcrypt.hash(yeniSifre, 10);
    await pool.execute('UPDATE kullanicilar SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

module.exports = router;
