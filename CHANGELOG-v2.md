# StokSay v2.0.0 — Değişiklik Günlüğü

**Tarih:** 2026-03-13
**Önceki sürüm:** v1.0.0 (Supabase tabanlı)
**Yeni sürüm:** v2.0.0 (MariaDB/MySQL + Kendi Auth)

---

## Özet

Supabase (bulut PostgreSQL + Supabase Auth) tamamen kaldırıldı. Yerine local MariaDB/MySQL veritabanı ve kendi JWT tabanlı kimlik doğrulama sistemi getirildi. Proje artık hiçbir dış servise bağımlı değil — tamamen self-hosted çalışıyor.

---

## 1. Veritabanı Değişikliği

### v1 (Eski)
- **Supabase PostgreSQL** (bulut)
- Supabase JS SDK üzerinden sorgu (`supabase.from('tablo').select()`)
- Row Level Security (RLS) ile yetkilendirme
- PostgreSQL'e özgü: `JSONB`, `TIMESTAMPTZ`, `GIN index`, `tsvector`
- Supabase Auth ile kullanıcı yönetimi

### v2 (Yeni)
- **MariaDB / MySQL** (local veya sunucu)
- `mysql2/promise` driver ile raw SQL sorguları (parametreli prepared statements)
- Middleware tabanlı yetkilendirme (`authGuard.js`, `yetkiGuard.js`)
- MySQL karşılıkları: `JSON`, `DATETIME`, `INDEX`, `LIKE`
- Kendi auth sistemi (`bcryptjs` + `jsonwebtoken`)

### Yeni Dosyalar
| Dosya | Açıklama |
|-------|----------|
| `backend/lib/db.js` | MySQL connection pool (10 bağlantı, JSON typeCast, TINYINT→boolean) |
| `backend/db/schema_mariadb.sql` | 9 tablo şeması (169 satır) — `utf8mb4_unicode_ci` charset |

### Silinen Dosyalar
| Dosya | Açıklama |
|-------|----------|
| `backend/lib/supabase.js` | Supabase backend client |
| `frontend/src/lib/supabase.js` | Supabase frontend client |
| `frontend/src/lib/supabaseAdm.js` | Supabase admin client |

---

## 2. Kimlik Doğrulama (Auth) Değişikliği

### v1 (Eski)
- `supabase.auth.signInWithPassword()` — Supabase Auth servisi
- `supabase.auth.getSession()` — oturum yönetimi Supabase tarafında
- `supabase.auth.admin.createUser()` — kullanıcı oluşturma
- `supabase.auth.resetPasswordForEmail()` — email ile şifre sıfırlama
- Token yönetimi Supabase SDK içinde otomatik

### v2 (Yeni)
- `POST /api/auth/login` — `bcrypt.compare()` + `jwt.sign()` ile token üretimi
- `GET /api/auth/me` — JWT doğrulama + kullanıcı bilgisi + yetkilerMap
- `PUT /api/auth/update-email` — email güncelleme
- `PUT /api/auth/update-password` — eski şifre doğrulama + yeni şifre hash
- Token: localStorage'da saklanır (`stoksay-token`, `stoksay-adm-token`)
- Şifre sıfırlama: Kaldırıldı → "Yöneticinize başvurun" mesajı
- Token süresi: 7 gün, 401 alınca otomatik logout

### Güvenlik Önlemleri (Yeni)
- **Rate Limiting**: API 300 istek/15dk, Login 20 deneme/15dk
- **bcrypt salt round**: 10
- **Helmet**: HTTP güvenlik header'ları
- **Prepared statements**: SQL injection koruması

---

## 3. Backend Route Değişiklikleri (8 dosya)

Tüm route dosyalarında Supabase SDK sorguları → parametreli MySQL sorgularına dönüştürüldü.

### Dönüşüm Kuralları
| Supabase (v1) | MySQL (v2) |
|----------------|------------|
| `.select('*', {count:'exact'})` | `SELECT COUNT(*) + SELECT ... LIMIT ? OFFSET ?` |
| `.select('*, tablo(kolon)')` | `LEFT JOIN + response nesne yapılandırma` |
| `.insert({...}).select().single()` | `INSERT INTO ... + SELECT WHERE id=?` |
| `.upsert({...}, {onConflict:...})` | `INSERT ... ON DUPLICATE KEY UPDATE` |
| `.ilike('ad', '%x%')` | `ad LIKE ?` (utf8mb4_unicode_ci case-insensitive) |
| `error.code === '23505'` | `error.errno === 1062` (duplicate entry) |
| `.eq('id', x).single()` | `WHERE id = ? LIMIT 1` |

### Değişen Route Dosyaları
| Dosya | Sorgu Sayısı | Özel Değişiklikler |
|-------|-------------|-------------------|
| `routes/auth.js` | 6 | Login, me, update-email, update-password (yeni endpoint'ler) |
| `routes/kullanicilar.js` | 16 | `createUser` → bcrypt hash + INSERT, ban → aktif=0 |
| `routes/sayimlar.js` | 18 | Nested JOIN'ler, kalem CRUD, durum güncelleme |
| `routes/urunler.js` | 17 | Excel upload, barkod merge, ON DUPLICATE KEY |
| `routes/stats.js` | 11 | COUNT sorguları, Promise.all |
| `routes/depolar.js` | 10 | Permission check, isletme doğrulama |
| `routes/roller.js` | 7 | Cascade yetkiler update |
| `routes/isletmeler.js` | 5 | Standart CRUD |
| `routes/profil.js` | 5 | Ayarlar endpoint'i eklendi |

### MySQL 9.x Uyumluluk Düzeltmeleri
- **LIMIT/OFFSET**: Prepared statement'ta `?` parametre kabul etmiyor → doğrudan integer interpolasyon (`parseInt` ile güvenli)
- **JSON typeCast**: `field.string('utf8')` ile encoding belirtilmesi gerekiyor

---

## 4. Frontend Değişiklikleri (19 dosya)

### API Client (2 dosya)
| Dosya | v1 | v2 |
|-------|----|----|
| `lib/api.js` | Supabase session token | `localStorage.getItem('stoksay-token')` + axios interceptor |
| `lib/apiAdm.js` | Supabase admin session | `localStorage.getItem('stoksay-adm-token')` + axios interceptor |

Her iki client'ta 401 response interceptor var — token geçersizse otomatik logout ve login sayfasına yönlendirme.

### Auth Store (2 dosya)
| Dosya | v1 | v2 |
|-------|----|----|
| `store/authStore.js` | `supabase.auth.getSession()` + `onAuthStateChange` | `GET /api/auth/me` + localStorage token |
| `store/authStoreAdm.js` | Supabase admin session | `GET /api/auth/me` + localStorage token |

### Login Sayfaları (3 dosya)
| Dosya | v1 | v2 |
|-------|----|----|
| `pages/auth/LoginPage.jsx` | `supabase.auth.signInWithPassword()` | `apiAdm.post('/auth/login')` + rol kontrolü |
| `pages/auth/AppLoginPage.jsx` | `supabase.auth.signInWithPassword()` | `api.post('/auth/login')` |
| `pages/auth/SifremiUnuttumPage.jsx` | `supabase.auth.resetPasswordForEmail()` | Statik "Yöneticinize başvurun" mesajı |

### Bileşenler ve Sayfalar (12 dosya)
Supabase `fetch` + manual header → `api.get/post/put/delete` dönüşümü:

| Dosya | Değişiklik |
|-------|-----------|
| `components/app/DepoEkle.jsx` | `fetch` → `api.post('/depolar')` |
| `components/app/DepoDuzenle.jsx` | `fetch` → `api.put/delete` |
| `components/app/StokEkle.jsx` | `fetch` → `api.post('/urunler')` |
| `components/app/StokDuzenle.jsx` | `fetch` → `api.put/delete` |
| `pages/app/AnaPage.jsx` | `supabase.from('isletmeler')` → `api.get('/isletmeler')` |
| `pages/app/AyarlarPage.jsx` | `supabase.from('kullanicilar').update()` → `api.put('/profil/ayarlar')` |
| `pages/app/DepoEklePage.jsx` | Supabase sorguları → `api.get` |
| `pages/app/YeniSayimPage.jsx` | Supabase sorguları → `api.get` |
| `pages/app/UrunEklePage.jsx` | Supabase insert → `api.post('/sayimlar/:id/kalem')` |
| `pages/admin/AyarlarPage.jsx` | `supabase.auth.updateUser()` → `apiAdm.put('/auth/update-email\|password')` |

---

## 5. Bağımlılık Değişiklikleri

### Backend
| Eklenen | Kaldırılan |
|---------|-----------|
| `mysql2` ^3.19.1 | `@supabase/supabase-js` ^2.39.0 |
| `bcryptjs` ^3.0.3 | — |

### Frontend
| Eklenen | Kaldırılan |
|---------|-----------|
| — | `@supabase/supabase-js` ^2.39.0 |

---

## 6. Seed Script (Tamamen Yeniden Yazıldı)

### v1
- Supabase Admin SDK ile veri oluşturma
- Supabase Auth ile kullanıcı kayıt

### v2
- `mysql2/promise` + `bcryptjs` ile doğrudan SQL
- Batch INSERT (500-1000 satır/batch) ile yüksek performans
- 161.000+ kayıt 4.3 saniyede oluşturulur
- `--temizle` flag'i ile demo veri temizleme

### Oluşturulan Veri
| Veri | Miktar |
|------|--------|
| Admin kullanıcı | 1 (admin@stoksay.com / Admin1234!) |
| Demo kullanıcı | 100 (demo001-100@stoksay.demo / Demo1234!) |
| İşletme | 100 |
| Depo | 1.000 (işletme başına 10) |
| Ürün | 150.000 (işletme başına 1.500) |
| Sayım | 10.000 (depo başına 10) |

---

## 7. Environment Variables

### v1 (.env)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=...
```

### v2 (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=stoksay
DB_PASS=stoksay123
DB_NAME=stoksay
JWT_SECRET=...
```

---

## 8. Test Sonuçları (v2)

### API Testleri: 22/22 PASS
Tüm CRUD endpoint'leri (isletmeler, depolar, urunler, sayimlar, kullanicilar, roller, profil, stats)

### Güvenlik Testleri: 29/31 PASS
- SQL Injection koruması (parametreli sorgular)
- XSS koruması (input sanitizasyonu)
- Token manipülasyonu engellendi
- Path traversal engellendi
- Auth bypass engellendi
- Rate limiting aktif (brute-force koruması)

### Stress Testleri: 10/10 PASS
- 200 eş zamanlı istek: 0 hata, 7.407 req/s
- Connection pool (10 bağlantı): tükenme yok
- Concurrent yazma (20): hepsi başarılı
- bcrypt yoğun login: event loop bloke olmadı
- Invalid token flood (50): graceful handling

---

## 9. Dosya İstatistikleri

| Metrik | Değer |
|--------|-------|
| Değişen dosya sayısı | 36 |
| Yeni dosya | 2 (db.js, schema_mariadb.sql) |
| Silinen dosya | 3 (supabase.js × 2, supabaseAdm.js) |
| Eklenen satır | ~1.867 |
| Silinen satır | ~1.887 |
| Supabase referansı (kalan) | 0 |

---

## 10. Kurulum (v2)

```bash
# 1. MariaDB/MySQL kurulumu
brew install mariadb && brew services start mariadb
# veya: MySQL 8+ / MariaDB 10.5+

# 2. Veritabanı oluştur
mysql -u root -e "CREATE DATABASE stoksay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "CREATE USER 'stoksay'@'localhost' IDENTIFIED BY 'stoksay123';"
mysql -u root -e "GRANT ALL ON stoksay.* TO 'stoksay'@'localhost';"

# 3. Schema uygula
mysql -u stoksay -pstoksay123 stoksay < backend/db/schema_mariadb.sql

# 4. Backend
cd backend
cp .env.example .env   # DB_HOST, DB_USER, DB_PASS, JWT_SECRET düzenle
npm install
node seed.js            # Demo veri oluştur

# 5. Frontend
cd frontend
npm install

# 6. Çalıştır
cd backend && npm run dev    # port 3001
cd frontend && npm run dev   # port 5173
```
