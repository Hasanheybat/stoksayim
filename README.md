# StokSay — Stok & Depo Sayım Sistemi

Küçük ve orta ölçekli işletmeler için çok işletmeli, rol tabanlı stok ve depo sayım yönetim sistemi.

---

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Sistem Mimarisi](#sistem-mimarisi)
- [Klasör Yapısı](#klasör-yapısı)
- [Kimlik Doğrulama & Yetki Sistemi](#kimlik-doğrulama--yetki-sistemi)
- [Veritabanı Şeması](#veritabanı-şeması)
- [API Referansı](#api-referansı)
- [Güvenlik Mimarisi](#güvenlik-mimarisi)
- [Kurulum](#kurulum)
- [Çevre Değişkenleri](#çevre-değişkenleri)
- [Sürüm Geçmişi](#sürüm-geçmişi)

---

## Genel Bakış

**StokSay**, iki ayrı arayüze sahip bir web uygulamasıdır:

| Arayüz | URL | Hedef Kitle |
|--------|-----|-------------|
| **Admin Paneli** | `/admin/*` | Sistem yöneticileri |
| **Kullanıcı Uygulaması** | `/app/*` | Saha kullanıcıları (mobil öncelikli) |

### Temel Özellikler

- Çok işletme desteği — tek kullanıcı birden fazla işletmede çalışabilir
- Granüler rol ve yetki sistemi (işletme bazlı)
- Depo yönetimi
- Barkod ile ürün ekleme
- Sayım oturumları (başlat → ürün ekle → tamamla)
- Excel (CSV) ve PDF rapor çıktısı
- Hesap makinesi entegrasyonu (sayım sırasında hesaplama)

---

## Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Vite)                     │
│                                                         │
│  /admin/* ─── AdminLayout ─── Admin Sayfaları           │
│  /app/*   ─── AppLayout   ─── Kullanıcı Sayfaları       │
│  /login       AdminLoginPage                            │
│  /app-login   AppLoginPage                              │
│                                                         │
│  State: Zustand (authStore + authStoreAdm)              │
│  HTTP:  Axios (api.js + apiAdm.js)                      │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API (JSON)
┌───────────────────────▼─────────────────────────────────┐
│                   Backend (Express.js)                   │
│                                                         │
│  Middleware Zinciri:                                     │
│  authGuard → [adminGuard | yetkiGuard] → route handler  │
│                                                         │
│  Rate Limiting: 300 req/15dk (genel), 20/15dk (auth)    │
│  Güvenlik: Helmet, CORS whitelist, merkezi hata handler  │
└───────────────────────┬─────────────────────────────────┘
                        │ supabase-js (service_role)
┌───────────────────────▼─────────────────────────────────┐
│                  Supabase (PostgreSQL)                   │
│                                                         │
│  Auth: Supabase Auth (JWT)                              │
│  DB:   PostgreSQL (RLS aktif)                           │
│  Backend: supabaseAdmin (RLS bypass, güvenli)           │
│  Frontend: supabase (RLS aktif, sadece auth için)        │
└─────────────────────────────────────────────────────────┘
```

**Kritik Mimari Kural:** Frontend hiçbir zaman veritabanına doğrudan yazma/okuma yapmaz. Tüm veri işlemleri backend API üzerinden geçer. Frontend `supabase` istemcisi yalnızca `auth.signIn()` / `auth.signOut()` / `auth.getSession()` için kullanılır.

---

## Klasör Yapısı

```
stoksay/
├── backend/
│   ├── db/
│   │   ├── schema.sql          # Tam veritabanı şeması
│   │   ├── demo_data.sql       # Test verisi
│   │   └── migration_isim2.sql # isim_2 alanı migrasyonu
│   ├── lib/
│   │   └── supabase.js         # supabaseAdmin istemcisi
│   ├── middleware/
│   │   ├── authGuard.js        # JWT doğrulama
│   │   ├── adminGuard.js       # Admin rol kontrolü
│   │   └── yetkiGuard.js       # Granüler yetki kontrolü
│   ├── routes/
│   │   ├── auth.js             # Giriş/çıkış
│   │   ├── profil.js           # Profil & bağlı işletmeler
│   │   ├── isletmeler.js       # İşletme CRUD
│   │   ├── kullanicilar.js     # Kullanıcı yönetimi
│   │   ├── roller.js           # Rol yönetimi
│   │   ├── depolar.js          # Depo CRUD
│   │   ├── urunler.js          # Ürün CRUD + Excel yükleme
│   │   ├── sayimlar.js         # Sayım yönetimi
│   │   ├── stats.js            # Dashboard istatistikleri
│   │   └── seed.js             # Admin kullanıcısı oluştur
│   ├── index.js                # Express uygulama giriş noktası
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admin/          # Admin bileşenleri
    │   │   ├── app/            # Kullanıcı uygulama bileşenleri
    │   │   └── ui/             # Ortak UI bileşenleri (shadcn)
    │   ├── lib/
    │   │   ├── api.js          # Kullanıcı API istemcisi (Axios)
    │   │   ├── apiAdm.js       # Admin API istemcisi (Axios)
    │   │   ├── supabase.js     # Supabase auth istemcisi
    │   │   └── supabaseAdm.js  # Admin Supabase auth istemcisi
    │   ├── pages/
    │   │   ├── admin/          # Admin panel sayfaları
    │   │   ├── app/            # Kullanıcı uygulama sayfaları
    │   │   └── auth/           # Giriş sayfaları
    │   ├── store/
    │   │   ├── authStore.js    # Kullanıcı auth state (Zustand)
    │   │   └── authStoreAdm.js # Admin auth state (Zustand)
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    └── package.json
```

---

## Kimlik Doğrulama & Yetki Sistemi

### İki Ayrı Auth Akışı

| | Admin Paneli | Kullanıcı Uygulaması |
|-|-------------|---------------------|
| Giriş URL | `/login` | `/app-login` |
| Store | `authStoreAdm` | `authStore` |
| API | `apiAdm.js` | `api.js` |
| 401 yönlendirmesi | `/login` | `/app-login` |

### Middleware Zinciri

```
İstek → authGuard → adminGuard (admin rotaları için)
                 → yetkiGuard (kullanıcı rotaları için)
                 → route handler
```

**authGuard:** Supabase JWT token'ı doğrular, `req.user` nesnesini doldurur.

**adminGuard:** `req.user.rol === 'admin'` kontrolü.

**yetkiGuard(kategori, islem, kaynak):**
```js
yetkiGuard('urun', 'goruntule', 'query')  // query.isletme_id'den alır
yetkiGuard('sayim', 'ekle', 'body')       // body.isletme_id'den alır
```
`kullanici_isletme.yetkiler` JSONB alanını kontrol eder.

### Yetki Matrisi

```js
yetkiler = {
  urun:   { goruntule, ekle, duzenle, sil },
  depo:   { goruntule, ekle, duzenle, sil },
  barkod: { tanimla, duzenle, sil },
  sayim:  { goruntule, ekle, duzenle, sil }
}
```

**Varsayılan Yetki** (yeni işletme ataması):
```js
{
  urun:   { goruntule: true,  ekle: false, duzenle: false, sil: false },
  depo:   { goruntule: true,  ekle: false, duzenle: false, sil: false },
  barkod: { tanimla: false, duzenle: false, sil: false },
  sayim:  { goruntule: true,  ekle: false, duzenle: false, sil: false }
}
```

### Frontend Yetki Kontrolü

```js
// authStore.js
isletmeYetkisi(isletme_id, kategori, islem)
// → !!yetkilerMap[isletme_id]?.[kategori]?.[islem]

// Kullanımı:
const canEkle = isletmeYetkisi(isletme_id, 'sayim', 'ekle');
```

---

## Veritabanı Şeması

### Temel Tablolar

| Tablo | Açıklama |
|-------|----------|
| `kullanicilar` | Kullanıcı profilleri (Supabase Auth ile senkron) |
| `isletmeler` | İşletme tanımları |
| `kullanici_isletme` | Kullanıcı–işletme ilişkisi + yetkiler JSONB |
| `roller` | Özel rol tanımları |
| `depolar` | İşletmeye bağlı depolar |
| `isletme_urunler` | İşletme ürün kataloğu |
| `sayimlar` | Sayım oturumları |
| `sayim_kalemleri` | Sayım kalemleri (ürün + miktar) |

### Soft Delete

Silme işlemleri: `aktif = false` olarak işaretleme. Gerçek silme yok.

### Sayım Durumları

```
devam → tamamlandi
devam → silindi
```

---

## API Referansı

**Base URL:** `http://localhost:3001/api`

Tüm endpoint'ler (auth hariç) `Authorization: Bearer <JWT>` header'ı gerektirir.

### Auth

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/auth/giris` | Giriş (email + şifre) |
| POST | `/auth/cikis` | Çıkış |

### Profil

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/profil/ben` | Oturum bilgileri |
| GET | `/profil/isletmelerim` | Kullanıcının işletmeleri + yetkiler |
| GET | `/profil/stats` | Kullanıcı ana sayfa istatistikleri |
| PUT | `/profil/guncelle` | Profil güncelle |
| POST | `/profil/sifre-degistir` | Şifre değiştir |

### İşletmeler (Admin)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/isletmeler` | Liste (sayfalı) |
| POST | `/isletmeler` | Yeni işletme |
| PUT | `/isletmeler/:id` | Güncelle |
| DELETE | `/isletmeler/:id` | Sil (soft) |

### Kullanıcılar (Admin)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/kullanicilar` | Liste (sayfalı) |
| POST | `/kullanicilar` | Yeni kullanıcı |
| PUT | `/kullanicilar/:id` | Güncelle |
| DELETE | `/kullanicilar/:id` | Pasife al |
| GET | `/kullanicilar/:id/isletmeler` | Kullanıcının işletmeleri |
| POST | `/kullanicilar/:id/isletme` | İşletme ata |
| DELETE | `/kullanicilar/:id/isletme/:isletme_id` | İşletme bağını kaldır |
| PUT | `/kullanicilar/:id/isletme/:isletme_id/yetkiler` | Yetki güncelle |

### Depolar

| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/depolar` | Liste | `depo.goruntule` |
| POST | `/depolar` | Yeni depo | Admin |
| PUT | `/depolar/:id` | Güncelle | `depo.duzenle` |
| DELETE | `/depolar/:id` | Pasife al | Admin |

### Ürünler

| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/urunler` | Liste (sayfalı, arama) | `urun.goruntule` |
| POST | `/urunler` | Yeni ürün | `urun.ekle` |
| PUT | `/urunler/:id` | Güncelle | `urun.duzenle` |
| DELETE | `/urunler/:id` | Sil | Admin |
| POST | `/urunler/yukle` | Excel toplu yükleme | Admin |
| POST | `/urunler/:id/barkod` | Barkod tanımla | `barkod.tanimla` |

### Sayımlar

| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/sayimlar` | Liste | `sayim.goruntule` |
| POST | `/sayimlar` | Yeni sayım | `sayim.ekle` |
| GET | `/sayimlar/:id` | Detay + kalemler | `sayim.goruntule` |
| PUT | `/sayimlar/:id` | Meta güncelle | Sahiplik |
| PUT | `/sayimlar/:id/tamamla` | Tamamla | `sayim.duzenle` |
| DELETE | `/sayimlar/:id` | Sil | `sayim.sil` |
| GET | `/sayimlar/:id/kalemler` | Kalem listesi | `sayim.goruntule` |
| POST | `/sayimlar/:id/kalem` | Kalem ekle | `sayim.ekle` |
| PUT | `/sayimlar/:id/kalem/:kid` | Kalem güncelle | `sayim.duzenle` |
| DELETE | `/sayimlar/:id/kalem/:kid` | Kalem sil | `sayim.sil` |

### Sayfalama

Tüm liste endpoint'leri aynı sayfalama formatını kullanır:

```
GET /api/urunler?isletme_id=...&sayfa=1&limit=20&q=arama
```

```json
{
  "veri": [...],
  "toplam": 150,
  "sayfa": 1,
  "limit": 20
}
```

---

## Güvenlik Mimarisi

### Uygulanan Önlemler

| Katman | Önlem |
|--------|-------|
| **Transport** | HTTPS (prod), CORS whitelist |
| **Headers** | Helmet.js (CSP, HSTS, XSS koruması) |
| **Rate Limiting** | 300 req/15dk (API), 20/15dk (auth) |
| **Auth** | Supabase JWT, 401'de token temizle |
| **IDOR** | Her endpoint'te sahiplik + yetki çift kontrolü |
| **Admin Koruması** | Admin kendini silemez, pasif yapamaz, rolünü değiştiremez |
| **Dosya Yükleme** | Uzantı + MIME type çift doğrulama, 10MB limit |
| **XSS (PDF)** | HTML escape fonksiyonu tüm kullanıcı verilerine uygulanır |
| **Stack Trace** | Merkezi hata handler — iç detaylar istemciye sızdırılmaz |
| **DB Erişimi** | Frontend hiçbir zaman DB'ye doğrudan yazmaz |

### Route Ordering Mimarisi

Admin ve kullanıcı route'ları aynı dosyada şu pattern ile yönetilir:

```js
// Kullanıcı route'u — admin gelirse next() ile geçer
router.get('/', async (req, res, next) => {
  if (req.user.rol === 'admin') return next();
  // kullanıcı mantığı...
});

// Admin middleware
router.use(adminGuard);

// Admin route'u — sadece adminGuard geçenlere ulaşır
router.get('/', async (req, res) => {
  // admin mantığı...
});
```

---

## Kurulum

### Gereksinimler

- Node.js 18+
- Supabase projesi (veritabanı şeması: `backend/db/schema.sql`)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenle
npm start
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# .env dosyasını düzenle
npm run dev
```

### İlk Kurulum

```bash
# Admin kullanıcısı oluştur
cd backend
node seed.js
```

---

## Çevre Değişkenleri

### Backend `.env`

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend `.env`

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:3001/api
```

---

## Sürüm Geçmişi

### v1.0.0 — 2026-03-12

**İlk kararlı sürüm.**

#### Özellikler
- Çok işletme, çok kullanıcı mimarisi
- Granüler rol ve yetki sistemi (işletme bazlı JSONB)
- Depo yönetimi
- Ürün kataloğu (Excel toplu yükleme, barkod desteği)
- Sayım oturumları (başlat / kalem ekle / tamamla)
- Hesap makinesi entegrasyonu
- CSV ve PDF/HTML rapor çıktısı
- Mobil öncelikli kullanıcı arayüzü
- Tam yönetici paneli

#### Güvenlik
- CORS whitelist + Helmet.js güvenlik başlıkları
- Rate limiting (API + auth endpoint'leri)
- IDOR koruması (tüm endpoint'lerde sahiplik + yetki çift kontrolü)
- Admin self-protection (kendi hesabını silme/pasife alma engeli)
- Dosya yükleme: MIME type + uzantı çift doğrulama, 10MB limit
- XSS koruması: PDF üretiminde HTML escape
- Stack trace sızdırmama: merkezi hata yöneticisi
- Frontend → DB doğrudan erişim tamamen kaldırıldı
