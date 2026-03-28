#!/usr/bin/env python3
"""
StokSay — Site Üzerinden UI Testi (Playwright)
Kullanım: python3 tests/ui-site-test.py [BASE_URL]
"""
import sys, json, time, os
from datetime import datetime
from playwright.sync_api import sync_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8888"
ADMIN_EMAIL = "admin@stoksay.com"
ADMIN_PASS = "TestAdmin1234!"

passed = 0
failed = 0
errors = []
screenshots = []

def ok(cond, name, detail=""):
    global passed, failed
    if cond:
        passed += 1; print(f"  ✅ {name}")
    else:
        failed += 1; errors.append({"name": name, "error": detail}); print(f"  ❌ {name}")
        if detail: print(f"     → {detail}")

def shot(page, name):
    p = f"/tmp/stoksay-ui-{name}.png"; page.screenshot(path=p); screenshots.append(p); return p

def run_tests():
    print(f"\n{'='*62}")
    print(f"  StokSay Site UI Testi — {BASE_URL}")
    print(f"  {datetime.now().isoformat()}")
    print(f"{'='*62}\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        t0 = time.time()

        # ── 1. LOGIN ──
        print("  ── LOGIN ──")
        page.goto(f"{BASE_URL}/login", timeout=15000)
        page.wait_for_timeout(2000)

        try:
            page.fill("input[type='email']", ADMIN_EMAIL)
            page.fill("input[type='password']", ADMIN_PASS)
            ok(True, "1.1 Login formu dolduruldu")
        except Exception as e:
            ok(False, "1.1 Login formu dolduruldu", str(e))

        try:
            page.click("button[type='submit']")
            page.wait_for_timeout(3000)
            url = page.url
            logged_in = "/admin" in url or "/dashboard" in url
            ok(logged_in, "1.2 Admin login başarılı", f"URL: {url}")
            shot(page, "01-after-login")
        except Exception as e:
            ok(False, "1.2 Admin login başarılı", str(e))

        # ── 2. DASHBOARD ──
        print("\n  ── DASHBOARD ──")
        try:
            content = page.content()
            has_stats = any(w in content for w in ["İşletme", "Depo", "Kullanıcı", "Sayım"])
            ok(has_stats, "2.1 Dashboard verileri görünüyor")
        except Exception as e:
            ok(False, "2.1 Dashboard verileri görünüyor", str(e))

        # ── 3. SAYFA GEZİNTİSİ (button navigasyon) ──
        print("\n  ── SAYFA GEZİNTİSİ ──")
        pages = [
            ("İşletmeler", "/admin/isletmeler"),
            ("Depolar", "/admin/depolar"),
            ("Kullanıcılar", "/admin/kullanicilar"),
            ("Ürünler", "/admin/urunler"),
            ("Roller", "/admin/roller"),
            ("Sayımlar", "/admin/sayimlar"),
        ]
        for label, path in pages:
            try:
                page.goto(f"{BASE_URL}{path}", timeout=10000)
                page.wait_for_timeout(1500)
                content = page.content()
                has_content = len(content) > 1000  # Sayfa yüklendi
                ok(has_content, f"3. {label} sayfası yüklendi")
                shot(page, f"03-{label.lower()}")
            except Exception as e:
                ok(False, f"3. {label} sayfası yüklendi", str(e))

        # ── 4. API DOĞRULAMA (site içinden fetch) ──
        print("\n  ── API DOĞRULAMA (site içinden) ──")
        try:
            result = page.evaluate("""async () => {
                const token = localStorage.getItem('stoksay-adm-token');
                if (!token) return {error: 'Token yok'};
                const h = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'};
                const R = {};

                let r = await fetch('/api/stats', {headers: h});
                let d = await r.json();
                R.stats = {s: r.status, isletme: d.isletme, depo: d.depo, kullanici: d.kullanici, urun: d.urun};

                r = await fetch('/api/isletmeler?sayfa=1&limit=5', {headers: h});
                d = await r.json();
                R.isletmeler = {s: r.status, n: d.data?.length || 0};

                r = await fetch('/api/kullanicilar?sayfa=1&limit=5', {headers: h});
                d = await r.json();
                R.kullanicilar = {s: r.status, n: d.data?.length || 0};

                r = await fetch('/api/roller', {headers: h});
                d = await r.json();
                R.roller = {s: r.status, n: Array.isArray(d) ? d.length : 0};

                r = await fetch('/api/stats/son-sayimlar', {headers: h});
                d = await r.json();
                R.sonSayimlar = {s: r.status, n: Array.isArray(d) ? d.length : 0};

                r = await fetch('/api/stats/sayim-trend', {headers: h});
                R.trend = {s: r.status};

                r = await fetch('/api/stats/isletme-sayimlar', {headers: h});
                R.isletmeSayimlar = {s: r.status};

                return R;
            }""")

            if isinstance(result, dict) and 'error' not in result:
                s = result.get('stats', {})
                ok(s.get('s') == 200, f"4.1 Stats → İşletme:{s.get('isletme')} Depo:{s.get('depo')} Kullanıcı:{s.get('kullanici')} Ürün:{s.get('urun')}")
                ok(result.get('isletmeler', {}).get('s') == 200, f"4.2 İşletmeler → {result.get('isletmeler', {}).get('n')} kayıt")
                ok(result.get('kullanicilar', {}).get('s') == 200, f"4.3 Kullanıcılar → {result.get('kullanicilar', {}).get('n')} kayıt")
                ok(result.get('roller', {}).get('s') == 200, f"4.4 Roller → {result.get('roller', {}).get('n')} kayıt")
                ok(result.get('sonSayimlar', {}).get('s') == 200, "4.5 Son sayımlar")
                ok(result.get('trend', {}).get('s') == 200, "4.6 Sayım trend")
                ok(result.get('isletmeSayimlar', {}).get('s') == 200, "4.7 İşletme sayımları")
            else:
                ok(False, "4.x API doğrulama", str(result))
        except Exception as e:
            ok(False, "4.x API doğrulama", str(e))

        # ── 5. CRUD (site içinden API) ──
        print("\n  ── CRUD İŞLEMLERİ ──")
        try:
            crud = page.evaluate("""async () => {
                const token = localStorage.getItem('stoksay-adm-token');
                const h = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'};
                const R = {};
                const ts = Date.now();

                // İşletme oluştur
                let r = await fetch('/api/isletmeler', {method:'POST', headers:h,
                    body: JSON.stringify({ad:'UI CRUD Test '+ts, kod:'UICRUD'+ts})});
                let d = await r.json();
                R.isletme_c = r.status; const iId = d.id;

                // Depo oluştur
                r = await fetch('/api/depolar', {method:'POST', headers:h,
                    body: JSON.stringify({isletme_id:iId, ad:'UI Test Depo', kod:'UID1'})});
                d = await r.json();
                R.depo_c = r.status; const dId = d.id;

                // Ürün oluştur
                r = await fetch('/api/urunler', {method:'POST', headers:h,
                    body: JSON.stringify({isletme_id:iId, urun_adi:'UI Test Ürün', urun_kodu:'UIU'+ts, barkodlar:['UIBRK'+ts]})});
                d = await r.json();
                R.urun_c = r.status; const uId = d.id;

                // Ürün güncelle
                r = await fetch('/api/urunler/'+uId, {method:'PUT', headers:h,
                    body: JSON.stringify({urun_adi:'UI Güncellendi', birim:'KG'})});
                d = await r.json();
                R.urun_u = d.urun_adi === 'UI Güncellendi';

                // Barkod ekle
                r = await fetch('/api/urunler/'+uId+'/barkod', {method:'POST', headers:h,
                    body: JSON.stringify({barkod: 'UIEXTRA'+ts})});
                R.barkod_add = r.status;

                // Barkod ara
                r = await fetch('/api/urunler/barkod/UIEXTRA'+ts+'?isletme_id='+iId, {headers:h});
                R.barkod_search = r.status;

                // Sayım oluştur
                r = await fetch('/api/sayimlar', {method:'POST', headers:h,
                    body: JSON.stringify({isletme_id:iId, depo_id:dId, ad:'UI Test Sayım'})});
                d = await r.json();
                R.sayim_c = r.status; const sId = d.id;

                // Kalem ekle
                r = await fetch('/api/sayimlar/'+sId+'/kalem', {method:'POST', headers:h,
                    body: JSON.stringify({urun_id:uId, miktar:12.5, birim:'KG'})});
                d = await r.json();
                R.kalem_c = r.status; const kId = d.id;

                // Kalem güncelle
                r = await fetch('/api/sayimlar/'+sId+'/kalem/'+kId, {method:'PUT', headers:h,
                    body: JSON.stringify({miktar:25, notlar:'UI test'})});
                R.kalem_u = r.status;

                // Sayım detay
                r = await fetch('/api/sayimlar/'+sId, {headers:h});
                d = await r.json();
                R.sayim_detail = d.sayim_kalemleri?.length;

                // Kalem sil
                r = await fetch('/api/sayimlar/'+sId+'/kalem/'+kId, {method:'DELETE', headers:h});
                R.kalem_d = r.status;

                // Sayım tamamla
                r = await fetch('/api/sayimlar/'+sId+'/tamamla', {method:'PUT', headers:h, body:'{}'});
                d = await r.json();
                R.tamamla = d.durum;

                // Tamamlana kalem eklenemez
                r = await fetch('/api/sayimlar/'+sId+'/kalem', {method:'POST', headers:h,
                    body: JSON.stringify({urun_id:uId, miktar:1})});
                R.blocked = r.status;

                // 2. sayım oluştur + topla
                r = await fetch('/api/sayimlar', {method:'POST', headers:h,
                    body: JSON.stringify({isletme_id:iId, depo_id:dId, ad:'UI Sayım 2'})});
                d = await r.json(); const s2Id = d.id;

                r = await fetch('/api/sayimlar/'+s2Id+'/kalem', {method:'POST', headers:h,
                    body: JSON.stringify({urun_id:uId, miktar:5, birim:'KG'})});

                r = await fetch('/api/sayimlar/'+s2Id+'/tamamla', {method:'PUT', headers:h, body:'{}'});

                r = await fetch('/api/sayimlar/topla', {method:'POST', headers:h,
                    body: JSON.stringify({sayim_ids:[sId, s2Id], ad:'UI Topla Test', isletme_id:iId})});
                d = await r.json();
                R.topla = r.status;
                const tId = d.id;

                // Cleanup
                if(tId) await fetch('/api/sayimlar/'+tId, {method:'DELETE', headers:h});
                await fetch('/api/sayimlar/'+sId, {method:'DELETE', headers:h});
                await fetch('/api/sayimlar/'+s2Id, {method:'DELETE', headers:h});
                await fetch('/api/urunler/'+uId, {method:'DELETE', headers:h});
                await fetch('/api/depolar/'+dId, {method:'DELETE', headers:h});
                await fetch('/api/isletmeler/'+iId, {method:'DELETE', headers:h});
                R.cleanup = 'ok';

                return R;
            }""")

            if isinstance(crud, dict):
                ok(crud.get('isletme_c') == 201, "5.01 İşletme oluştur → 201")
                ok(crud.get('depo_c') == 201, "5.02 Depo oluştur → 201")
                ok(crud.get('urun_c') == 201, "5.03 Ürün oluştur → 201")
                ok(crud.get('urun_u') == True, "5.04 Ürün güncelle")
                ok(crud.get('barkod_add') == 200, "5.05 Barkod ekle → 200")
                ok(crud.get('barkod_search') == 200, "5.06 Barkod ara → 200")
                ok(crud.get('sayim_c') == 201, "5.07 Sayım oluştur → 201")
                ok(crud.get('kalem_c') == 201, "5.08 Kalem ekle → 201")
                ok(crud.get('kalem_u') == 200, "5.09 Kalem güncelle → 200")
                ok(crud.get('sayim_detail') == 1, "5.10 Sayım detay — 1 kalem")
                ok(crud.get('kalem_d') == 200, "5.11 Kalem sil → 200")
                ok(crud.get('tamamla') == 'tamamlandi', "5.12 Sayım tamamla")
                ok(crud.get('blocked') == 400, "5.13 Tamamlana kalem eklenemez → 400")
                ok(crud.get('topla') in (200, 201), "5.14 Sayım birleştir (topla)")
                ok(crud.get('cleanup') == 'ok', "5.15 Cleanup başarılı")
            else:
                ok(False, "5.x CRUD", str(crud))
        except Exception as e:
            ok(False, "5.x CRUD", str(e))

        shot(page, "99-final")
        total_ms = int((time.time() - t0) * 1000)
        browser.close()

    # Rapor
    print(f"\n{'='*62}")
    print(f"  Sonuç: {passed} başarılı, {failed} başarısız, toplam {passed+failed}")
    print(f"  Süre: {total_ms}ms")
    print(f"{'='*62}")
    if errors:
        print("\n  Başarısız:")
        for e in errors: print(f"    - {e['name']}: {e['error']}")

    rp = os.path.join(os.path.dirname(__file__), f"ui-report-{int(time.time())}.json")
    with open(rp, "w") as f:
        json.dump({"backend": BASE_URL, "summary": {"passed": passed, "failed": failed, "total": passed+failed, "ms": total_ms}, "errors": errors}, f, indent=2, ensure_ascii=False)
    print(f"\n  Rapor: {rp}\n")
    sys.exit(1 if failed > 0 else 0)

if __name__ == "__main__":
    run_tests()
