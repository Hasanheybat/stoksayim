# StokSay — Depo Sayim ve Stok Yonetim Sistemi

Kucuk ve orta olcekli isletmeler icin cok isletmeli, rol tabanli stok ve depo sayim yonetim sistemi.

**v3** — Backend API + Admin Paneli

---

## Icindekiler

- [Genel Bakis](#genel-bakis)
- [Ozellikler](#ozellikler)
- [Sistem Mimarisi](#sistem-mimarisi)
- [Kurulum](#kurulum)
- [Ortam Degiskenleri](#ortam-degiskenleri)
- [Veritabani Semasi](#veritabani-semasi)
- [API Endpointleri](#api-endpointleri)
- [Admin Paneli](#admin-paneli)
- [Guvenlik](#guvenlik)
- [Yetki Sistemi](#yetki-sistemi)
- [Dizin Yapisi](#dizin-yapisi)
- [Surum Gecmisi](#surum-gecmisi)

---

## Genel Bakis

**StokSay** bir depo sayim ve stok yonetim sistemidir. Birden fazla isletmeyi destekler, her isletmenin kendine ait depolari, urunleri, sayimlari ve kullanici yetkileri bulunur.

| Platform | Teknoloji | Hedef Kitle |
|----------|-----------|-------------|
| **Backend API** | Express.js + MySQL/MariaDB | Tum istemciler |
| **Admin Paneli** (Web) | React + Vite | Sistem yoneticileri |
| **Mobil Uygulama** | Flutter (iOS / Android) — [ayri repo](https://github.com/Hasanheybat/stoksay-mobile) | Saha kullanicilari |

### Teknoloji Yigini

| Katman | Teknoloji |
|--------|-----------|
| Backend | Node.js, Express.js 4.18, MySQL/MariaDB (mysql2) |
| Frontend | React 18, Vite 5, Zustand 4.4, Tailwind CSS 3.4, Radix UI |
| Grafik & Rapor | Recharts 3.8, jsPDF 4.2, SheetJS (XLSX) |
| Kimlik Dogrulama | JWT (jsonwebtoken 9.0, 7 gun sureli) |
| Sifreleme | bcryptjs (10 round) |
| Guvenlik | Helmet.js, CORS, express-rate-limit |
| Proses Yonetimi | PM2 |

---

## Ozellikler

### Cekirdek
- Cok isletme destegi — tek kullanici birden fazla isletmede calisabilir
- Granuler rol ve yetki sistemi (isletme bazli JSON)
- Depo yonetimi (CRUD, konum bilgisi)
- Urun katalogu (barkod, coklu isim, birim, kategori)
- Sayim oturumlari (baslat → urun ekle → tamamla → topla)
- Sayimlari birlestirme (toplama)
- Excel (XLSX) toplu urun yukleme + catisma cozumu
- PDF ve Excel rapor ciktisi
- Dashboard istatistikleri ve grafikler

### Guvenlik
- JWT tabanli kimlik dogrulama
- CORS whitelist + Helmet.js guvenlik basiklari
- Rate limiting (genel: 300/15dk, giris: 20/15dk)
- Soft delete — veriler asla silinmez
- IDOR korumasi — sahiplik + yetki cift kontrol
- Admin self-protection — kendi hesabini silemez/pasif yapamaz
- Dosya yukleme: MIME type + uzanti cift dogrulama, 10MB limit

### Admin Paneli
- Dashboard (ozet istatistikler, Recharts grafikleri)
- Isletme yonetimi
- Depo yonetimi
- Kullanici yonetimi + isletme atama + yetki tanimlama
- Urun yonetimi + Excel toplu yukleme
- Rol sablonlari olusturma
- Sayim ve toplanmis sayim goruntulemesi
- Rapor olusturma (Excel/PDF disa aktarim)
- Sistem ayarlari

---

## Sistem Mimarisi

```
┌─────────────────┐     ┌─────────────────────┐
│   Admin Paneli   │     │   Flutter Mobil App   │
│   (React/Vite)   │     │   (iOS / Android)     │
│   /admin/*       │     │   Ayri repo            │
│   Zustand Store  │     │   Riverpod + SQLite    │
└────────┬────────┘     └──────────┬────────────┘
         │                         │
         │   REST API — JSON — JWT Bearer Token
         └────────────┬────────────┘
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

### Kimlik Dogrulama Akisi

```
Kullanici → Email + Sifre → POST /api/auth/login
                                   │
                             bcrypt.compare()
                                   │
                             JWT Token (7 gun)
                                   │
                   ┌───────────────┼───────────────┐
                   ▼               ▼               ▼
             localStorage    SharedPreferences   Axios/Dio
             (Web)           (Mobil)             Interceptor
                   │               │
                   ▼               ▼
             GET /api/auth/me → kullanici + yetkilerMap
```

---

## Kurulum

### Gereksinimler
- Node.js 18+
- MySQL 8 veya MariaDB 10+
- PM2 (opsiyonel, onerilen)

### Backend

```bash
cd backend
npm install
cp .env.example .env    # Ortam degiskenlerini duzenle
mysql -u root -p < db/schema_mariadb.sql   # Veritabani olustur
node seed.js            # Ilk admin kullanicisi olustur

# Gelistirme
node index.js

# Uretim (PM2 ile)
pm2 start index.js --name stoksay-backend
pm2 save
pm2 startup
```

### Frontend (Admin Paneli)

```bash
cd frontend
npm install
npm run dev            # Port 5173'te gelistirme sunucusu
npm run build          # Uretim derlemesi → dist/
```

---

## Ortam Degiskenleri

Backend `.env` dosyasi:

```env
# Veritabani
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sifre
DB_NAME=stoksay
DB_PORT=3306

# Sunucu
PORT=3001
NODE_ENV=development

# Guvenlik
JWT_SECRET=gizli-anahtar-buraya
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5180

# Supabase (opsiyonel)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
```

---

## Veritabani Semasi

8 tablo bulunur. Tum tablolarda `created_at` ve `updated_at` otomatik trigger ile guncellenir.

### Tablolar

| Tablo | Aciklama | Onemli Alanlar |
|-------|----------|----------------|
| **kullanicilar** | Kullanicilar | email (UNIQUE), sifre (bcrypt), rol (admin/kullanici), aktif, ayarlar (JSON) |
| **isletmeler** | Isletmeler | ad, kod (UNIQUE), adres, telefon, aktif |
| **depolar** | Depolar | isletme_id (FK), ad, kod, konum, aktif |
| **isletme_urunler** | Urunler | isletme_id (FK), urun_kodu, urun_adi, isim_2, birim, kategori, barkodlar (TEXT) |
| **sayimlar** | Sayimlar | isletme_id, depo_id, kullanici_id, ad, tarih, durum (devam/tamamlandi/silindi), notlar (JSON) |
| **sayim_kalemleri** | Sayim Kalemleri | sayim_id (FK), urun_id (FK), miktar (DECIMAL), birim, notlar |
| **kullanici_isletme** | Kullanici-Isletme Iliskisi | kullanici_id, isletme_id, yetkiler (JSON), rol_id (FK), aktif |
| **roller** | Rol Sablonlari | ad, yetkiler (JSON), sistem (Boolean) |
| **urun_log** | Urun Degisiklik Gecmisi | urun_id, islem, onceki_deger (JSON), yeni_deger (JSON) |

### Yetki JSON Yapisi (kullanici_isletme.yetkiler)

```json
{
  "urun":        { "goruntule": true, "ekle": false, "duzenle": false, "sil": false },
  "depo":        { "goruntule": true, "ekle": false, "duzenle": false, "sil": false },
  "sayim":       { "goruntule": true, "ekle": true,  "duzenle": true,  "sil": false },
  "toplam_sayim": { "goruntule": false, "ekle": false, "duzenle": false, "sil": false }
}
```

---

## API Endpointleri

**Base URL:** `http://localhost:3001/api`

Tum endpoint'ler (auth/login haric) `Authorization: Bearer <JWT>` header'i gerektirir.

### Kimlik Dogrulama — `/api/auth`

| Method | Yol | Aciklama |
|--------|-----|----------|
| POST | `/login` | Email + sifre ile giris → JWT token |
| GET | `/me` | Oturum bilgisi + yetkilerMap |
| PUT | `/update-email` | E-posta guncelle |
| PUT | `/update-password` | Sifre guncelle |

### Sayimlar — `/api/sayimlar`

| Method | Yol | Aciklama | Yetki |
|--------|-----|----------|-------|
| GET | `/` | Sayim listesi (filtre: isletme_id, depo_id, durum, toplama) | sayim.goruntule |
| GET | `/:id` | Sayim detayi + kalemler | sayim.goruntule |
| POST | `/` | Yeni sayim olustur | sayim.ekle |
| PUT | `/:id` | Sayim guncelle | sayim.duzenle |
| DELETE | `/:id` | Sayimi sil (soft delete) | sayim.sil |
| PUT | `/:id/tamamla` | Sayimi tamamla | — |
| GET | `/:id/kalemler` | Sayim kalemleri listesi | — |
| POST | `/:id/kalem` | Sayima urun ekle | — |
| PUT | `/:id/kalem/:kalemId` | Kalem guncelle (miktar, birim) | — |
| DELETE | `/:id/kalem/:kalemId` | Kalem sil | — |
| POST | `/topla` | Birden fazla sayimi birlestir | — |

> **Not:** Kalem ekleme, guncelleme ve silme islemleri yetki gerektirmez. Sadece sayimin `devam` durumunda olmasi yeterlidir.

### Urunler — `/api/urunler`

| Method | Yol | Aciklama | Yetki |
|--------|-----|----------|-------|
| GET | `/` | Urun listesi (sayfalama, arama) | urun.goruntule |
| GET | `/barkod/:barkod` | Barkod ile urun bul | — |
| GET | `/sablon` | Excel sablonu indir | — |
| POST | `/` | Yeni urun ekle | urun.ekle |
| PUT | `/:id` | Urun guncelle | urun.duzenle |
| DELETE | `/:id` | Urun sil (soft delete) | urun.sil |
| POST | `/:id/barkod` | Urune barkod ekle | urun.duzenle |
| DELETE | `/:id/barkod/:barkod` | Barkod kaldir | urun.duzenle |
| POST | `/yukle` | Excel toplu yukleme | urun.ekle |

### Depolar — `/api/depolar`

| Method | Yol | Aciklama | Yetki |
|--------|-----|----------|-------|
| GET | `/` | Depo listesi | depo.goruntule |
| GET | `/:id` | Depo detayi | depo.goruntule |
| POST | `/` | Yeni depo ekle | depo.ekle |
| PUT | `/:id` | Depo guncelle | depo.duzenle |
| DELETE | `/:id` | Depo sil (soft delete) | depo.sil |

### Isletmeler — `/api/isletmeler` (Yalnizca Admin)

| Method | Yol | Aciklama |
|--------|-----|----------|
| GET | `/` | Tum isletmeler |
| GET | `/:id` | Isletme detayi |
| POST | `/` | Yeni isletme olustur |
| PUT | `/:id` | Isletme guncelle |
| DELETE | `/:id` | Isletme sil (soft delete) |

### Kullanicilar — `/api/kullanicilar` (Yalnizca Admin)

| Method | Yol | Aciklama |
|--------|-----|----------|
| GET | `/` | Tum kullanicilar |
| POST | `/` | Yeni kullanici olustur |
| PUT | `/:id` | Kullanici guncelle |
| DELETE | `/:id` | Kullanici sil/pasife al |
| POST | `/:id/isletme` | Kullaniciya isletme ata |
| DELETE | `/:id/isletme/:isletme_id` | Isletme bagini kaldir |
| PUT | `/:id/isletme/:isletme_id/yetkiler` | Yetki guncelle |

### Roller — `/api/roller` (Yalnizca Admin)

| Method | Yol | Aciklama |
|--------|-----|----------|
| GET | `/` | Tum roller |
| POST | `/` | Yeni rol olustur |
| PUT | `/:id` | Rol guncelle |
| DELETE | `/:id` | Rol sil (sistem rolleri korunur) |

### Profil — `/api/profil`

| Method | Yol | Aciklama |
|--------|-----|----------|
| GET | `/isletmelerim` | Kullanicinin isletmeleri |
| GET | `/stats` | Istatistikler |
| PUT | `/ayarlar` | Kullanici ayarlari guncelle |

### Istatistikler — `/api/stats` (Yalnizca Admin)

| Method | Yol | Aciklama |
|--------|-----|----------|
| GET | `/` | Dashboard ozet sayilari |
| GET | `/sayim-trend` | Son 6 ay sayim trendi |
| GET | `/isletme-sayimlar` | Isletme bazli sayim dagilimi |
| GET | `/son-sayimlar` | Son 5 sayim |

### Sayfalama Formati

```
GET /api/urunler?isletme_id=1&sayfa=1&limit=20&q=arama
```

```json
{
  "data": [...],
  "toplam": 150,
  "sayfa": 1,
  "limit": 20
}
```

---

## Admin Paneli

React + Vite ile gelistirilmis yonetim paneli. Sadece `admin` rolundeki kullanicilar erisebilir.

### Sayfalar

| Yol | Sayfa | Aciklama |
|-----|-------|----------|
| `/login` | LoginPage | Admin giris ekrani |
| `/admin` | Dashboard | Ozet istatistikler, Recharts grafikleri |
| `/admin/isletmeler` | IsletmelerPage | Isletme CRUD |
| `/admin/depolar` | DepolarPage | Depo CRUD |
| `/admin/kullanicilar` | KullanicilarPage | Kullanici yonetimi + rol/yetki atama |
| `/admin/urunler` | UrunlerPage | Urun yonetimi + Excel toplu yukleme |
| `/admin/roller` | RollerPage | Rol sablonlari olusturma/duzenleme |
| `/admin/sayimlar` | SayimlarPage | Tum sayimlari goruntuleme |
| `/admin/toplanmis-sayimlar` | ToplanmisSayimlarPage | Birlestirilmis sayimlar |
| `/admin/raporlar` | RaporlarPage | Rapor olusturma (Excel/PDF) |
| `/admin/ayarlar` | AyarlarPage | Sistem ayarlari |

### State Yonetimi

Zustand + localStorage persist middleware kullanilir.

```javascript
// authStoreAdm.js
{
  kullanici: { id, ad_soyad, email, rol, aktif },
  yukleniyor: boolean,
  oturumKontrol(),  // JWT ile oturum dogrula
  cikisYap()        // Cikis yap + token temizle
}
```

### Frontend Kutuphaneleri

| Kutuphane | Kullanim |
|-----------|----------|
| React 18 | UI framework |
| Vite 5 | Build tool + dev server |
| Zustand 4.4 | State yonetimi (persist middleware) |
| Axios 1.6 | HTTP istemcisi (JWT interceptor) |
| React Router v6 | Yonlendirme (nested routes) |
| Tailwind CSS 3.4 | Utility-first stil sistemi |
| Radix UI | Erisebilir UI bilesenleri (dialog, dropdown, tabs) |
| Recharts 3.8 | Dashboard analitik grafikleri |
| SheetJS (XLSX) | Excel disa aktarim + toplu yukleme |
| jsPDF 4.2 | PDF rapor olusturma |
| lucide-react | Ikonlar |
| react-hot-toast | Bildirimler |

---

## Guvenlik

### Middleware Zinciri

```
Istek → Helmet → CORS → Rate Limiter → JSON Parser → Route
                                                       │
                                         ┌─────────────┤
                                         ▼             ▼
                                    authGuard     Public Route
                                         │         (login)
                                   ┌─────┴─────┐
                                   ▼           ▼
                              adminGuard   yetkiGuard
                              (admin/*)    (kategori, islem)
```

| Katman | Onlem | Detay |
|--------|-------|-------|
| HTTP Headers | Helmet.js | XSS korumasi, clickjacking onleme, HSTS |
| CORS | Whitelist | Izin verilen origin'ler `.env` ile yapilandirilir |
| Rate Limiting | express-rate-limit | Genel: 300 istek/15dk, Giris: 20 deneme/15dk |
| Kimlik Dogrulama | JWT | 7 gun sureli token, Bearer semasi |
| Sifreleme | bcryptjs | 10 round hash'leme |
| Soft Delete | aktif flag | Veriler asla silinmez |
| IDOR Korumasi | Sahiplik kontrolu | Her endpoint'te kullanici-isletme iliskisi dogrulanir |
| Admin Korumasi | Self-protection | Admin kendini silemez/pasif yapamaz |
| Dosya Yukleme | Cift dogrulama | Uzanti + MIME type kontrolu, 10MB limit |

---

## Yetki Sistemi

### Roller

| Rol | Kapsam |
|-----|--------|
| `admin` | Tum islemlere tam erisim. Tum middleware kontrollerini otomatik gecer. |
| `kullanici` | `kullanici_isletme.yetkiler` JSON alanina gore kisitli erisim. |

### Yetki Kategorileri

| Kategori | Islemler | Aciklama |
|----------|----------|----------|
| `urun` | goruntule, ekle, duzenle, sil | Urun katalogu islemleri |
| `depo` | goruntule, ekle, duzenle, sil | Depo yonetimi |
| `sayim` | goruntule, ekle, duzenle, sil | Sayim islemleri |
| `toplam_sayim` | goruntule, ekle, duzenle, sil | Birlestirilmis sayimlar |

### Yetki Kontrolu

```
Backend:   yetkiGuard('urun', 'ekle')
           → kullanici_isletme tablosundan yetkiler JSON kontrolu
           → Yetkisizse 403 Forbidden

Web:       ProtectedRoute bileseninde rol kontrolu
           → admin degilse /login'e yonlendirilir

Mobil:     authProvider.hasYetki('sayim', 'ekle')
           → Ekran/buton erisim kontrolu
```

---

## Dizin Yapisi

```
stoksay/
├── backend/
│   ├── index.js                    # Express sunucu giris noktasi
│   ├── package.json
│   ├── seed.js                     # Ilk admin kullanicisi olustur
│   ├── .env                        # Ortam degiskenleri (gizli)
│   ├── .env.example                # Ortam degiskenleri sablonu
│   ├── middleware/
│   │   ├── authGuard.js            # JWT token dogrulama
│   │   ├── adminGuard.js           # Admin rol kontrolu
│   │   └── yetkiGuard.js           # Granuler yetki kontrolu
│   ├── routes/
│   │   ├── auth.js                 # Giris / cikis / oturum
│   │   ├── sayimlar.js             # Sayim CRUD + kalemler + toplama
│   │   ├── urunler.js              # Urun CRUD + barkod arama + Excel
│   │   ├── depolar.js              # Depo CRUD
│   │   ├── isletmeler.js           # Isletme CRUD (admin)
│   │   ├── kullanicilar.js         # Kullanici yonetimi (admin)
│   │   ├── roller.js               # Rol sablonlari (admin)
│   │   ├── profil.js               # Profil + ayarlar + istatistik
│   │   └── stats.js                # Dashboard istatistikleri
│   └── db/
│       ├── schema_mariadb.sql      # MySQL/MariaDB semasi
│       ├── demo_data.sql           # Test verileri
│       └── seed_realistic.js       # Gercekci veri uretici
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js              # Vite yapilandirmasi + API proxy
│   └── src/
│       ├── main.jsx                # React giris noktasi
│       ├── App.jsx                 # Route yapilandirmasi
│       ├── store/
│       │   └── authStoreAdm.js     # Admin auth state (Zustand + persist)
│       ├── lib/
│       │   └── apiAdm.js           # Admin Axios istemcisi (JWT interceptor)
│       ├── pages/
│       │   ├── auth/
│       │   │   └── LoginPage.jsx
│       │   └── admin/
│       │       ├── AdminLayout.jsx
│       │       ├── Dashboard.jsx
│       │       ├── IsletmelerPage.jsx
│       │       ├── DepolarPage.jsx
│       │       ├── UrunlerPage.jsx
│       │       ├── KullanicilarPage.jsx
│       │       ├── RollerPage.jsx
│       │       ├── SayimlarPage.jsx
│       │       ├── ToplanmisSayimlarPage.jsx
│       │       ├── RaporlarPage.jsx
│       │       └── AyarlarPage.jsx
│       └── components/
│           └── ui/
│               └── ProtectedRoute.jsx
│
└── README.md
```

---

## Surum Gecmisi

### v3 — 2026-03-15

- Web app kismi kaldirildi, sadece admin paneli kaldi
- Kalem ekleme/duzenleme/silme islemlerinden yetki kontrolu kaldirildi
- Kalem guncelleme dynamic SQL ile duzeltildi (undefined parametre hatasi)
- Admin auth store network hatalarinda token silme duzeltildi
- CORS origin guncellendi
- Toplanmis sayimlar sayfasi eklendi
- Roller ve kullanicilar sayfasi iyilestirmeleri
- PM2 ile proses yonetimi

### v2 — 2026-03-14

- Flutter mobil uygulama entegrasyonu
- Offline-first mimari (SQLite + senkronizasyon kuyrugu)
- Barkod tarayici (kamera ile)
- Overlay tabanli bildirim sistemi
- Hesap makinesi entegrasyonu
- PDF ve CSV disa aktarim

### v1 — 2026-03-12

- Ilk kararli surum
- Cok isletme, cok kullanici mimarisi
- Granuler rol ve yetki sistemi
- Depo, urun, sayim yonetimi
- Excel toplu yukleme
- Admin paneli + kullanici web uygulamasi

---

## Lisans

Bu proje ozel kullanim icindir.

---

## Ilgili Repolar

- **Mobil Uygulama (Flutter):** [stoksay-mobile](https://github.com/Hasanheybat/stoksay-mobile)
