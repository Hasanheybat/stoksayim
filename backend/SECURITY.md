# StokSay Backend - Guvenlik

## Kimlik Dogrulama
- JWT token tabanli kimlik dogrulama
- Parolalar bcrypt ile hashlenir
- Token suresi sinirlidir, yenileme mekanizmasi mevcuttur
- Tum korunakli endpoint'ler auth middleware'i gerektirir

## API Guvenligi

### Veri Dogrulama
- Istek parametreleri ve body kontrol edilir
- SQL injection'a karsi parametreli sorgular kullanilir
- Isletme bazli veri izolasyonu saglanir

### Aktif Sayim Korumasi
- Depo silme: Aktif sayimda kullanilan depo silinemez (HTTP 409)
- Urun silme: Aktif sayim kaleminde bulunan urun silinemez (HTTP 409)
- 409 yanitinda sayim adlari dondurulur (kullanici bilgilendirmesi icin)

### Hata Yonetimi
- Hassas hata detaylari istemciye gonderilmez
- Veritabani hatalari loglanir, genel mesaj dondurulur

## Veritabani Guvenligi
- MySQL baglanti havuzu ile verimli baglanti yonetimi
- Parametreli sorgular (prepared statements) ile SQL injection onlenir
- Soft delete deseni: Veriler fiziksel olarak silinmez, `aktif = 0` veya `durum = 'silindi'` ile isaretlenir

## Offline Sync Guvenligi
- Mobil uygulamadan gelen sync istekleri JWT ile dogrulanir
- Temp ID → gercek ID donusumu sunucu tarafinda yapilir
- Cakisan islemler (ornegin silinmis kayit guncelleme) sunucu tarafinda kontrol edilir

## Bilinen Sinirlamalar
- Rate limiting henuz uygulanmamistir
- API versiyonlama henuz mevcut degildir
- CORS ayarlari gelistirme ortaminda aciktir
