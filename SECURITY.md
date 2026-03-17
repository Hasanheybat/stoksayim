# StokSay Guvenlik Raporu

**Son Tarama:** 2026-03-17 (v4.1.2)
**Kapsam:** Backend API + Admin Paneli (Web)

---

## Mevcut Guvenlik Onlemleri (Aktif)

| Onlem | Durum | Detay |
|-------|-------|-------|
| SQL Injection korumasi | OK | Tum sorgular parametreli prepared statement |
| JWT dogrulama | OK | Token imza, sure, manipulasyon kontrolleri |
| "none" algorithm saldirisi | OK | Reddediliyor |
| IDOR korumasi | OK | Tum endpoint'lerde sahiplik + yetki kontrolu |
| Hata mesaji sizintisi | OK | err.message kullaniciya gosterilmiyor, loglaniyor |
| Rate limiting | OK | Auth: 15 istek/15dk, Genel API: 100 istek/dk |
| CORS | OK | Whitelist tabanli, bilinmeyen origin 403 ile reddediliyor |
| Helmet.js | OK | X-Content-Type-Options, HSTS, X-Frame-Options, Referrer-Policy |
| X-Powered-By | OK | Kaldirildi (Helmet) |
| password_hash gizliligi | OK | Hicbir API response'da donmuyor |
| Path traversal | OK | `../../etc/passwd` gibi denemeler 404 donuyor |
| Admin self-protection | OK | Admin kendini silemez/pasif yapamaz |
| JWT startup kontrolu | OK | JWT_SECRET 32 karakterden kisaysa sunucu baslamiyor |
| Soft delete | OK | Veriler gercekten silinmiyor, `aktif=0` yapiliyor |
| bcrypt | OK | 10 round salt ile sifre hash'leme |
| Race condition korumasi | OK | Depo/urun silme: Transaction + FOR UPDATE |
| Cross-isletme korumasi | OK | Sayim kalemine farkli isletme urunu eklenemez |
| Sayim topla guvenligi | OK | Sadece tamamlanmis sayimlar birlestirilir |
| Optimistic locking | OK | Sayim update'de updated_at kontrolu (409, timezone normalizasyonu) |
| Pasif kullanici engeli | OK | authGuard 403: pasif kullanici hicbir API'ye erisemez |
| Yetki atama UPSERT | OK | kullanici_isletme kaydi yoksa INSERT, varsa UPDATE |
| Rol kaldirma yetki sifirlama | OK | Rol silinince tum yetkiler false olur |
| Pasif kullanici admin UI | OK | Kirmizi kart, duzenleme butonu yok, salt okunur popup |
| Email dogrulama | OK | Login, kayit, guncelleme'de regex kontrolu |
| Telefon dogrulama | OK | 7-20 karakter format kontrolu |
| Barkod dogrulama | OK | Alfanumerik + tire, 1-50 karakter |
| Sifre politikasi | OK | Minimum 8 karakter |
| DB SSL destegi | OK | DB_SSL=true ile etkinlesir |

---

## Bilinen Aciklar

### KRITIK

#### K1 — JWT Token localStorage'da Tutuluyor

- **Dosya:** `frontend/src/store/authStoreAdm.js` satir 15, `frontend/src/lib/apiAdm.js` satir 7
- **Risk:** XSS saldirisi ile token calinabilir. `localStorage.getItem('stoksay-adm-token')` herhangi bir JS kodu ile okunabilir.
- **Etki:** Admin token ele gecirilirse tum sisteme erisim saglanir.
- **Cozum:** httpOnly cookie ile token yonetimi. Backend `Set-Cookie` ile token gonderir, frontend `withCredentials: true` kullanir.
- **Deploy'da duzeltilecek:** HAYIR — Mimari degisiklik gerektirir. Ayri sprint'te planlanmali.

---

### YUKSEK

#### Y1 — xlsx (SheetJS) Paketi — Prototype Pollution + ReDoS

- **Dosya:** `frontend/package.json` satir 38
- **Risk:** Kullanici yukledigi Excel dosyasi uzerinden prototype pollution saldirisi. `UrunlerPage.jsx`'te Excel upload islemi bu paketten geciyor.
- **Etki:** Zararli Excel dosyasi ile client-side kod calistirma.
- **Cozum:** `xlsx` yerine `exceljs` paketine gecis veya SheetJS Pro kullanimi.
- **Deploy'da duzeltilecek:** HAYIR — Paket degisikligi ve test gerektirir.

#### Y2 — Client-Side Rol Kontrolu Bypass Edilebilir

- **Dosya:** `frontend/src/components/ui/ProtectedRoute.jsx` satir 14-15, `frontend/src/store/authStoreAdm.js` satir 40-43
- **Risk:** localStorage'daki `stoksay-adm-auth` verisinde `rol: 'admin'` yapilarak ProtectedRoute gecilir. Zustand persist middleware auth state'i localStorage'da tutuyor.
- **Gercek etki:** DUSUK — Backend tum admin endpoint'lerde `adminGuard` ile rol kontrolu yapiyor. Client-side bypass sadece bos sayfa goruntulemeye yarar, veri okunamaz/yazilamaz.
- **Cozum:** Auth state persist etmemek veya her sayfa yuklemesinde `/auth/me` ile dogrulamak.
- **Deploy'da duzeltilecek:** HAYIR — Backend zaten koruyor. Iyilestirme olarak planlanabilir.

#### Y3 — CSRF Korumasi Yok

- **Risk:** Klasik CSRF saldirisi. Ancak token localStorage'da (cookie degil) oldugu icin standart CSRF calismaz.
- **Gercek etki:** DUSUK — localStorage token cookie gibi otomatik gonderilmez.
- **Cozum:** Cookie tabanli auth'a gecildiginde SameSite=Strict + CSRF token eklenmeli.
- **Deploy'da duzeltilecek:** HAYIR — Simdilik risk yok, cookie gecisinde uygulanacak.

---

### ORTA

#### O1 — Backend Hata Mesajlari Raw Gosteriliyor (Frontend)

- **Dosyalar:** `LoginPage.jsx`, `IsletmelerPage.jsx`, `AyarlarPage.jsx`, `KullanicilarPage.jsx`, `UrunlerPage.jsx`, `RollerPage.jsx`
- **Risk:** `toast.error(err.response?.data?.hata || ...)` ile backend hata mesajlari dogrudan gosteriliyor.
- **Gercek etki:** DUSUK — Backend zaten `'Sunucu hatasi.'` gibi genel mesajlar donduruyor, stack trace sizmiyor.
- **Deploy'da duzeltilecek:** HAYIR — Backend zaten temizlenmis durumda.

#### O2 — dangerouslySetInnerHTML Kullanimi

- **Dosya:** `frontend/src/components/ui/chart.tsx` satir 83
- **Risk:** Statik THEMES objesinden CSS enjekte ediliyor. Su an guvenli ama kaynak degisirse risk olusur.
- **Deploy'da duzeltilecek:** HAYIR — Dusuk oncelik, statik veri.

#### O3 — esbuild/vite Dev Server Acigi

- **Dosya:** `frontend/package.json` (vite, esbuild)
- **Risk:** Dev sunucusu uzerinden herhangi bir site istek gonderip yanit okuyabilir.
- **Gercek etki:** YOK — Sadece development ortamini etkiler, production build'i etkilemez.
- **Cozum:** `vite` paketini v6.2+ veya v8.x'e guncellemek.
- **Deploy'da duzeltilecek:** EVET — `npm update vite` ile guncellenecek.

#### O4 — Form Input Dogrulama Eksik

- **Dosyalar:** Tum admin panel form sayfalari
- **Risk:** `maxLength`, `pattern` gibi HTML dogrulama yok. Sifre minimum uzunluk 6 karakter.
- **Gercek etki:** DUSUK — Backend dogrulama yapiyor, client-side sadece UX iyilestirmesi.
- **Deploy'da duzeltilecek:** HAYIR — Iyilestirme olarak planlanabilir.

#### O5 — .env.example Eski Supabase Referanslari

- **Dosya:** `frontend/.env.example`
- **Risk:** Eski Supabase degiskenleri kafa karistirabilir.
- **Deploy'da duzeltilecek:** EVET — Dosya temizlenecek veya silinecek.

#### O6 — Dead Code (Admin POST depolar)

- **Dosya:** `routes/depolar.js:254-276`
- **Risk:** Admin icin tanimlanan ikinci POST `/` handler'i asla calismiyor. Ilk handler her zaman eslesir.
- **Deploy'da duzeltilecek:** EVET — Dead code temizlenecek.

#### O7 — Dashboard Sessiz Hata Yutma

- **Dosya:** `frontend/src/pages/admin/Dashboard.jsx:109`
- **Risk:** `catch {}` — API hatalari sessizce yutuluyor. Kullanici bos dashboard gorur, hata mesaji yok.
- **Deploy'da duzeltilecek:** EVET — Hata mesaji gosterilecek.

#### O8 — Unhandled Promise Rejection (3 sayfa)

- **Dosyalar:** `DepolarPage.jsx:576`, `SayimlarPage.jsx:370`, `UrunlerPage.jsx:327`
- **Risk:** `.then()` sonrasi `.catch()` yok. API hatasi unhandled rejection olusturur.
- **Deploy'da duzeltilecek:** EVET — `.catch()` eklenecek.

#### O9 — Loading Flash (Depo bulunamadi)

- **Dosya:** `frontend/src/pages/admin/DepolarPage.jsx:556`
- **Risk:** `loading` state baslangicta `false`. Veri yuklenmeden "Depo bulunamadi" gosteriliyor.
- **Deploy'da duzeltilecek:** EVET — `useState(true)` yapilacak.

#### O10 — Tum Kayitlari Tek Seferde Cekme (limit=9999)

- **Dosya:** `frontend/src/pages/admin/RaporlarPage.jsx:97`
- **Risk:** `api.get('/sayimlar?limit=9999')` — buyuk veride yavaslama ve bellek sorunu.
- **Deploy'da duzeltilecek:** EVET — Sayfalama veya lazy load eklenecek.

#### O11 — Genel Exception Hata Kaybi (Flutter)

- **Dosya:** `lib/services/api_service.dart`
- **Risk:** API hatalari genel `Exception` firlatiliyor, hata detayi (status code, mesaj) kayboluyor.
- **Deploy'da duzeltilecek:** EVET — Ozel exception sinifi olusturulacak.

#### O12 — Offline Handling Yok (Flutter)

- **Dosyalar:** Tum screen'ler
- **Risk:** Internet baglantisi yoksa kullaniciya bilgi verilmiyor.
- **Deploy'da duzeltilecek:** EVET — Connectivity check + kullanici bildirimi eklenecek.

#### O13 — TextEditingController Dispose Edilmiyor (Flutter)

- **Dosya:** `lib/screens/sayim_detay_screen.dart`
- **Risk:** Controller dispose edilmediginde memory leak olusur.
- **Deploy'da duzeltilecek:** EVET — dispose() eklenmeli.

---

### DUSUK

#### D1 — Login Formunda Client-Side Rate Limit Yok

- **Risk:** Kullanici surekli deneme yapabilir (backend rate limit var ama client UX'i iyilestirmez).
- **Deploy'da duzeltilecek:** HAYIR — Backend zaten koruyor.

#### D2 — 401 Olmayan Hatalarda Token Temizlenmiyor

- **Dosya:** `frontend/src/store/authStoreAdm.js` satir 25-31
- **Risk:** Network hatasi durumunda eski oturum kalabilir.
- **Deploy'da duzeltilecek:** HAYIR — Edge case, dusuk oncelik.

#### D3 — PageHeader 5x Duplicate Kod

- **Dosyalar:** IsletmelerPage, DepolarPage, UrunlerPage, SayimlarPage, ToplanmisSayimlarPage
- **Risk:** Ayni bilesen 5 kez tekrar tanimlanmis. Bakim zorlugu.
- **Deploy'da duzeltilecek:** HAYIR — Kod kalitesi, risk yok.

#### D4 — IsletmeFiltre + Export Fonksiyonlari 3x Duplicate

- **Dosyalar:** DepolarPage, SayimlarPage, ToplanmisSayimlarPage
- **Risk:** Ayni fonksiyonlar 3 kez tekrar tanimlanmis.
- **Deploy'da duzeltilecek:** HAYIR — Kod kalitesi, risk yok.

#### D5 — Kullanilmayan Import (Bell)

- **Dosya:** `AdminLayout.jsx:3`
- **Deploy'da duzeltilecek:** HAYIR — Zarar vermiyor.

---

## Deploy Oncesi Kontrol Listesi

- [ ] `npm update vite` — Dev server acigini kapat (O3)
- [ ] `frontend/.env.example` temizle — Supabase referanslarini kaldir (O5)
- [ ] `JWT_SECRET` uretim ortaminda en az 64 karakter olmali
- [ ] `ALLOWED_ORIGINS` sadece uretim domainlerini icermeli
- [ ] `NODE_ENV=production` ayarlanmali
- [ ] PM2 ile baslatilmali (`pm2 start index.js --name stoksay`)

---

## Test Sonuclari (2026-03-17, v4.1.2)

### Penetrasyon Testi — 37/37 PASS

| Kategori | Test Sayisi | Sonuc |
|----------|-------------|-------|
| Auth bypass + JWT manipulasyon | 4 | 4/4 PASS |
| SQL Injection (login, query, UNION) | 3 | 3/3 PASS |
| IDOR (kaynak erisim, kalem) | 3 | 3/3 PASS |
| Input validation (email, telefon, barkod) | 3 | 3/3 PASS |
| Optimistic locking (concurrent update) | 3 | 3/3 PASS |
| Cross-isletme izolasyonu | 2 | 2/2 PASS |
| Is mantigi (topla, pasif kullanici) | 4 | 4/4 PASS |
| CORS (whitelist, reject, 403) | 3 | 3/3 PASS |
| Guvenlik basiklari (Helmet) | 4 | 4/4 PASS |
| Rate limiting (auth, genel) | 2 | 2/2 PASS |
| Path traversal | 2 | 2/2 PASS |
| Veri sizintisi (password_hash, stack trace) | 2 | 2/2 PASS |
| Depo silme kilidi (aktif sayim) | 2 | 2/2 PASS |
| **TOPLAM** | **37** | **37/37 PASS** |

### Onceki Test Sonuclari (2026-03-15)

52/52 PASS — Auth, SQLi, IDOR, XSS, rate limit, CORS, Helmet, JWT, path traversal, edge case
