# StokSay — Stok & Depo Sayım Sistemi

Küçük ve orta ölçekli işletmeler için çok işletmeli, rol tabanlı stok ve depo sayım yönetim sistemi. Express.js backend, React web uygulaması ve Flutter mobil uygulama ile üç katmanlı mimari.

---

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Sistem Mimarisi](#sistem-mimarisi)
- [Backend (Express.js)](#backend-expressjs)
  - [Kurulum](#backend-kurulum)
  - [Ortam Değişkenleri](#ortam-değişkenleri)
  - [Veritabanı Şeması](#veritabanı-şeması)
  - [API Endpoint'leri](#api-endpointleri)
  - [Middleware Zinciri](#middleware-zinciri)
  - [Güvenlik Mimarisi](#güvenlik-mimarisi)
- [Web Uygulaması (React + Vite)](#web-uygulaması-react--vite)
  - [Kurulum](#web-kurulum)
  - [Sayfa Yapısı](#sayfa-yapısı)
  - [State Yönetimi (Web)](#state-yönetimi-web)
  - [Yetki Sistemi (Web)](#yetki-sistemi-web)
  - [Kullanılan Kütüphaneler (Web)](#kullanılan-kütüphaneler-web)
- [Mobil Uygulama (Flutter)](#mobil-uygulama-flutter)
  - [Kurulum](#mobil-kurulum)
  - [Ekranlar ve Yönlendirme](#ekranlar-ve-yönlendirme)
  - [State Yönetimi (Mobil)](#state-yönetimi-mobil)
  - [Servis Katmanı](#servis-katmanı)
  - [Veri Modelleri](#veri-modelleri)
  - [Offline Destek ve Senkronizasyon](#offline-destek-ve-senkronizasyon)
  - [Bildirim Sistemi](#bildirim-sistemi)
  - [Barkod Tarayıcı](#barkod-tarayıcı)
  - [Kullanıcı Ayarları](#kullanıcı-ayarları)
  - [Bağımlılıklar (Flutter)](#bağımlılıklar-flutter)
- [Kimlik Doğrulama & Yetki Sistemi](#kimlik-doğrulama--yetki-sistemi)
- [Dizin Yapısı](#dizin-yapısı)
- [Sürüm Geçmişi](#sürüm-geçmişi)

---

## Genel Bakış

**StokSay** bir depo sayım ve stok yönetim sistemidir. Birden fazla işletmeyi destekler, her işletmenin kendine ait depoları, ürünleri, sayımları ve kullanıcı yetkileri bulunur.

### Platform Dağılımı

| Platform | Teknoloji | Hedef Kitle |
|----------|-----------|-------------|
| **Backend API** | Express.js + MySQL/MariaDB | Tüm istemciler |
| **Admin Paneli** (Web) | React + Vite — `/admin/*` | Sistem yöneticileri |
| **Kullanıcı Uygulaması** (Web) | React + Vite — `/app/*` | Saha kullanıcıları |
| **Mobil Uygulama** | Flutter (iOS / Android) | Saha kullanıcıları |

### Temel Özellikler

- Çok işletme desteği — tek kullanıcı birden fazla işletmede çalışabilir
- Granüler rol ve yetki sistemi (işletme bazlı JSONB)
- Depo yönetimi (CRUD, konum bilgisi)
- Ürün kataloğu (barkod, çoklu isim, birim, kategori)
- Sayım oturumları (başlat → ürün ekle → tamamla → topla)
- Sayımları birleştirme (toplama)
- Barkod ile ürün ekleme (mobil kamera tarayıcı)
- Offline çalışma ve senkronizasyon (mobil)
- Excel (XLSX/CSV) ve PDF rapor çıktısı
- Hesap makinesi entegrasyonu (sayım sırasında hesaplama)
- Overlay tabanlı bildirim sistemi (yeşil/kırmızı/mor)
- Türkçe arayüz

### Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Backend | Node.js, Express.js, MySQL/MariaDB |
| Web Frontend | React 18, Vite, Zustand, Tailwind CSS, Radix UI, Recharts |
| Mobil | Flutter, Riverpod, GoRouter, Dio, SQLite |
| Kimlik Doğrulama | JWT (7 gün süreli) |
| Şifreleme | bcryptjs (10 round) |

---

## Sistem Mimarisi

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Web      │     │  Flutter Mobil   │     │   Admin Panel   │
│   (Kullanıcı)    │     │   (iOS/Android)  │     │   (React Web)   │
│   /app/*         │     │                  │     │   /admin/*      │
│                  │     │  Offline SQLite   │     │                 │
│  Zustand Store   │     │  Riverpod State   │     │  Zustand Store  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │       REST API — JSON — JWT Bearer Token      │
         └───────────────┬───────┴───────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Express.js API     │
              │   (Port 3001)        │
              │                      │
              │  Helmet.js           │
              │  CORS Whitelist      │
              │  Rate Limiting       │
              │  authGuard           │
              │  adminGuard          │
              │  yetkiGuard          │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │   MySQL / MariaDB    │
              │   (stoksay DB)       │
              └─────────────────────┘
```

### Kimlik Doğrulama Akışı

```
Kullanıcı → Email + Şifre → POST /api/auth/login
                                    │
                              bcrypt.compare()
                                    │
                              JWT Token (7 gün)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              localStorage    SharedPreferences   Axios/Dio
              (Web)           (Mobil)             Interceptor
                    │               │
                    ▼               ▼
              GET /api/auth/me → kullanıcı + yetkilerMap
```

**Kritik Mimari Kural:** Frontend ve mobil uygulama hiçbir zaman veritabanına doğrudan yazma/okuma yapmaz. Tüm veri işlemleri backend API üzerinden geçer.

---

## Backend (Express.js)

**Konum:** `stoksay/backend/`

### Backend Kurulum

```bash
cd stoksay/backend
npm install
cp .env.example .env  # Ortam değişkenlerini düzenle
mysql -u root -p < db/schema_mariadb.sql  # Veritabanı oluştur
npm start  # Port 3001'de başlar
```

### Ortam Değişkenleri

```env
JWT_SECRET=gizli-anahtar-buraya
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sifre
DB_NAME=stoksay
DB_PORT=3306
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=3001
NODE_ENV=development
```

### Veritabanı Şeması

#### Tablolar

**kullanicilar** — Kullanıcılar

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT PK AUTO_INCREMENT | Benzersiz tanımlayıcı |
| ad_soyad | VARCHAR | İsim soyisim |
| email | VARCHAR UNIQUE | Giriş e-postası |
| sifre | VARCHAR | bcrypt hash'lenmiş şifre |
| rol | ENUM('admin','kullanici') | Sistem rolü |
| aktif | BOOLEAN DEFAULT TRUE | Hesap durumu |
| ayarlar | JSON | Kullanıcı tercihleri |

Ayarlar JSON yapısı:
```json
{
  "birim_otomatik": true,
  "barkod_sesi": true,
  "tema": "light"
}
```

---

**isletmeler** — İşletmeler

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT PK AUTO_INCREMENT | |
| ad | VARCHAR | İşletme adı |
| kod | VARCHAR UNIQUE | Kısa kod (benzersiz) |
| adres | TEXT | Adres |
| telefon | VARCHAR | Telefon numarası |
| aktif | BOOLEAN DEFAULT TRUE | Durum |

---

**depolar** — Depolar

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT PK AUTO_INCREMENT | |
| isletme_id | INT FK → isletmeler(id) | Bağlı işletme |
| ad | VARCHAR | Depo adı |
| kod | VARCHAR | Depo kodu |
| konum | VARCHAR | Fiziksel konum |
| aktif | BOOLEAN DEFAULT TRUE | Durum |

---

**isletme_urunler** — Ürünler

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT PK AUTO_INCREMENT | |
| isletme_id | INT FK → isletmeler(id) | Bağlı işletme |
| urun_kodu | VARCHAR | Ürün kodu |
| urun_adi | VARCHAR | Birincil isim |
| isim_2 | VARCHAR | İkincil isim (alternatif arama) |
| birim | VARCHAR | Ölçü birimi (ADET, KG, LT, MT, PAKET, KOLI, KUTU) |
| kategori | VARCHAR | Ürün kategorisi |
| barkodlar | TEXT | Virgülle ayrılmış barkod listesi |
| aktif | BOOLEAN DEFAULT TRUE | Durum |

---

**sayimlar** — Sayımlar

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT PK AUTO_INCREMENT | |
| isletme_id | INT FK → isletmeler(id) | Bağlı işletme |
| depo_id | INT FK → depolar(id) | Bağlı depo |
| kullanici_id | INT FK → kullanicilar(id) | Oluşturan kullanıcı |
| ad | VARCHAR | Sayım adı |
| tarih | DATETIME | Oluşturma tarihi |
| durum | ENUM('devam','tamamlandi') | Sayım durumu |
| notlar | JSON | Ek notlar |

Sayım durumları: `devam` → `tamamlandi` veya silinir (soft delete).

---

**sayim_kalemleri** — Sayım Kalemleri

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT PK AUTO_INCREMENT | |
| sayim_id | INT FK → sayimlar(id) | Bağlı sayım |
| urun_id | INT FK → isletme_urunler(id) | Bağlı ürün |
| miktar | DECIMAL(15,4) | Sayılan miktar |
| birim | VARCHAR | Sayım birimi |
| notlar | TEXT | Kalem notu |

---

**kullanici_isletme** — Kullanıcı-İşletme İlişkisi

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| kullanici_id | INT FK → kullanicilar(id) | |
| isletme_id | INT FK → isletmeler(id) | |
| yetkiler | JSON | Granüler yetki haritası |
| aktif | BOOLEAN DEFAULT TRUE | İlişki durumu |

---

**urun_log** — Ürün Değişiklik Geçmişi

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | INT PK AUTO_INCREMENT | |
| urun_id | INT FK → isletme_urunler(id) | |
| islem | VARCHAR | Yapılan işlem (ekle, güncelle, sil) |
| onceki_deger | JSON | Eski değerler |
| yeni_deger | JSON | Yeni değerler |
| tarih | DATETIME | İşlem zamanı |

---

**roller** — Rol Şablonları

Önceden tanımlanmış yetki kümeleri. Yeni kullanıcılara hızlı atama için.

### API Endpoint'leri

**Base URL:** `http://localhost:3001/api`

Tüm endpoint'ler (auth hariç) `Authorization: Bearer <JWT>` header'ı gerektirir.

#### Kimlik Doğrulama — `/api/auth`

| Method | Yol | Açıklama | Guard |
|--------|-----|----------|-------|
| POST | `/login` | E-posta + şifre ile giriş → JWT token + kullanıcı verisi | — |
| GET | `/me` | Oturum bilgisi + yetkilerMap (işletme bazlı yetkiler) | authGuard |
| PUT | `/update-email` | E-posta güncelle | authGuard |
| PUT | `/update-password` | Şifre güncelle (eski şifre + yeni şifre gerekli) | authGuard |

#### Sayımlar — `/api/sayimlar`

| Method | Yol | Açıklama | Guard |
|--------|-----|----------|-------|
| GET | `/` | Sayım listesi (filtre: isletme_id, depo_id, durum, toplama) | authGuard |
| GET | `/:id` | Sayım detayı + kalemler | authGuard |
| POST | `/` | Yeni sayım oluştur | authGuard + yetkiGuard(sayim, ekle) |
| PUT | `/:id` | Sayım güncelle (ad, notlar) | authGuard + yetkiGuard(sayim, duzenle) |
| DELETE | `/:id` | Sayımı sil (soft delete) | authGuard + yetkiGuard(sayim, sil) |
| PUT | `/:id/tamamla` | Sayımı tamamla (durum → tamamlandi) | authGuard |
| GET | `/:id/kalemler` | Sayım kalemleri listesi | authGuard |
| POST | `/:id/kalem` | Sayıma ürün ekle (urun_id, miktar, birim) | authGuard |
| PUT | `/:id/kalem/:kalemId` | Kalem güncelle (miktar, birim) | authGuard |
| DELETE | `/:id/kalem/:kalemId` | Kalem sil | authGuard |
| POST | `/topla` | Birden fazla sayımı birleştir (toplama) | authGuard |

#### Ürünler — `/api/urunler`

| Method | Yol | Açıklama | Guard |
|--------|-----|----------|-------|
| GET | `/` | Ürün listesi (sayfalama, arama, isletme_id filtresi) | authGuard |
| GET | `/barkod/:barkod` | Barkod ile ürün bul | authGuard |
| POST | `/` | Yeni ürün ekle | authGuard + yetkiGuard(urun, ekle) |
| PUT | `/:id` | Ürün güncelle (ad, birim, barkod, kategori) | authGuard + yetkiGuard(urun, duzenle) |
| DELETE | `/:id` | Ürün sil (soft delete — aktif=false) | authGuard + yetkiGuard(urun, sil) |

#### Depolar — `/api/depolar`

| Method | Yol | Açıklama | Guard |
|--------|-----|----------|-------|
| GET | `/` | Depo listesi (ilişkili sayım sayısı dahil) | authGuard |
| GET | `/:id` | Depo detayı | authGuard |
| POST | `/` | Yeni depo ekle | authGuard + yetkiGuard(depo, ekle) |
| PUT | `/:id` | Depo güncelle | authGuard + yetkiGuard(depo, duzenle) |
| DELETE | `/:id` | Depo sil (soft delete) | authGuard + yetkiGuard(depo, sil) |

#### İşletmeler — `/api/isletmeler` (Yalnızca Admin)

| Method | Yol | Açıklama | Guard |
|--------|-----|----------|-------|
| GET | `/` | Tüm işletmeler | authGuard + adminGuard |
| GET | `/:id` | İşletme detayı | authGuard + adminGuard |
| POST | `/` | Yeni işletme oluştur | authGuard + adminGuard |
| PUT | `/:id` | İşletme güncelle | authGuard + adminGuard |
| DELETE | `/:id` | İşletme sil (soft delete) | authGuard + adminGuard |

#### Profil — `/api/profil`

| Method | Yol | Açıklama | Guard |
|--------|-----|----------|-------|
| GET | `/isletmelerim` | Kullanıcının atanmış işletmeleri | authGuard |
| GET | `/stats` | İstatistikler (sayım/ürün/depo sayıları) | authGuard |
| PUT | `/ayarlar` | Kullanıcı ayarları güncelle (birim_otomatik, barkod_sesi, tema) | authGuard |

#### Kullanıcılar — `/api/kullanicilar` (Yalnızca Admin)

| Method | Yol | Açıklama | Guard |
|--------|-----|----------|-------|
| GET | `/` | Tüm kullanıcılar | authGuard + adminGuard |
| POST | `/` | Yeni kullanıcı oluştur | authGuard + adminGuard |
| PUT | `/:id` | Kullanıcı güncelle (ad, email, rol) | authGuard + adminGuard |
| DELETE | `/:id` | Kullanıcı sil / pasife al | authGuard + adminGuard |
| GET | `/:id/isletmeler` | Kullanıcının işletmeleri | authGuard + adminGuard |
| POST | `/:id/isletme` | Kullanıcıya işletme ata | authGuard + adminGuard |
| DELETE | `/:id/isletme/:isletme_id` | İşletme bağını kaldır | authGuard + adminGuard |
| PUT | `/:id/isletme/:isletme_id/yetkiler` | Yetki güncelle | authGuard + adminGuard |

#### Roller — `/api/roller` (Yalnızca Admin)

Rol şablonları yönetimi. Yetki kümelerini önceden tanımlayıp kullanıcılara toplu atama.

#### İstatistikler — `/api/stats`

Analitik ve raporlama endpoint'leri. Dashboard grafikleri için veri sağlar.

#### Sayfalama Formatı

Tüm liste endpoint'leri aynı sayfalama formatını kullanır:

```
GET /api/urunler?isletme_id=1&sayfa=1&limit=20&arama=kelime
```

```json
{
  "data": [...],
  "toplam": 150,
  "sayfa": 1,
  "limit": 20
}
```

### Middleware Zinciri

```
İstek → Helmet → CORS → Rate Limiter → JSON Parser → Route
                                                        │
                                          ┌─────────────┤
                                          ▼             ▼
                                     authGuard     Public Route
                                          │         (login)
                                    ┌─────┴─────┐
                                    ▼           ▼
                               adminGuard   yetkiGuard
                               (admin/*)    (kategori, islem)
                                    │           │
                                    ▼           ▼
                               Handler      Handler
```

**authGuard** — JWT token doğrulama. `Authorization: Bearer <token>` header'ından token'ı alır, doğrular ve `req.user` objesini set eder. Geçersiz veya eksik token'da 401 döner.

**adminGuard** — `req.user.rol === 'admin'` kontrolü. Başarısızsa 403 Forbidden döner.

**yetkiGuard(kategori, islem)** — Granüler yetki kontrolü. `kullanici_isletme.yetkiler` JSON alanından `kategori.islem` değerini kontrol eder. Admin kullanıcıları otomatik geçer. Yetki yoksa 403 döner.

### Güvenlik Mimarisi

| Katman | Önlem | Detay |
|--------|-------|-------|
| **HTTP Headers** | Helmet.js | XSS koruması, clickjacking önleme, HSTS, CSP |
| **CORS** | Whitelist | İzin verilen origin'ler `.env` ile yapılandırılır |
| **Rate Limiting** | express-rate-limit | Genel: 300 istek/15dk · Giriş: 20 deneme/15dk |
| **Kimlik Doğrulama** | JWT | 7 gün süreli token, Bearer şeması |
| **Şifreleme** | bcryptjs | 10 round hash'leme |
| **Soft Delete** | aktif flag | Veriler asla silinmez, `aktif = false` yapılır |
| **IDOR Koruması** | Sahiplik kontrolü | Her endpoint'te kullanıcı-işletme ilişkisi doğrulanır |
| **Admin Koruması** | Self-protection | Admin kendini silemez, pasif yapamaz, rolünü değiştiremez |
| **Stack Trace** | Merkezi hata handler | İç detaylar istemciye sızdırılmaz |
| **Dosya Yükleme** | Çift doğrulama | Uzantı + MIME type kontrolü, 10MB limit |

---

## Web Uygulaması (React + Vite)

**Konum:** `stoksay/frontend/`

Web uygulaması iki ayrı bölümden oluşur: **Admin Paneli** ve **Kullanıcı Uygulaması**. Her biri ayrı auth store ve API istemcisi kullanır.

### Web Kurulum

```bash
cd stoksay/frontend
npm install
cp .env.example .env  # Ortam değişkenlerini düzenle
npm run dev            # Port 5173'te geliştirme sunucusu
npm run build          # Üretim derlemesi → dist/
```

### Sayfa Yapısı

#### Genel Sayfalar (Public)

| Yol | Sayfa | Açıklama |
|-----|-------|----------|
| `/login` | LoginPage | Admin giriş ekranı |
| `/app-login` | AppLoginPage | Kullanıcı uygulaması giriş ekranı |
| `/sifremi-unuttum` | SifremiUnuttumPage | Şifre sıfırlama |

#### Admin Paneli (`/admin/*`)

| Yol | Sayfa | Açıklama |
|-----|-------|----------|
| `/admin` | Dashboard | Özet istatistikler, grafikler (Recharts) |
| `/admin/isletmeler` | IsletmelerPage | İşletme CRUD (oluştur, düzenle, sil) |
| `/admin/depolar` | DepolarPage | Depo CRUD |
| `/admin/kullanicilar` | KullanicilarPage | Kullanıcı yönetimi + rol/yetki atama |
| `/admin/urunler` | UrunlerPage | Ürün yönetimi + Excel toplu yükleme |
| `/admin/roller` | RollerPage | Rol şablonları oluşturma/düzenleme |
| `/admin/sayimlar` | SayimlarPage | Tüm sayımları görüntüleme |
| `/admin/toplanmis-sayimlar` | ToplanmisSayimlarPage | Birleştirilmiş sayımlar |
| `/admin/raporlar` | RaporlarPage | Rapor oluşturma (Excel / PDF dışa aktarım) |
| `/admin/ayarlar` | AyarlarPage | Sistem ayarları |

#### Kullanıcı Uygulaması (`/app/*`)

| Yol | Sayfa | Açıklama |
|-----|-------|----------|
| `/app` | AnaPage | Ana sayfa, senkronizasyon butonu, navigasyon kartları |
| `/app/stoklar` | StoklarPage | Ürün listesi + arama + ekleme/düzenleme |
| `/app/sayimlar` | SayimlarPage | Sayım listesi + toplama |
| `/app/depolar` | DepolarPage | Depo listesi |
| `/app/yeni-sayim` | YeniSayimPage | Yeni sayım oluştur (modal) |
| `/app/sayim/:sayimId` | SayimDetayPage | Sayım detayı + kalem CRUD + tamamlama |
| `/app/sayim/:sayimId/urun-ekle` | UrunEklePage | Sayıma ürün ekle (barkod tarayıcı, otomatik tamamlama) |
| `/app/toplanmis-sayimlar` | ToplanmisSayimlarPage | Birleştirilmiş sayımları görüntüleme |
| `/app/depo-ekle` | DepoEklePage | Yeni depo oluşturma |
| `/app/ayarlar` | AyarlarPage | Kullanıcı tercihleri (birim otomatik, barkod sesi, tema) |

### State Yönetimi (Web)

İki ayrı **Zustand** store kullanılır. Her biri `localStorage`'a persist edilir.

**authStore.js** — Kullanıcı uygulaması state'i:

```javascript
{
  kullanici: {
    id: number,
    ad_soyad: string,
    email: string,
    rol: 'admin' | 'kullanici',
    aktif: boolean,
    ayarlar: { birim_otomatik, barkod_sesi, tema }
  },
  yetkilerMap: {
    [isletme_id]: {
      urun:        { goruntule, ekle, duzenle, sil },
      depo:        { goruntule, ekle, duzenle, sil },
      barkod:      { tanimla, duzenle, sil },
      sayim:       { goruntule, ekle, duzenle, sil },
      toplam_sayim: { goruntule, ekle, duzenle, sil }
    }
  },
  yukleniyor: boolean
}

// Metodlar
login(email, sifre)           // Giriş yap
oturumKontrol()               // JWT ile oturum doğrula
cikisYap()                    // Çıkış yap + localStorage temizle
hasYetki(kategori, islem)     // Herhangi bir işletmede yetki var mı
isletmeYetkisi(id, kat, isl)  // Belirli işletmede yetki var mı
```

**authStoreAdm.js** — Admin paneli state'i (ayrı token ve oturum yönetimi).

**Axios Interceptor** — Her HTTP isteğinde JWT token'ı `Authorization: Bearer <token>` olarak otomatik eklenir. 401 yanıtında otomatik olarak giriş sayfasına yönlendirilir.

### Yetki Sistemi (Web)

```jsx
// Route koruması — ProtectedRoute bileşeni
<ProtectedRoute requireRole="admin">
  <AdminLayout />
</ProtectedRoute>

// UI'da koşullu gösterim
const { hasYetki, isletmeYetkisi } = useAuthStore();

// Herhangi bir işletmede ürün ekleme yetkisi var mı
if (hasYetki('urun', 'ekle')) {
  // "Ürün Ekle" butonunu göster
}

// Belirli bir işletmede sayım görüntüleme yetkisi var mı
if (isletmeYetkisi(isletme_id, 'sayim', 'goruntule')) {
  // Sayım listesini göster
}
```

### İki Ayrı Auth Akışı

| | Admin Paneli | Kullanıcı Uygulaması |
|-|-------------|---------------------|
| Giriş URL | `/login` | `/app-login` |
| Store | `authStoreAdm` | `authStore` |
| API İstemcisi | `apiAdm.js` | `api.js` |
| 401 Yönlendirmesi | `/login` | `/app-login` |

### Kullanılan Kütüphaneler (Web)

| Kütüphane | Kullanım |
|-----------|----------|
| React 18 | UI framework |
| Vite | Build tool + dev server |
| Zustand | State yönetimi (persist middleware ile) |
| Axios | HTTP istemcisi (JWT interceptor) |
| React Router v6 | Yönlendirme (nested routes, modal desteği) |
| Tailwind CSS | Utility-first stil sistemi |
| Radix UI | Erişilebilir UI bileşenleri (dialog, dropdown, tabs) |
| Recharts | Dashboard analitik grafikleri |
| SheetJS (XLSX) | Excel dışa aktarım + toplu yükleme |
| jsPDF | PDF rapor oluşturma |

---

## Mobil Uygulama (Flutter)

**Konum:** `mobile/`

Flutter ile geliştirilmiş, iOS ve Android destekli mobil uygulama. Offline-first mimaride çalışır, yerel SQLite veritabanı ile senkronizasyon kuyruğu yönetir.

### Mobil Kurulum

```bash
cd mobile
flutter pub get

# iOS cihaza yükleme
flutter run -d <cihaz_id> --release

# Android cihaza yükleme
flutter run --release

# Web derlemesi (backend public klasörüne)
flutter build web && cp -r build/web/* ../stoksay/backend/public/
```

**API Yapılandırması:** `lib/config/api_config.dart` dosyasında `baseUrl` değerini düzenleyin.

| Ortam | URL |
|-------|-----|
| Emülatör | `http://localhost:3001/api` |
| Fiziksel cihaz (aynı ağ) | `http://<bilgisayar_ip>:3001/api` |
| Üretim | `https://api.domain.com/api` |

### Ekranlar ve Yönlendirme

GoRouter kullanılır. Tüm route'lar `lib/app.dart` dosyasında tanımlıdır.

| Yol | Ekran | Açıklama |
|-----|-------|----------|
| `/login` | LoginScreen | Giriş ekranı — uygulama açılışında otomatik oturum kontrolü yapar |
| `/` | HomeScreen | Ana sayfa — senkronizasyon butonu, istatistik kartları, hızlı navigasyon |
| `/stoklar` | StoklarScreen | Ürün listesi + arama + ekleme (yeşil bildirim) + düzenleme (mor bildirim) |
| `/sayimlar` | SayimlarScreen | Sayım listesi + toplama (birleştirme) + FAB ile yeni sayım |
| `/depolar` | DepolarScreen | Depo listesi |
| `/ayarlar` | AyarlarScreen | Kullanıcı tercihleri — toggle ile değiştirilir (mor bildirim) |
| `/yeni-sayim` | YeniSayimScreen | Yeni sayım oluştur → otomatik olarak ürün ekleme ekranına yönlendirir |
| `/sayim/:sayimId` | SayimDetayScreen | Sayım detayı — kalem listesi, silme (kırmızı), güncelleme (mor) |
| `/sayim/:sayimId/urun-ekle` | UrunEkleScreen | Sayıma ürün ekle — otomatik tamamlama, barkod tarayıcı, hesap makinesi |
| `/toplanmis-sayimlar` | ToplanmisSayimlarScreen | Birleştirilmiş sayımlar — isim düzenleme, silme |

### State Yönetimi (Mobil)

**Riverpod** kullanılır. Üç ana provider bulunur.

#### authProvider — Kimlik Doğrulama

```dart
class AuthState {
  Kullanici? kullanici;              // Kullanıcı bilgileri
  Map<String, dynamic> yetkilerMap;  // İşletme bazlı yetki haritası
  bool yukleniyor;                   // Yükleme durumu
  String? hata;                      // Hata mesajı
}

// Metodlar
Future<void> girisYap(String email, String sifre);   // JWT token al
Future<void> oturumKontrol();                         // Token doğrula
void cikisYap();                                      // Token sil
bool hasYetki(String kategori, String islem);          // Herhangi bir işletmede yetki
bool isletmeYetkisi(String isletmeId, String kat, String isl);  // Belirli işletmede yetki
```

#### isletmeProvider — İşletme Seçimi

Seçili işletme bilgisini tutar. Birden fazla işletmeye erişimi olan kullanıcılar aralarında geçiş yapabilir. Seçilen işletme tüm veri sorgularını filtreler.

#### connectivityProvider — Ağ Durumu

`connectivity_plus` paketi ile ağ bağlantı durumunu gerçek zamanlı izler. Online/offline geçişlerinde senkronizasyon tetikler.

### Servis Katmanı

Tüm servisler `lib/services/` altında yer alır. Backend API ile haberleşmeyi yönetir.

| Servis | Dosya | Açıklama |
|--------|-------|----------|
| ApiService | `api_service.dart` | Dio HTTP istemcisi — JWT interceptor, timeout, hata yönetimi |
| StorageService | `storage_service.dart` | SharedPreferences sarmalayıcı — token saklama |
| AuthService | `auth_service.dart` | Giriş / çıkış / oturum kontrolü |
| SayimService | `sayim_service.dart` | Sayım CRUD + kalemler + tamamlama + toplama |
| UrunService | `urun_service.dart` | Ürün CRUD + barkod ile arama |
| DepoService | `depo_service.dart` | Depo CRUD |
| IsletmeService | `isletme_service.dart` | İşletme listesi |
| ProfilService | `profil_service.dart` | İstatistikler + ayar güncelleme |

**Dio Interceptor:**
```dart
// Her istekte JWT token eklenir
options.headers['Authorization'] = 'Bearer $token';

// 401 yanıtında otomatik çıkış
if (response.statusCode == 401) {
  StorageService.tokenSil();
  // Login ekranına yönlendir
}
```

### Veri Modelleri

Tüm modeller `lib/models/` altında yer alır.

| Model | Dosya | Alanlar |
|-------|-------|---------|
| Kullanici | `kullanici.dart` | id, adSoyad, email, rol, aktif, ayarlar |
| Sayim | `sayim.dart` | id, isletmeId, depoId, ad, tarih, durum, kisiler, notlar |
| SayimKalemi | `sayim_kalemi.dart` | id, sayimId, urunId, miktar, birim |
| Urun | `urun.dart` | id, isletmeId, urunKodu, urunAdi, isim2, birim, barkodlar |
| Depo | `depo.dart` | id, ad, konum, isletmeId, aktif |
| Isletme | `isletme.dart` | id, ad, kod, aktif |

### Offline Destek ve Senkronizasyon

Mobil uygulama **offline-first** mimaride çalışır. `lib/db/` altındaki dosyalar yerel veritabanı ve senkronizasyon mantığını yönetir.

#### Yerel Veritabanı (SQLite)

`database_helper.dart` ile yönetilir. Tablo yapısı:

```sql
-- Ana tablolar (sunucudan senkronize)
isletmeler       (id, ad, kod, aktif)
depolar          (id, isletme_id, ad, konum, aktif)
                 INDEX: idx_depolar_isletme
urunler          (id, isletme_id, urun_kodu, urun_adi, isim_2, birim, kategori, barkodlar, aktif)
                 INDEX: idx_urunler_isletme
sayimlar         (id, isletme_id, depo_id, ad, tarih, durum, kullanici_id, kisiler, notlar)
                 INDEX: idx_sayimlar_isletme
sayim_kalemleri  (id, sayim_id, urun_id, miktar, birim, notlar)
                 INDEX: idx_kalemler_sayim

-- Kullanıcı önbelleği
kullanici_cache  (id, kullanici TEXT [JSON], yetkiler_map TEXT [JSON])

-- Offline işlem kuyruğu
sync_queue       (id AUTOINCREMENT, tablo, islem, veri TEXT [JSON], olusturma, durum)
                 INDEX: idx_sync_durum
                 durum: 'bekliyor' | 'gonderiliyor' | 'hata'
```

#### Senkronizasyon Akışı

```
1. Tam Senkronizasyon (tamSenkronizasyon)
   ├── Her işletme için:
   │   ├── Depoları çek → SQLite'a yaz
   │   ├── Ürünleri çek → SQLite'a yaz
   │   └── Sayımları çek → SQLite'a yaz
   └── Kullanıcı bilgisini cache'le

2. Kuyruk Yönetimi
   ├── Offline işlem → kuyruguEkle() → sync_queue'ya INSERT
   └── Online olunca → kuyruguGonder()
       ├── sync_queue'dan 'bekliyor' durumundaki kayıtları oku
       ├── Sırayla backend'e gönder
       ├── Başarılıysa: kayıt sil
       ├── Geçici ID'leri sunucu ID'leri ile değiştir
       └── Hatalıysa: durum = 'hata' olarak işaretle
```

### Bildirim Sistemi

`lib/widgets/bildirim.dart` — Tüm bildirimler **Overlay** tabanlı, ekranın sağ üst köşesinden kayarak gelen ve otomatik kaybolan toast bildirimlerdir.

#### Bildirim Tipleri

| Tip | Renk | Hex | Kullanım |
|-----|------|-----|----------|
| `BildirimTip.basarili` | Yeşil | #10B981 → #059669 | Ekleme işlemleri |
| `BildirimTip.hata` | Kırmızı | #EF4444 → #DC2626 | Silme işlemleri, hatalar |
| `BildirimTip.bilgi` | Mor | #6C53F5 → #8B5CF6 | Güncelleme işlemleri |

#### Renk Kuralları

- **Yeşil (basarili):** Yeni veri ekleme — ürün eklendi, stok eklendi, sayım oluşturuldu
- **Kırmızı (hata):** Silme işlemleri — kalem silindi, sayım silindi, hata mesajları
- **Mor (bilgi):** Güncelleme işlemleri — miktar güncellendi, stok güncellendi, isim güncellendi, ayar değiştirildi

#### Kullanım

```dart
// Yeşil — ekleme
showBildirim(context, 'Ürün sayıma eklendi!');

// Kırmızı — silme
showBildirim(context, 'Sayım silindi', tip: BildirimTip.hata);

// Mor — güncelleme
showBildirim(context, 'Stok güncellendi', tip: BildirimTip.bilgi);

// Kırmızı — hata
showBildirim(context, 'Miktar girin.', basarili: false);
```

#### Animasyon Özellikleri

- **Giriş:** Sağdan sola SlideTransition + FadeTransition (300ms)
- **Çıkış:** Sağa doğru kayarak kaybolma (300ms)
- **Süre:** Varsayılan 2 saniye (özelleştirilebilir)
- **Etkileşim:** Sola kaydırarak kapatma (swipe-to-dismiss)
- **Konum:** Sağ üst köşe, `top: 60px`, `right: 16px`
- **Boyut:** Maksimum genişlik 280px
- **Davranış:** Aynı anda sadece bir bildirim gösterilir, yeni bildirim eskisini kapatır

### Barkod Tarayıcı

`mobile_scanner` paketi ile kamera üzerinden barkod okuma. Ürün ekleme ekranında (UrunEkleScreen) kullanılır.

**Akış:**
1. Kamera açılır → barkod taranır
2. `GET /api/urunler/barkod/:barkod` ile ürün aranır
3. Ürün bulunursa → form alanları otomatik doldurulur
4. Titreşim geri bildirimi (`vibration` paketi)

### Kullanıcı Ayarları

Ayarlar ekranında (AyarlarScreen) toggle ile değiştirilir. Backend'e `PUT /api/profil/ayarlar` ile kaydedilir.

| Ayar | Varsayılan | Açıklama |
|------|------------|----------|
| `birim_otomatik` | `true` | **Açık:** Ürün seçilince birim otomatik olarak ürünün birimi ile doldurulur. **Kapalı:** Kullanıcı birime dokunarak sadece o ürüne özgü birimi manuel seçer. Seçmezse "Birim seçin." hatası alır. |
| `barkod_sesi` | `true` | Barkod okuyunca titreşim geri bildirimi |
| `tema` | `"light"` | Tema tercihi |

### Ürün Ekleme Ekranı (UrunEkleScreen) — Detaylı

Bu ekran sayıma ürün ekleme işleminin merkezidir. Karmaşık etkileşim mantığı içerir:

**Otomatik Tamamlama (Autocomplete):**
- Kullanıcı ürün adı yazarken 300ms debounce ile API'den arama yapılır
- Sonuçlar dropdown listede gösterilir (maksimum 320px yükseklik)
- Ürün seçilince form alanları otomatik doldurulur
- Ürün seçildikten sonra sonuç listesi otomatik kapanır
- Seçim sonrası yeni arama tetiklenmez (`_urunId` kontrolü ile)

**Birim Seçici:**
- Otomatik mod: Ürün seçilince birim otomatik dolar (salt okunur)
- Manuel mod: Birime dokunulunca sadece ürünün kendi birimi gösterilir (bottom sheet picker)

**Hesap Makinesi:**
- Miktar alanına dokunulunca bottom sheet hesap makinesi açılır
- Toplama, çıkarma, çarpma, bölme destekler
- Sonuç doğrudan miktar alanına yazılır

**Barkod İkincil İsim:**
- Ürün kodları ve barkodlar form altında chip olarak gösterilir

### Bağımlılıklar (Flutter)

`pubspec.yaml` dosyasında tanımlı:

| Paket | Sürüm | Kullanım |
|-------|-------|----------|
| flutter_riverpod | ^3.3.1 | State yönetimi (provider pattern) |
| go_router | ^17.1.0 | Deklaratif yönlendirme |
| dio | ^5.9.2 | HTTP istemcisi (interceptor desteği) |
| sqflite | ^2.4.2 | Yerel SQLite veritabanı |
| connectivity_plus | ^7.0.0 | Ağ bağlantı durumu izleme |
| mobile_scanner | ^7.2.0 | Kamera ile barkod tarama |
| shared_preferences | ^2.5.4 | Anahtar-değer depolama (token, tercihler) |
| intl | ^0.20.2 | Tarih/sayı formatlama (Türkçe lokalizasyon) |
| path_provider | ^2.1.5 | Dosya sistemi yolları |
| share_plus | ^12.0.1 | Platform paylaşım diyalogu |
| pdf | ^3.11.3 | PDF oluşturma |
| csv | ^7.2.0 | CSV dışa aktarım |
| vibration | ^3.1.8 | Titreşim geri bildirimi (barkod okuma) |

---

## Kimlik Doğrulama & Yetki Sistemi

### Roller

| Rol | Yetki Kapsamı |
|-----|---------------|
| `admin` | Tüm işlemlere tam erişim. Tüm middleware kontrollerini otomatik geçer. İşletme/kullanıcı/rol yönetimi yapabilir. |
| `kullanici` | `kullanici_isletme.yetkiler` JSON alanına göre kısıtlı erişim. Sadece atandığı işletmelerin verilerine erişir. |

### Yetki Matrisi

```json
{
  "urun": {
    "goruntule": true,
    "ekle": false,
    "duzenle": false,
    "sil": false
  },
  "depo": {
    "goruntule": true,
    "ekle": false,
    "duzenle": false,
    "sil": false
  },
  "barkod": {
    "tanimla": false,
    "duzenle": false,
    "sil": false
  },
  "sayim": {
    "goruntule": true,
    "ekle": true,
    "duzenle": false,
    "sil": false
  },
  "toplam_sayim": {
    "goruntule": false,
    "ekle": false,
    "duzenle": false,
    "sil": false
  }
}
```

### Yetki Kontrolü — Tüm Katmanlarda

```
Backend:   yetkiGuard('urun', 'ekle')
           → kullanici_isletme tablosundan yetkiler JSON kontrolü
           → Yetkisizse 403 Forbidden

Web:       const { hasYetki, isletmeYetkisi } = useAuthStore();
           → hasYetki('urun', 'ekle') → UI bileşenini gizle/göster
           → isletmeYetkisi(id, 'sayim', 'goruntule') → İşletme bazlı kontrol

Mobil:     ref.read(authProvider).hasYetki('sayim', 'ekle')
           → ref.read(authProvider).isletmeYetkisi(isletmeId, 'sayim', 'goruntule')
           → Ekran/buton erişim kontrolü
```

---

## Dizin Yapısı

```
stoksay/
├── backend/
│   ├── index.js                    # Express sunucu giriş noktası
│   ├── package.json                # Node.js bağımlılıkları
│   ├── .env                        # Ortam değişkenleri (gizli)
│   ├── .env.example                # Ortam değişkenleri şablonu
│   ├── middleware/
│   │   ├── authGuard.js            # JWT token doğrulama
│   │   ├── adminGuard.js           # Admin rol kontrolü
│   │   └── yetkiGuard.js           # Granüler yetki kontrolü
│   ├── routes/
│   │   ├── auth.js                 # Giriş / çıkış / oturum
│   │   ├── sayimlar.js             # Sayım CRUD + kalemler + toplama
│   │   ├── urunler.js              # Ürün CRUD + barkod arama
│   │   ├── depolar.js              # Depo CRUD
│   │   ├── isletmeler.js           # İşletme CRUD (admin)
│   │   ├── kullanicilar.js         # Kullanıcı yönetimi (admin)
│   │   ├── roller.js               # Rol şablonları (admin)
│   │   ├── profil.js               # Profil + ayarlar + istatistik
│   │   ├── stats.js                # Dashboard istatistikleri
│   │   └── seed.js                 # İlk admin kullanıcısı oluştur
│   ├── db/
│   │   ├── schema.sql              # PostgreSQL şeması (RLS politikaları)
│   │   ├── schema_mariadb.sql      # MySQL/MariaDB şeması
│   │   ├── demo_data.sql           # Test verileri
│   │   └── seed_realistic.js       # Gerçekçi veri üretici
│   ├── lib/
│   │   └── supabase.js             # Supabase istemcisi
│   └── public/                     # Statik dosyalar (Flutter web build çıktısı)
│
├── frontend/
│   ├── package.json                # React bağımlılıkları
│   ├── vite.config.js              # Vite yapılandırması
│   ├── .env.example                # Frontend ortam değişkenleri
│   └── src/
│       ├── main.jsx                # React giriş noktası
│       ├── App.jsx                 # Route yapılandırması (React Router v6)
│       ├── store/
│       │   ├── authStore.js        # Kullanıcı auth state (Zustand + persist)
│       │   └── authStoreAdm.js     # Admin auth state (Zustand + persist)
│       ├── lib/
│       │   ├── api.js              # Kullanıcı Axios istemcisi (JWT interceptor)
│       │   ├── apiAdm.js           # Admin Axios istemcisi (JWT interceptor)
│       │   ├── supabase.js         # Supabase auth istemcisi
│       │   └── supabaseAdm.js      # Admin Supabase auth istemcisi
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── LoginPage.jsx           # Admin giriş
│       │   │   ├── AppLoginPage.jsx        # Kullanıcı giriş
│       │   │   └── SifremiUnuttumPage.jsx  # Şifre sıfırlama
│       │   ├── admin/
│       │   │   ├── AdminLayout.jsx         # Admin kabuk (sidebar, header)
│       │   │   ├── Dashboard.jsx           # İstatistik paneli
│       │   │   ├── IsletmelerPage.jsx      # İşletme CRUD
│       │   │   ├── DepolarPage.jsx         # Depo CRUD
│       │   │   ├── UrunlerPage.jsx         # Ürün yönetimi
│       │   │   ├── KullanicilarPage.jsx    # Kullanıcı + yetki yönetimi
│       │   │   ├── RollerPage.jsx          # Rol şablonları
│       │   │   ├── SayimlarPage.jsx        # Sayım görüntüleme
│       │   │   ├── RaporlarPage.jsx        # Rapor oluşturma
│       │   │   └── AyarlarPage.jsx         # Sistem ayarları
│       │   └── app/
│       │       ├── AppLayout.jsx           # Kullanıcı kabuk (nav, header)
│       │       ├── AnaPage.jsx             # Ana sayfa
│       │       ├── StoklarPage.jsx         # Ürün listesi
│       │       ├── SayimlarPage.jsx        # Sayım listesi
│       │       ├── DepolarPage.jsx         # Depo listesi
│       │       ├── YeniSayimPage.jsx       # Yeni sayım (modal)
│       │       ├── SayimDetayPage.jsx      # Sayım detayı
│       │       ├── UrunEklePage.jsx        # Ürün ekleme (barkod)
│       │       ├── DepoEklePage.jsx        # Depo ekleme
│       │       ├── ToplanmisSayimlarPage.jsx # Birleştirilmiş sayımlar
│       │       └── AyarlarPage.jsx         # Kullanıcı tercihleri
│       ├── components/
│       │   ├── ui/
│       │   │   ├── ProtectedRoute.jsx      # Rol tabanlı route koruması
│       │   │   └── [Radix UI bileşenleri]
│       │   └── app/
│       │       ├── StokEkle.jsx            # Stok ekleme formu
│       │       ├── StokDuzenle.jsx         # Stok düzenleme formu
│       │       ├── DepoEkle.jsx            # Depo ekleme formu
│       │       └── DepoDuzenle.jsx         # Depo düzenleme formu
│       └── styles/
│           └── globals.css                 # Global stiller

mobile/  (Flutter)
├── pubspec.yaml                    # Flutter bağımlılıkları
├── ios/                            # iOS platform dosyaları
├── android/                        # Android platform dosyaları
├── web/                            # Web platform dosyaları
└── lib/
    ├── main.dart                   # Giriş noktası (StorageService init, ProviderScope)
    ├── app.dart                    # GoRouter yapılandırması + MaterialApp teması
    ├── config/
    │   └── api_config.dart         # API URL, timeout süreleri, token storage key
    ├── models/
    │   ├── kullanici.dart          # Kullanıcı modeli (fromJson, toJson)
    │   ├── sayim.dart              # Sayım modeli
    │   ├── sayim_kalemi.dart       # Sayım kalemi modeli
    │   ├── urun.dart               # Ürün modeli
    │   ├── depo.dart               # Depo modeli
    │   └── isletme.dart            # İşletme modeli
    ├── services/
    │   ├── api_service.dart        # Dio HTTP istemcisi (JWT interceptor, 401 handling)
    │   ├── storage_service.dart    # SharedPreferences sarmalayıcı
    │   ├── auth_service.dart       # Giriş / çıkış / oturum kontrolü
    │   ├── sayim_service.dart      # Sayım CRUD + kalemler + tamamlama + toplama
    │   ├── urun_service.dart       # Ürün CRUD + barkod arama
    │   ├── depo_service.dart       # Depo CRUD
    │   ├── isletme_service.dart    # İşletme listesi
    │   └── profil_service.dart     # İstatistikler + ayar güncelleme
    ├── db/
    │   ├── database_helper.dart    # SQLite şeması oluşturma + CRUD yardımcıları
    │   └── sync_service.dart       # Tam senkronizasyon + kuyruk yönetimi
    ├── providers/
    │   ├── auth_provider.dart      # Riverpod — kimlik doğrulama state
    │   ├── isletme_provider.dart   # Riverpod — seçili işletme state
    │   └── connectivity_provider.dart # Riverpod — ağ bağlantı durumu
    ├── screens/
    │   ├── login_screen.dart       # Giriş ekranı
    │   ├── home_screen.dart        # Ana sayfa (senkronizasyon, navigasyon)
    │   ├── stoklar_screen.dart     # Ürün listesi + CRUD
    │   ├── sayimlar_screen.dart    # Sayım listesi + toplama
    │   ├── depolar_screen.dart     # Depo listesi
    │   ├── ayarlar_screen.dart     # Kullanıcı tercihleri
    │   ├── yeni_sayim_screen.dart  # Yeni sayım oluştur → ürün ekleme ekranına git
    │   ├── sayim_detay_screen.dart # Sayım detayı + kalem CRUD
    │   ├── urun_ekle_screen.dart   # Ürün ekleme (autocomplete, barkod, hesap makinesi)
    │   ├── toplanmis_sayimlar_screen.dart  # Birleştirilmiş sayımlar
    │   ├── app_layout.dart         # Uygulama kabuk (app bar, navigasyon)
    │   └── shell_screen.dart       # Shell route
    └── widgets/
        └── bildirim.dart           # Overlay bildirim sistemi (yeşil/kırmızı/mor)
```

---

## Sürüm Geçmişi

### v1.1.0 — 2026-03-14

#### Yeni Özellikler
- Flutter mobil uygulama (iOS + Android)
- Offline-first mimari (SQLite + senkronizasyon kuyruğu)
- Barkod tarayıcı (kamera ile)
- Overlay tabanlı bildirim sistemi (sağ üstten kayarak gelen)
- Renk kodlu bildirimler (yeşil=ekle, kırmızı=sil, mor=güncelle)
- Birim otomatik/manuel seçim ayarı
- Hesap makinesi entegrasyonu (ürün ekleme ekranında)
- Sayım oluşturduktan sonra otomatik ürün ekleme ekranına yönlendirme
- PDF ve CSV dışa aktarım (mobil)
- Titreşim geri bildirimi (barkod okuma)

#### Düzeltmeler
- Ürün arama sonuçları seçimden sonra kapanmama sorunu düzeltildi
- Birim otomatik kapalıyken tüm birimlerin gösterilmesi düzeltildi (sadece ürüne özgü birim)
- Birim seçilmeden ekleme yapılırsa hata bildirimi eklendi
- Tüm bildirimler sağ üst köşeden gelecek şekilde birleştirildi (SnackBar/MaterialBanner kaldırıldı)
- FAB butonları daha yukarı taşındı (bottom: 32)

### v1.0.0 — 2026-03-12

**İlk kararlı sürüm.**

#### Özellikler
- Çok işletme, çok kullanıcı mimarisi
- Granüler rol ve yetki sistemi (işletme bazlı JSONB)
- Depo yönetimi
- Ürün kataloğu (Excel toplu yükleme, barkod desteği)
- Sayım oturumları (başlat / kalem ekle / tamamla / topla)
- Hesap makinesi entegrasyonu
- CSV ve PDF rapor çıktısı
- Mobil öncelikli web kullanıcı arayüzü
- Tam yönetici paneli

#### Güvenlik
- CORS whitelist + Helmet.js güvenlik başlıkları
- Rate limiting (API + auth endpoint'leri)
- IDOR koruması (tüm endpoint'lerde sahiplik + yetki çift kontrolü)
- Admin self-protection (kendi hesabını silme/pasife alma engeli)
- Dosya yükleme: MIME type + uzantı çift doğrulama, 10MB limit
- XSS koruması: PDF üretiminde HTML escape
- Stack trace sızdırmama: merkezi hata yöneticisi
