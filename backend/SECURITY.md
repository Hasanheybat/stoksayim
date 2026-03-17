# StokSay Backend - Guvenlik

## Kimlik Dogrulama
- JWT token tabanli kimlik dogrulama
- Parolalar bcrypt ile hashlenir (minimum 8 karakter)
- Token suresi 24 saat, yenileme mekanizmasi mevcuttur
- Tum korunakli endpoint'ler auth middleware'i gerektirir
- Email format dogrulamasi (login, kayit, guncelleme)

## API Guvenligi

### Veri Dogrulama
- Istek parametreleri ve body kontrol edilir
- SQL injection'a karsi parametreli sorgular kullanilir
- Isletme bazli veri izolasyonu saglanir
- Email format dogrulamasi (regex)
- Telefon numarasi format dogrulamasi (7-20 karakter, rakam/+/-/bosluk/parantez)
- Barkod format dogrulamasi (alfanumerik + tire, 1-50 karakter)
- Dosya yukleme hatalari kullaniciya genel mesajla dondurulur

### Rate Limiting
- Auth endpoint'leri icin rate limiting: 15 istek/15 dakika
- Genel API endpoint'leri icin rate limiting: 100 istek/dakika

### Aktif Sayim Korumasi
- Depo silme: Aktif sayimda kullanilan depo silinemez (HTTP 409, transaction + FOR UPDATE)
- Urun silme: Aktif sayim kaleminde bulunan urun silinemez (HTTP 409, transaction + FOR UPDATE)
- 409 yanitinda sayim adlari dondurulur (kullanici bilgilendirmesi icin)

### Cross-Isletme Korumasi
- Sayim kalemine urun eklerken urunun sayimin isletmesine ait oldugu dogrulanir
- Farkli isletmeye ait urun eklenemez (HTTP 400)

### Sayim Butunlugu
- Sadece tamamlanmis sayimlar birlestirilebilir (topla)
- Topla islemi sirasinda kalemler FOR UPDATE ile kilitlenir
- Sayim guncellemelerinde optimistic locking (updated_at kontrolu, HTTP 409)

### Hata Yonetimi
- Hassas hata detaylari istemciye gonderilmez
- Veritabani hatalari loglanir, genel mesaj dondurulur
- Multer dosya yukleme hatalari genel mesajla dondurulur

## Veritabani Guvenligi
- MySQL baglanti havuzu ile verimli baglanti yonetimi
- Parametreli sorgular (prepared statements) ile SQL injection onlenir
- Soft delete deseni: Veriler fiziksel olarak silinmez
- Race condition korumalari: Transaction + FOR UPDATE ile atomik islemler
- SSL baglanti destegi (DB_SSL=true ortam degiskeni ile)

## Offline Sync Guvenligi
- Mobil uygulamadan gelen sync istekleri JWT ile dogrulanir
- Temp ID → gercek ID donusumu sunucu tarafinda yapilir
- Cakisan islemler sunucu tarafinda kontrol edilir

## Bilinen Sinirlamalar
- API versiyonlama henuz mevcut degildir
- CORS ayarlari gelistirme ortaminda aciktir
- Certificate pinning henuz uygulanmamistir
