/**
 * StokSay — Gerçekçi Demo Veri Oluşturucu
 *
 * - Mevcut işletmeleri, depoları, ürünleri, sayımları siler
 * - 2 gerçekçi işletme oluşturur (her biri 3-4 depo)
 * - Her işletme için 1000 gerçekçi ürün ekler
 * - Her depo için gerçekçi sayımlar oluşturur (kalemlerle birlikte)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const uuid = () => crypto.randomUUID();

// ── İşletmeler ──
const ISLETMELER = [
  {
    id: 'aaaaaaaa-0001-0001-0001-000000000001',
    ad: 'Güneş Gross Market',
    kod: 'GUNES',
    adres: 'İstanbul, Ümraniye, Alemdağ Cad. No:145',
    telefon: '0216 555 1234',
    depolar: [
      { id: 'bbbbbbbb-0001-0001-0001-000000000001', ad: 'Merkez Depo', kod: 'GNS-MRK', konum: 'Ümraniye Ana Bina, Zemin Kat' },
      { id: 'bbbbbbbb-0002-0002-0002-000000000002', ad: 'Soğuk Hava Deposu', kod: 'GNS-SOG', konum: 'Ümraniye Ana Bina, Bodrum' },
      { id: 'bbbbbbbb-0003-0003-0003-000000000003', ad: 'Pendik Şube Deposu', kod: 'GNS-PND', konum: 'Pendik, Sanayi Mah.' },
      { id: 'bbbbbbbb-0004-0004-0004-000000000004', ad: 'Tuzla Dağıtım Merkezi', kod: 'GNS-TZL', konum: 'Tuzla Organize Sanayi' },
    ],
  },
  {
    id: 'aaaaaaaa-0002-0002-0002-000000000002',
    ad: 'Yıldız Yapı Market',
    kod: 'YILDIZ',
    adres: 'Ankara, Ostim, 1354. Cadde No:22',
    telefon: '0312 385 5678',
    depolar: [
      { id: 'bbbbbbbb-0005-0005-0005-000000000005', ad: 'Ostim Ana Depo', kod: 'YLZ-OST', konum: 'Ostim Organize Sanayi, D Blok' },
      { id: 'bbbbbbbb-0006-0006-0006-000000000006', ad: 'Sincan Şube Deposu', kod: 'YLZ-SNC', konum: 'Sincan, Atatürk Mah.' },
      { id: 'bbbbbbbb-0007-0007-0007-000000000007', ad: 'Kızılay Showroom Deposu', kod: 'YLZ-KZL', konum: 'Kızılay, Sakarya Cad.' },
    ],
  },
];

// ── Gross Market Ürün Kategorileri ──
const MARKET_KATEGORILER = {
  'Süt & Süt Ürünleri': [
    ['Tam Yağlı Süt 1L', 'LT'], ['Yarım Yağlı Süt 1L', 'LT'], ['Günlük Süt 500ml', 'LT'],
    ['Beyaz Peynir 600g', 'KG'], ['Kaşar Peynir 500g', 'KG'], ['Tulum Peynir 400g', 'KG'],
    ['Süzme Yoğurt 1Kg', 'KG'], ['Ayran 200ml', 'ADET'], ['Kefir 500ml', 'ADET'],
    ['Labne Peynir 200g', 'KG'], ['Lor Peynir 500g', 'KG'], ['Tereyağı 250g', 'KG'],
    ['Margarin 500g', 'KG'], ['Krema 200ml', 'LT'], ['Kaymak 150g', 'KG'],
    ['Taze Mozzarella 200g', 'KG'], ['Çedar Peynir 200g', 'KG'], ['Kahvaltılık Krem Peynir 400g', 'KG'],
    ['Sürme Peynir 300g', 'KG'], ['Dil Peynir 400g', 'KG'],
  ],
  'Et & Tavuk': [
    ['Dana Kıyma 500g', 'KG'], ['Dana Kuşbaşı 500g', 'KG'], ['Dana Biftek 300g', 'KG'],
    ['Kuzu But 1Kg', 'KG'], ['Kuzu Pirzola 500g', 'KG'], ['Bütün Tavuk 1.5Kg', 'KG'],
    ['Tavuk Göğüs 500g', 'KG'], ['Tavuk But 1Kg', 'KG'], ['Tavuk Kanat 500g', 'KG'],
    ['Hindi Füme 150g', 'KG'], ['Sucuk 250g', 'KG'], ['Pastırma 200g', 'KG'],
    ['Kangal Sucuk 500g', 'KG'], ['Salam 250g', 'KG'], ['Sosis 300g', 'KG'],
  ],
  'Meyve & Sebze': [
    ['Domates 1Kg', 'KG'], ['Salatalık 1Kg', 'KG'], ['Biber Sivri 500g', 'KG'],
    ['Patlıcan 1Kg', 'KG'], ['Kabak 1Kg', 'KG'], ['Patates 2Kg', 'KG'],
    ['Soğan 2Kg', 'KG'], ['Sarımsak 500g', 'KG'], ['Havuç 1Kg', 'KG'],
    ['Elma Kırmızı 1Kg', 'KG'], ['Portakal 1Kg', 'KG'], ['Muz 1Kg', 'KG'],
    ['Üzüm 500g', 'KG'], ['Çilek 500g', 'KG'], ['Limon 1Kg', 'KG'],
    ['Ispanak 500g', 'KG'], ['Marul 1 Adet', 'ADET'], ['Brokoli 500g', 'KG'],
    ['Karnıbahar 1 Adet', 'ADET'], ['Mantar 250g', 'KG'],
  ],
  'Temel Gıda': [
    ['Un 5Kg', 'KG'], ['Şeker 3Kg', 'KG'], ['Tuz 1Kg', 'KG'],
    ['Pirinç Baldo 2Kg', 'KG'], ['Pirinç Osmancık 1Kg', 'KG'], ['Bulgur İnce 1Kg', 'KG'],
    ['Bulgur Pilavlık 2Kg', 'KG'], ['Makarna Spagetti 500g', 'KG'], ['Makarna Penne 500g', 'KG'],
    ['Makarna Burgu 500g', 'KG'], ['Mercimek Kırmızı 1Kg', 'KG'], ['Mercimek Yeşil 1Kg', 'KG'],
    ['Nohut 1Kg', 'KG'], ['Fasulye Kuru 1Kg', 'KG'], ['Barbunya 1Kg', 'KG'],
    ['Börülce 500g', 'KG'], ['Mısır Gevreği 400g', 'KG'], ['Yulaf Ezmesi 500g', 'KG'],
    ['Galeta Unu 250g', 'KG'], ['Nişasta 200g', 'KG'],
  ],
  'Yağ & Sos': [
    ['Ayçiçek Yağı 5L', 'LT'], ['Ayçiçek Yağı 2L', 'LT'], ['Zeytinyağı Sızma 1L', 'LT'],
    ['Zeytinyağı Riviera 2L', 'LT'], ['Mısırözü Yağı 1L', 'LT'], ['Fındık Yağı 500ml', 'LT'],
    ['Domates Salçası 700g', 'KG'], ['Domates Salçası 1.5Kg', 'KG'], ['Biber Salçası 700g', 'KG'],
    ['Ketçap 600g', 'KG'], ['Mayonez 500g', 'KG'], ['Hardal 200g', 'KG'],
    ['Soya Sosu 250ml', 'LT'], ['Sirke Üzüm 500ml', 'LT'], ['Sirke Elma 500ml', 'LT'],
    ['Nar Ekşisi 330ml', 'LT'], ['Acı Sos 150ml', 'LT'], ['Barbekü Sos 300ml', 'LT'],
  ],
  'İçecek': [
    ['Su 1.5L', 'ADET'], ['Su 5L', 'ADET'], ['Maden Suyu 200ml', 'ADET'],
    ['Maden Suyu 1L', 'ADET'], ['Kola 1L', 'ADET'], ['Kola 2.5L', 'ADET'],
    ['Fanta 1L', 'ADET'], ['Sprite 1L', 'ADET'], ['Ice Tea Şeftali 1L', 'ADET'],
    ['Ice Tea Limon 1L', 'ADET'], ['Portakal Suyu 1L', 'ADET'], ['Karışık Meyve Suyu 1L', 'ADET'],
    ['Vişne Suyu 1L', 'ADET'], ['Şalgam Suyu 1L', 'ADET'], ['Enerji İçeceği 250ml', 'ADET'],
    ['Soda 200ml', 'ADET'], ['Limonata 1L', 'ADET'], ['Ayran 1L', 'ADET'],
  ],
  'Kahvaltılık': [
    ['Bal Süzme 850g', 'KG'], ['Bal Kavanoz 450g', 'KG'], ['Reçel Çilek 380g', 'KG'],
    ['Reçel Kayısı 380g', 'KG'], ['Reçel Vişne 380g', 'KG'], ['Pekmez Üzüm 400g', 'KG'],
    ['Pekmez Dut 400g', 'KG'], ['Tahin 300g', 'KG'], ['Tahin Pekmez 400g', 'KG'],
    ['Helva Sade 500g', 'KG'], ['Zeytin Yeşil 500g', 'KG'], ['Zeytin Siyah 500g', 'KG'],
    ['Yumurta 15li', 'ADET'], ['Yumurta 30lu', 'ADET'], ['Çikolatalı Fındık Kreması 400g', 'KG'],
  ],
  'Baharat & Çeşni': [
    ['Karabiber 100g', 'ADET'], ['Kırmızı Biber Pul 200g', 'ADET'], ['Kimyon 100g', 'ADET'],
    ['Kekik 100g', 'ADET'], ['Nane Kuru 50g', 'ADET'], ['Tarçın 100g', 'ADET'],
    ['Zerdeçal 100g', 'ADET'], ['Köri 80g', 'ADET'], ['Sumak 200g', 'ADET'],
    ['Defne Yaprağı 30g', 'ADET'], ['Isot 100g', 'ADET'], ['Karanfil 30g', 'ADET'],
  ],
  'Konserve & Hazır Gıda': [
    ['Ton Balığı 160g', 'ADET'], ['Ton Balığı 80g', 'ADET'], ['Mısır Konserve 400g', 'ADET'],
    ['Bezelye Konserve 400g', 'ADET'], ['Mantar Konserve 400g', 'ADET'], ['Fasulye Konserve 400g', 'ADET'],
    ['Turşu Kornişon 680g', 'ADET'], ['Hazır Çorba Mercimek', 'ADET'], ['Hazır Çorba Domates', 'ADET'],
    ['Hazır Noodle Tavuk', 'ADET'], ['Közlenmiş Biber Konserve 680g', 'ADET'], ['Yaprak Sarma Konserve 400g', 'ADET'],
  ],
  'Unlu Mamüller': [
    ['Ekmek Beyaz', 'ADET'], ['Ekmek Tam Buğday', 'ADET'], ['Tost Ekmeği', 'ADET'],
    ['Hamburger Ekmeği 4lü', 'ADET'], ['Lavaş 6lı', 'ADET'], ['Bazlama 3lü', 'ADET'],
    ['Simit 5li', 'ADET'], ['Poğaça 6lı', 'ADET'], ['Kruvasan 4lü', 'ADET'],
    ['Galeta 300g', 'ADET'], ['Grissini 200g', 'ADET'], ['Pide Ekmeği', 'ADET'],
  ],
  'Atıştırmalık': [
    ['Cips Klasik 150g', 'ADET'], ['Cips Süper Boy 250g', 'ADET'], ['Mısır Cipsi 120g', 'ADET'],
    ['Kraker Tuzlu 120g', 'ADET'], ['Çubuk Kraker 80g', 'ADET'], ['Fıstık Kavrulmuş 200g', 'ADET'],
    ['Antep Fıstığı 150g', 'ADET'], ['Kaju 100g', 'ADET'], ['Badem 150g', 'ADET'],
    ['Leblebi 300g', 'ADET'], ['Ceviz İç 200g', 'ADET'], ['Kuru Üzüm 300g', 'ADET'],
    ['Kuru Kayısı 200g', 'ADET'], ['Kuru İncir 300g', 'ADET'], ['Karışık Kuruyemiş 400g', 'ADET'],
  ],
  'Çay & Kahve': [
    ['Çay Siyah 1Kg', 'KG'], ['Çay Siyah 500g', 'KG'], ['Çay Yeşil 200g', 'KG'],
    ['Türk Kahvesi 250g', 'KG'], ['Filtre Kahve 250g', 'KG'], ['Hazır Kahve 200g', 'KG'],
    ['Nescafe 3ü1 Arada 10lu', 'ADET'], ['Bitki Çayı Ihlamur 40g', 'ADET'], ['Bitki Çayı Papatya 40g', 'ADET'],
    ['Espresso Kapsül 10lu', 'ADET'], ['Kakao 200g', 'ADET'], ['Salep 200g', 'ADET'],
  ],
  'Temizlik': [
    ['Bulaşık Deterjanı 1.5L', 'ADET'], ['Bulaşık Makinesi Tableti 40lı', 'ADET'], ['Çamaşır Deterjanı 4Kg', 'KG'],
    ['Çamaşır Yumuşatıcı 2L', 'LT'], ['Çamaşır Suyu 2.5L', 'LT'], ['Yüzey Temizleyici 1L', 'LT'],
    ['Cam Sil 1L', 'LT'], ['Tuvalet Temizleyici 750ml', 'LT'], ['Mutfak Temizleyici 750ml', 'LT'],
    ['Kireç Çözücü 750ml', 'LT'], ['Oda Kokusu Sprey 300ml', 'ADET'], ['Oda Kokusu Jel 150g', 'ADET'],
  ],
  'Kağıt & Hijyen': [
    ['Tuvalet Kağıdı 24lü', 'ADET'], ['Tuvalet Kağıdı 12li', 'ADET'], ['Kağıt Havlu 6lı', 'ADET'],
    ['Kağıt Havlu 3lü', 'ADET'], ['Peçete 100lü', 'ADET'], ['Islak Mendil 100lü', 'ADET'],
    ['Islak Mendil Bebek 72li', 'ADET'], ['El Sabunu Sıvı 500ml', 'ADET'], ['Duş Jeli 500ml', 'ADET'],
    ['Şampuan 500ml', 'ADET'], ['Diş Macunu 100ml', 'ADET'], ['Diş Fırçası', 'ADET'],
  ],
  'Dondurma & Donuk': [
    ['Dondurma Kakaolu 1L', 'ADET'], ['Dondurma Vanilya 1L', 'ADET'], ['Dondurma Çubuk 4lü', 'ADET'],
    ['Donuk Bezelye 450g', 'KG'], ['Donuk Ispanak 450g', 'KG'], ['Donuk Karışık Sebze 450g', 'KG'],
    ['Donuk Patates Kızartmalık 1Kg', 'KG'], ['Donuk Pizza 3lü', 'ADET'], ['Donuk Börek 500g', 'KG'],
    ['Donuk Mantı 500g', 'KG'], ['Donuk Karides 300g', 'KG'], ['Donuk Balık Fileto 400g', 'KG'],
  ],
  'Bebek & Mama': [
    ['Bebek Maması 1 Numara 400g', 'ADET'], ['Bebek Maması 2 Numara 400g', 'ADET'],
    ['Bebek Bisküvisi 200g', 'ADET'], ['Bebek Suyu 1L', 'ADET'],
    ['Bebek Bezi 1 Numara 40lı', 'ADET'], ['Bebek Bezi 3 Numara 36lı', 'ADET'],
    ['Bebek Bezi 5 Numara 30lu', 'ADET'], ['Bebek Şampuanı 200ml', 'ADET'],
  ],
};

// ── Yapı Market Ürün Kategorileri ──
const YAPI_KATEGORILER = {
  'Boya & Badana': [
    ['İç Cephe Boya Beyaz 15L', 'ADET'], ['İç Cephe Boya Beyaz 2.5L', 'ADET'], ['İç Cephe Boya Krem 15L', 'ADET'],
    ['Dış Cephe Boya Beyaz 15L', 'ADET'], ['Dış Cephe Boya Gri 15L', 'ADET'], ['Antipas Boya 2.5L', 'ADET'],
    ['Ahşap Vernik 2.5L', 'ADET'], ['Ahşap Boyası Ceviz 750ml', 'ADET'], ['Sprey Boya Siyah 400ml', 'ADET'],
    ['Sprey Boya Kırmızı 400ml', 'ADET'], ['Tiner 5L', 'LT'], ['Astar Boya 7.5L', 'ADET'],
    ['Rulo 25cm', 'ADET'], ['Rulo 10cm Mini', 'ADET'], ['Fırça 3lü Set', 'ADET'],
    ['Bant Kağıdı 50m', 'ADET'], ['Naylon Örtü 4x5m', 'ADET'], ['Macun Dolgu 500g', 'KG'],
    ['Alçı 5Kg', 'KG'], ['Kartonpiyer Yapıştırıcı 1Kg', 'KG'],
  ],
  'Hırdavat': [
    ['Çekiç 500g', 'ADET'], ['Pense 200mm', 'ADET'], ['Tornavida Set 8li', 'ADET'],
    ['İngiliz Anahtarı 250mm', 'ADET'], ['Lokma Takımı 40 Parça', 'ADET'], ['Şerit Metre 5m', 'ADET'],
    ['Şerit Metre 8m', 'ADET'], ['Su Terazisi 60cm', 'ADET'], ['Testere El 45cm', 'ADET'],
    ['Maket Bıçağı', 'ADET'], ['Yedek Maket Bıçağı 10lu', 'ADET'], ['Kerpeten 200mm', 'ADET'],
    ['Yan Keski 180mm', 'ADET'], ['Allen Anahtar Set 9lu', 'ADET'], ['Cırcır Kol 1/2"', 'ADET'],
    ['Matkap Ucu Set HSS 13lü', 'ADET'], ['Dübel Vida Set 100lü', 'ADET'], ['Silikon Tabancası', 'ADET'],
    ['Silikon Beyaz 280ml', 'ADET'], ['Silikon Şeffaf 280ml', 'ADET'],
  ],
  'Elektrik': [
    ['Kablo NYA 2.5mm 100m', 'METRE'], ['Kablo NYA 1.5mm 100m', 'METRE'], ['Kablo TTR 3x2.5mm 50m', 'METRE'],
    ['Priz Tekli', 'ADET'], ['Priz İkili', 'ADET'], ['Anahtar Tekli', 'ADET'],
    ['Anahtar Komütatör', 'ADET'], ['Grup Priz 3lü 3m', 'ADET'], ['Grup Priz 5li 5m', 'ADET'],
    ['LED Ampul 9W E27', 'ADET'], ['LED Ampul 12W E27', 'ADET'], ['LED Ampul 15W E27', 'ADET'],
    ['Halojen Spot GU10 50W', 'ADET'], ['LED Panel 60x60 40W', 'ADET'], ['Tavan Armatürü Yuvarlak', 'ADET'],
    ['Sigorta Otomatik 16A', 'ADET'], ['Sigorta Otomatik 25A', 'ADET'], ['Kaçak Akım Rölesi 40A', 'ADET'],
    ['Bant İzole 10lu', 'ADET'], ['Kablo Kanalı 2x1 2m', 'ADET'],
  ],
  'Tesisat': [
    ['PPR Boru 20mm 4m', 'ADET'], ['PPR Boru 25mm 4m', 'ADET'], ['PPR Boru 32mm 4m', 'ADET'],
    ['PPR Dirsek 20mm', 'ADET'], ['PPR Dirsek 25mm', 'ADET'], ['PPR T Parça 20mm', 'ADET'],
    ['PPR T Parça 25mm', 'ADET'], ['PPR Küresel Vana 20mm', 'ADET'], ['PPR Küresel Vana 25mm', 'ADET'],
    ['Spiral 1/2" 50cm', 'ADET'], ['Spiral 1/2" 80cm', 'ADET'], ['Lavabo Sifonu', 'ADET'],
    ['Banyo Gideri', 'ADET'], ['Teflon Bant', 'ADET'], ['Kelepçe 1/2" 10lu', 'ADET'],
    ['PVC Boru 50mm 3m', 'ADET'], ['PVC Boru 100mm 3m', 'ADET'], ['PVC Dirsek 50mm', 'ADET'],
    ['Musluk Batarya Mutfak', 'ADET'], ['Musluk Batarya Banyo', 'ADET'],
  ],
  'Seramik & Fayans': [
    ['Yer Seramiği 60x60 Bej', 'M2'], ['Yer Seramiği 60x60 Gri', 'M2'], ['Yer Seramiği 30x30 Beyaz', 'M2'],
    ['Duvar Fayansı 30x60 Beyaz', 'M2'], ['Duvar Fayansı 25x40 Krem', 'M2'], ['Mozaik 30x30 Cam', 'M2'],
    ['Granit Seramik 80x80 Antrasit', 'M2'], ['Bordür 8x25', 'ADET'], ['Köşe Profili 2.5m', 'ADET'],
    ['Seramik Yapıştırıcı 25Kg', 'KG'], ['Derz Dolgu Beyaz 5Kg', 'KG'], ['Derz Dolgu Gri 5Kg', 'KG'],
    ['Seramik Kesici 600mm', 'ADET'], ['Derz Çıtası 2mm 200lü', 'ADET'], ['Su Yalıtım Malzemesi 18Kg', 'KG'],
  ],
  'Yapı Kimyasalları': [
    ['Çimento 50Kg', 'KG'], ['Hazır Sıva 25Kg', 'KG'], ['Alçı Sıva 25Kg', 'KG'],
    ['Kum Çuvalı 50Kg', 'KG'], ['Gazbeton Yapıştırıcı 25Kg', 'KG'], ['Şap 25Kg', 'KG'],
    ['Beton Katkı Maddesi 5L', 'LT'], ['Akrilik Macun 25Kg', 'KG'], ['Epoksi Yapıştırıcı Set', 'ADET'],
    ['Montaj Köpüğü 750ml', 'ADET'], ['Montaj Köpüğü Tabancalı', 'ADET'], ['Mantolama Yapıştırıcı 25Kg', 'KG'],
    ['XPS Isı Yalıtım 3cm', 'M2'], ['EPS Strafor 5cm', 'M2'], ['Taş Yünü 5cm', 'M2'],
  ],
  'Ahşap & Kereste': [
    ['MDF Levha 18mm 210x280', 'ADET'], ['MDF Levha 8mm 210x280', 'ADET'], ['Suntalam Beyaz 18mm', 'ADET'],
    ['Kontrplak 18mm 210x210', 'ADET'], ['Çam Kereste 5x10 3m', 'ADET'], ['Çam Kereste 5x5 3m', 'ADET'],
    ['Çam Lambri 1m2', 'M2'], ['Parke Laminat 8mm', 'M2'], ['Parke Laminat 12mm', 'M2'],
    ['Süpürgelik PVC 7cm 2.5m', 'ADET'], ['Kapı Kasası Set', 'ADET'], ['Menteşe 3lü Set', 'ADET'],
    ['Vida 4x40 100lü', 'ADET'], ['Vida 5x50 100lü', 'ADET'], ['Çivi 40mm 1Kg', 'KG'],
  ],
  'Bahçe & Dış Mekan': [
    ['Bahçe Hortumu 20m', 'ADET'], ['Bahçe Hortumu 50m', 'ADET'], ['Fiskiye Tabancası', 'ADET'],
    ['Çim Tohumu 1Kg', 'KG'], ['Gübre Granül 5Kg', 'KG'], ['Saksı 30cm', 'ADET'],
    ['Saksı 50cm', 'ADET'], ['Saksı Toprağı 20L', 'ADET'], ['Çapa Küçük', 'ADET'],
    ['Budama Makası', 'ADET'], ['Çim Biçme Makinesi Elektrikli', 'ADET'], ['Bahçe Eldiveni', 'ADET'],
    ['Sundurma Polikarbon 2m', 'ADET'], ['Pergola Ahşap 3x3m', 'ADET'], ['Dış Mekan Fener LED', 'ADET'],
  ],
  'Banyo & Mutfak': [
    ['Lavabo Set Beyaz', 'ADET'], ['Klozet Set Beyaz', 'ADET'], ['Rezervuar İç Takım', 'ADET'],
    ['Duş Başlığı Krom', 'ADET'], ['Duş Seti Komple', 'ADET'], ['Banyo Dolabı 65cm', 'ADET'],
    ['Banyo Aynası 50x70', 'ADET'], ['Havluluk Krom', 'ADET'], ['Sabunluk Krom', 'ADET'],
    ['Duşakabin 80x80', 'ADET'], ['Duşakabin 90x90', 'ADET'], ['Küvet 150x70', 'ADET'],
    ['Mutfak Evyesi Tek Gözlü', 'ADET'], ['Mutfak Evyesi Çift Gözlü', 'ADET'], ['Tezgah Altı Filtre', 'ADET'],
  ],
  'Kapı & Pencere': [
    ['İç Kapı Amerikan Panel', 'ADET'], ['İç Kapı Cam Sürgü', 'ADET'], ['Dış Kapı Çelik', 'ADET'],
    ['PVC Pencere 100x120', 'ADET'], ['PVC Pencere 120x150', 'ADET'], ['Alüminyum Doğrama 2m', 'ADET'],
    ['Sineklik Pencere 100x120', 'ADET'], ['Panjur PVC 100cm', 'ADET'], ['Kapı Kolu Rozetli', 'ADET'],
    ['Kilit Silindir Barel', 'ADET'], ['Pencere Kolu', 'ADET'], ['Menteşe Kapı 3lü', 'ADET'],
  ],
  'Makine & Alet': [
    ['Darbeli Matkap 750W', 'ADET'], ['Şarjlı Matkap 18V', 'ADET'], ['Avuç Taşlama 115mm', 'ADET'],
    ['Dekupaj Testere 650W', 'ADET'], ['Daire Testere 190mm', 'ADET'], ['Hilti Kırıcı Delici', 'ADET'],
    ['Kompresör 50L', 'ADET'], ['Kaynak Makinesi İnvertör', 'ADET'], ['Taşlama Diski 115mm 25li', 'ADET'],
    ['Matkap Ucu Beton 6mm', 'ADET'], ['Matkap Ucu Beton 8mm', 'ADET'], ['Matkap Ucu Beton 10mm', 'ADET'],
    ['Dübel Fisher 8mm 100lü', 'ADET'], ['Dübel Fisher 10mm 50li', 'ADET'], ['Çelik Halat 3mm 50m', 'METRE'],
  ],
  'Güvenlik & Yangın': [
    ['Yangın Söndürücü 6Kg', 'ADET'], ['Yangın Söndürücü 2Kg', 'ADET'], ['Duman Dedektörü', 'ADET'],
    ['İlk Yardım Çantası', 'ADET'], ['Güvenlik Kamerası Set 4lü', 'ADET'], ['Hareket Sensörü', 'ADET'],
    ['Alarm Seti Kablosuz', 'ADET'], ['Baret Beyaz', 'ADET'], ['İş Eldiveni 12li', 'ADET'],
    ['Koruyucu Gözlük', 'ADET'], ['Reflektörlü Yelek', 'ADET'], ['Güvenlik Bariyeri 1m', 'ADET'],
  ],
  'Aydınlatma': [
    ['Avize Modern 3lü', 'ADET'], ['Avize Klasik 5li', 'ADET'], ['Aplık Duvar Tek', 'ADET'],
    ['Spot Sıva Altı LED', 'ADET'], ['Spot Sıva Üstü LED', 'ADET'], ['Led Şerit 5m Beyaz', 'ADET'],
    ['Led Şerit 5m RGB', 'ADET'], ['Bahçe Aydınlatma Solar', 'ADET'], ['Projektör LED 50W', 'ADET'],
    ['Projektör LED 100W', 'ADET'], ['Sensörlü Tavan Lambası', 'ADET'], ['Floresan Armatür 120cm', 'ADET'],
  ],
};

// ── Ürün üretici ──
function generateProducts(kategoriler, isletmeId, prefix) {
  const products = [];
  let counter = 1;
  const allKats = Object.entries(kategoriler);

  for (const [kategori, urunler] of allKats) {
    for (const [urunAdi, birim] of urunler) {
      const kod = `${prefix}-${String(counter).padStart(4, '0')}`;
      const barkod = `869${prefix === 'GNS' ? '1' : '2'}${String(counter).padStart(9, '0')}`;
      products.push({
        id: uuid(),
        isletme_id: isletmeId,
        urun_kodu: kod,
        urun_adi: urunAdi,
        birim,
        kategori,
        barkodlar: barkod,
      });
      counter++;
    }
  }

  // Ürün sayısını 1000'e tamamla (varyantlar ekle)
  const markalar = prefix === 'GNS'
    ? ['Ülker', 'Eti', 'Pınar', 'Sütaş', 'Torku', 'Bingo', 'Fairy', 'Komili', 'Taze', 'Duru', 'Omo', 'Ariel', 'Persil', 'Knorr', 'Maggi']
    : ['Betek', 'Marshall', 'Bosch', 'Makita', 'Stanley', 'Yıldız', 'Knauf', 'Weber', 'Kale', 'Vitra', 'Eczacıbaşı', 'Artema', 'Grohe', 'Karcher', 'Hilti'];

  const boyutlar = prefix === 'GNS'
    ? ['Mini', 'Ekonomik', 'Aile Boy', 'Dev Boy', 'XL', 'Mega', '2li Paket', '3lü Paket']
    : ['Profesyonel', 'Hobi', 'Endüstriyel', 'Kompakt', 'Taşınabilir', 'HD', 'Premium', 'Standart'];

  while (products.length < 1000) {
    const base = products[Math.floor(Math.random() * Math.min(products.length, 200))];
    const marka = markalar[Math.floor(Math.random() * markalar.length)];
    const boyut = boyutlar[Math.floor(Math.random() * boyutlar.length)];
    const kod = `${prefix}-${String(counter).padStart(4, '0')}`;
    const barkod = `869${prefix === 'GNS' ? '1' : '2'}${String(counter).padStart(9, '0')}`;
    products.push({
      id: uuid(),
      isletme_id: isletmeId,
      urun_kodu: kod,
      urun_adi: `${marka} ${base.urun_adi} ${boyut}`,
      birim: base.birim,
      kategori: base.kategori,
      barkodlar: barkod,
    });
    counter++;
  }

  return products.slice(0, 1000);
}

// ── Sayım üretici ──
function generateSayimlar(isletme, kullaniciId, urunler) {
  const sayimlar = [];
  const kalemler = [];
  const depolar = isletme.depolar;
  const tarihler = [
    '2025-12-15', '2025-12-28', '2026-01-10', '2026-01-25',
    '2026-02-05', '2026-02-18', '2026-03-01', '2026-03-10',
  ];
  const durumlar = ['tamamlandi', 'tamamlandi', 'tamamlandi', 'tamamlandi', 'tamamlandi', 'devam', 'devam', 'devam'];

  for (let i = 0; i < tarihler.length; i++) {
    const depo = depolar[i % depolar.length];
    const sayimId = uuid();
    const durum = durumlar[i];
    const tarih = tarihler[i];

    sayimlar.push({
      id: sayimId,
      isletme_id: isletme.id,
      depo_id: depo.id,
      kullanici_id: kullaniciId,
      ad: `${depo.ad} — ${tarih.substring(0, 7)} Sayımı`,
      tarih,
      durum,
    });

    // Her sayıma 20-80 arası rastgele ürün ekle
    const kalemSayisi = 20 + Math.floor(Math.random() * 60);
    const shuffled = [...urunler].sort(() => Math.random() - 0.5);
    const secilen = shuffled.slice(0, kalemSayisi);

    for (const urun of secilen) {
      kalemler.push({
        id: uuid(),
        sayim_id: sayimId,
        urun_id: urun.id,
        miktar: (1 + Math.floor(Math.random() * 200)).toString(),
        birim: urun.birim,
      });
    }
  }

  return { sayimlar, kalemler };
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
  });

  console.log('🔌 DB bağlantısı kuruldu...');

  // 1. Mevcut verileri sil (sıra önemli)
  console.log('🗑️  Mevcut veriler siliniyor...');
  await pool.execute('DELETE FROM urun_log');
  await pool.execute('DELETE FROM sayim_kalemleri');
  await pool.execute('DELETE FROM sayimlar');
  await pool.execute('DELETE FROM isletme_urunler');
  await pool.execute('DELETE FROM depolar');
  await pool.execute('DELETE FROM kullanici_isletme');
  await pool.execute('DELETE FROM isletmeler');
  console.log('✅ Mevcut veriler silindi.');

  // 2. İşletmeler
  console.log('🏢 İşletmeler ekleniyor...');
  for (const isl of ISLETMELER) {
    await pool.execute(
      'INSERT INTO isletmeler (id, ad, kod, adres, telefon) VALUES (?,?,?,?,?)',
      [isl.id, isl.ad, isl.kod, isl.adres, isl.telefon]
    );
  }

  // 3. Depolar
  console.log('🏭 Depolar ekleniyor...');
  for (const isl of ISLETMELER) {
    for (const d of isl.depolar) {
      await pool.execute(
        'INSERT INTO depolar (id, isletme_id, ad, kod, konum) VALUES (?,?,?,?,?)',
        [d.id, isl.id, d.ad, d.kod, d.konum]
      );
    }
  }

  // 4. Kullanıcıları işletmelere ata
  console.log('👥 Kullanıcı atamaları yapılıyor...');
  const [users] = await pool.execute('SELECT id FROM kullanicilar');
  const fullPerms = JSON.stringify({
    urun: { goruntule: true, ekle: true, duzenle: true, sil: true },
    depo: { goruntule: true, ekle: true, duzenle: true, sil: true },
    sayim: { goruntule: true, ekle: true, duzenle: true, sil: true },
  });
  for (const u of users) {
    for (const isl of ISLETMELER) {
      await pool.execute(
        'INSERT INTO kullanici_isletme (id, kullanici_id, isletme_id, yetkiler) VALUES (?,?,?,?)',
        [uuid(), u.id, isl.id, fullPerms]
      );
    }
  }

  // 5. Ürünler
  console.log('📦 Güneş Gross Market ürünleri ekleniyor (1000 ürün)...');
  const gnsUrunler = generateProducts(MARKET_KATEGORILER, ISLETMELER[0].id, 'GNS');
  for (const u of gnsUrunler) {
    await pool.execute(
      'INSERT INTO isletme_urunler (id, isletme_id, urun_kodu, urun_adi, birim, kategori, barkodlar) VALUES (?,?,?,?,?,?,?)',
      [u.id, u.isletme_id, u.urun_kodu, u.urun_adi, u.birim, u.kategori, u.barkodlar]
    );
  }

  console.log('🔧 Yıldız Yapı Market ürünleri ekleniyor (1000 ürün)...');
  const ylzUrunler = generateProducts(YAPI_KATEGORILER, ISLETMELER[1].id, 'YLZ');
  for (const u of ylzUrunler) {
    await pool.execute(
      'INSERT INTO isletme_urunler (id, isletme_id, urun_kodu, urun_adi, birim, kategori, barkodlar) VALUES (?,?,?,?,?,?,?)',
      [u.id, u.isletme_id, u.urun_kodu, u.urun_adi, u.birim, u.kategori, u.barkodlar]
    );
  }

  // 6. Sayımlar
  const demo001 = users.find(u => true); // İlk kullanıcı
  console.log('📋 Sayımlar oluşturuluyor...');

  const gns = generateSayimlar(ISLETMELER[0], demo001.id, gnsUrunler);
  const ylz = generateSayimlar(ISLETMELER[1], demo001.id, ylzUrunler);
  const allSayimlar = [...gns.sayimlar, ...ylz.sayimlar];
  const allKalemler = [...gns.kalemler, ...ylz.kalemler];

  for (const s of allSayimlar) {
    await pool.execute(
      'INSERT INTO sayimlar (id, isletme_id, depo_id, kullanici_id, ad, tarih, durum) VALUES (?,?,?,?,?,?,?)',
      [s.id, s.isletme_id, s.depo_id, s.kullanici_id, s.ad, s.tarih, s.durum]
    );
  }

  console.log(`📝 ${allKalemler.length} sayım kalemi ekleniyor...`);
  // Batch insert
  const batchSize = 500;
  for (let i = 0; i < allKalemler.length; i += batchSize) {
    const batch = allKalemler.slice(i, i + batchSize);
    const values = batch.map(() => '(?,?,?,?,?)').join(',');
    const params = batch.flatMap(k => [k.id, k.sayim_id, k.urun_id, k.miktar, k.birim]);
    await pool.execute(
      `INSERT INTO sayim_kalemleri (id, sayim_id, urun_id, miktar, birim) VALUES ${values}`,
      params
    );
  }

  console.log('\n✅ Tamamlandı!');
  console.log(`   🏢 ${ISLETMELER.length} işletme`);
  console.log(`   🏭 ${ISLETMELER.reduce((a, i) => a + i.depolar.length, 0)} depo`);
  console.log(`   📦 ${gnsUrunler.length + ylzUrunler.length} ürün`);
  console.log(`   📋 ${allSayimlar.length} sayım`);
  console.log(`   📝 ${allKalemler.length} sayım kalemi`);

  await pool.end();
  process.exit(0);
}

main().catch(err => { console.error('❌ Hata:', err); process.exit(1); });
