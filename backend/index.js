require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// JWT Secret başlangıç kontrolü — secret yoksa sunucu başlamasın
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET env değişkeni tanımlı değil veya 32 karakterden kısa. Sunucu başlatılamıyor.');
  process.exit(1);
}

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const path = require('path');
const app = express();

// Reverse proxy (Nginx) arkasında gerçek kullanıcı IP'sini al
app.set('trust proxy', 1);

// Güvenlik başlıkları (XSS, clickjacking, MIME sniffing vb.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "blob:"],
      connectSrc: ["'self'",
        ...(process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
          .split(',').map(o => o.trim())
      ],
    },
  },
}));

// CORS: Sadece izin verilen origin'lerden gelen istekleri kabul et
const izinliOriginler = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Origin yoksa (mobil uygulama, Postman, server-to-server) veya izin listesindeyse geç
    // Not: Mobil uygulamalar ve cURL origin header göndermez — bu isteklere izin verilmeli
    if (!origin || izinliOriginler.includes(origin)) return cb(null, true);
    console.warn(`CORS engellendi: "${origin}"`);
    cb(new Error('CORS ihlali'));
  },
  credentials: true,
}));

// CORS hata handler — Error('CORS ihlali') yakalanır ve 403 döner
app.use((err, req, res, next) => {
  if (err.message === 'CORS ihlali') {
    return res.status(403).json({ hata: 'Bu origin\'den erişime izin verilmiyor.' });
  }
  next(err);
});

app.use(express.json());

// Rate limiting — brute-force ve DoS koruması
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 dakika
  max: 1500,                  // IP başına 15 dk'da max 1500 istek (20 kullanıcı × dakikada 10 ürün taraması)
  standardHeaders: true,
  legacyHeaders: false,
  message: { hata: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 dakika
  max: 20,                    // Login deneme limiti (brute-force)
  standardHeaders: true,
  legacyHeaders: false,
  message: { hata: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' },
});

// Hassas yazma işlemleri için ayrı limiter
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,                    // 15 dk'da max 60 yazma işlemi
  standardHeaders: true,
  legacyHeaders: false,
  message: { hata: 'Çok fazla istek. Lütfen biraz bekleyip tekrar deneyin.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/update-password', authLimiter);
app.use('/api/auth/update-email', authLimiter);
app.use('/api/kullanicilar', writeLimiter);

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/isletmeler',  require('./routes/isletmeler'));
app.use('/api/depolar',     require('./routes/depolar'));
app.use('/api/kullanicilar',require('./routes/kullanicilar'));
app.use('/api/urunler',     require('./routes/urunler'));
app.use('/api/sayimlar',    require('./routes/sayimlar'));
app.use('/api/profil',      require('./routes/profil'));
app.use('/api/roller',      require('./routes/roller'));
app.use('/api/stats',       require('./routes/stats'));

// Flutter mobil web build — statik dosya servisi
app.use('/mobile', express.static(path.join(__dirname, 'public/mobile')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Merkezi hata yakalayıcı — stack trace ve iç yolları dışarı sızdırmaz
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ hata: 'Bu kaynaktan erişim izni yok.' });
  }
  console.error('[API Hatası]', err.message);
  res.status(500).json({ hata: 'Sunucu hatası.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`StokSay API çalışıyor: http://localhost:${PORT}`);
});
