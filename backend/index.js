require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const app = express();

// Güvenlik başlıkları (XSS, clickjacking, MIME sniffing vb.)
app.use(helmet({ contentSecurityPolicy: false })); // CSP frontend ile çakışabileceğinden kapalı

// CORS: Sadece izin verilen origin'lerden gelen istekleri kabul et
const izinliOriginler = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Origin yoksa (Postman, server-to-server) veya izin listesindeyse geç
    if (!origin || izinliOriginler.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: "${origin}" origin'ine izin verilmiyor.`));
  },
  credentials: true,
}));

app.use(express.json());

// Rate limiting — brute-force ve DoS koruması
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 dakika
  max: 300,                   // IP başına 15 dk'da max 300 istek
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

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

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
