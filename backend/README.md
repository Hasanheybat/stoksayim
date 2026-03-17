# StokSay Backend v4.0

Depo sayim yonetim sisteminin Express.js REST API backend'i. MySQL veritabani ile calisan, JWT tabanli kimlik dogrulamali API sunucusu.

## Ozellikler

- **REST API**: Tam CRUD islemleri (depo, urun, sayim, kalem)
- **JWT Kimlik Dogrulama**: Token tabanli guvenli erisim
- **Coklu Isletme**: Isletme bazli veri izolasyonu
- **Aktif Sayim Korumasi**: Kullanilan depo/urun silme engeli (409 yaniti)
- **Sayim Birlestirme**: Birden fazla sayimi tek sayimda toplama
- **Rol Yonetimi**: Kullanici rolleri ve yetkilendirme

## Teknik Yapi

### Teknolojiler
- **Node.js** + **Express.js**
- **MySQL** - Veritabani
- **JWT** - Kimlik dogrulama
- **bcrypt** - Parola hashleme

### Klasor Yapisi

```
backend/
├── index.js              # Express sunucu baslangici
├── package.json          # Bagimliliklar
├── db/
│   └── connection.js     # MySQL baglanti havuzu
├── lib/
│   └── ...               # Yardimci moduller
├── middleware/
│   └── ...               # Auth middleware
├── routes/
│   ├── auth.js           # Login/register/token yenileme
│   ├── depolar.js        # Depo CRUD + aktif sayim kontrolu
│   ├── isletmeler.js     # Isletme CRUD
│   ├── kullanicilar.js   # Kullanici yonetimi
│   ├── profil.js         # Profil ve istatistikler
│   ├── roller.js         # Rol yonetimi
│   ├── sayimlar.js       # Sayim CRUD + kalemler + topla
│   ├── stats.js          # Dashboard istatistikleri
│   └── urunler.js        # Urun CRUD + aktif sayim kontrolu
├── public/               # Statik dosyalar
├── seed.js               # Veritabani seed (gelistirme)
└── seed_mini.js          # Kucuk seed verisi
```

## API Endpoint'leri

### Kimlik Dogrulama
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| POST | /api/auth/login | Giris yap |
| POST | /api/auth/register | Kayit ol |

### Depolar
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/depolar | Depo listesi |
| POST | /api/depolar | Depo ekle |
| PUT | /api/depolar/:id | Depo guncelle |
| DELETE | /api/depolar/:id | Depo sil (aktif sayim kontrolu) |

### Urunler
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/urunler | Urun listesi (arama/filtreleme) |
| POST | /api/urunler | Urun ekle |
| PUT | /api/urunler/:id | Urun guncelle |
| DELETE | /api/urunler/:id | Urun sil (aktif sayim kontrolu) |

### Sayimlar
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/sayimlar | Sayim listesi (filtreli) |
| GET | /api/sayimlar/:id | Sayim detay |
| POST | /api/sayimlar | Sayim olustur |
| PUT | /api/sayimlar/:id | Sayim guncelle |
| DELETE | /api/sayimlar/:id | Sayim sil |
| PUT | /api/sayimlar/:id/tamamla | Sayim tamamla |
| GET | /api/sayimlar/:id/kalemler | Kalem listesi |
| POST | /api/sayimlar/:id/kalemler | Kalem ekle |
| PUT | /api/sayimlar/kalemler/:id | Kalem guncelle |
| DELETE | /api/sayimlar/kalemler/:id | Kalem sil |
| POST | /api/sayimlar/topla | Sayimlari birlesir |

### Diger
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/profil | Kullanici profili |
| GET | /api/stats | Dashboard istatistikleri |
| GET | /api/isletmeler | Isletme listesi |
| GET | /api/roller | Rol listesi |

## Aktif Sayim Korumasi

Depo veya urun silinmeye calisildiginda, aktif (`durum = 'devam'`) sayimda kullaniliyorsa:

```json
HTTP 409 Conflict
{
  "hata": "Bu depo aktif sayimlarda kullaniliyor.",
  "sayimlar": ["Sayim 1", "Sayim 2"]
}
```

Mobil uygulama bu bilgiyi kullaniciya dialog ile gosterir.

## Kurulum

```bash
# Bagimliliklari yukle
npm install

# Sunucuyu baslat
node index.js

# Seed verisi yukle (opsiyonel)
node seed.js
```

## Ortam Degiskenleri

Veritabani ve JWT ayarlari `db/connection.js` ve ilgili dosyalarda yapilandirilir.

## Versiyon Gecmisi

| Versiyon | Aciklama |
|----------|----------|
| v4.0 | Aktif sayim korumasi (409 + sayim adlari), offline sync destegi |
| v3.3 | Sayim birlestirme (topla), toplu islemler |
| v3.0 | Coklu isletme, rol yonetimi |
