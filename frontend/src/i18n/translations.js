/**
 * StokSay Frontend — Çok Dilli Çeviri Dosyası
 * Desteklenen diller: tr (Türkçe), az (Azerbaycanca), ru (Rusça)
 *
 * Yeni key eklerken 3 dili de yazmak ZORUNLUDUR.
 * Yeni dil eklemek: her key'e yeni dil ekle + LanguageContext SUPPORTED_LANGS'a ekle.
 *
 * Yapı: { 'key.path': { tr: '...', az: '...', ru: '...' } }
 */

const translations = {

  // ══════════════════════════════════════
  // GENEL / UYGULAMA
  // ══════════════════════════════════════
  'app.name': {
    tr: 'StokSay',
    az: 'StokSay',
    ru: 'StokSay',
  },
  'app.subtitle': {
    tr: 'DEPO YÖNETİM SİSTEMİ',
    az: 'ANBAR İDARƏETMƏ SİSTEMİ',
    ru: 'СИСТЕМА УПРАВЛЕНИЯ СКЛАДОМ',
  },
  'app.title': {
    tr: 'StokSay — Depo Sayım Sistemi',
    az: 'StokSay — Anbar Sayım Sistemi',
    ru: 'StokSay — Система Инвентаризации',
  },
  'app.version': {
    tr: 'v4.1.3 • Premium Edition',
    az: 'v4.1.3 • Premium Edition',
    ru: 'v4.1.3 • Premium Edition',
  },
  'app.edition': {
    tr: '2026 Edition',
    az: '2026 Edition',
    ru: '2026 Edition',
  },
  'app.allSystemsRunning': {
    tr: 'Tüm sistemler çalışıyor',
    az: 'Bütün sistemlər işləyir',
    ru: 'Все системы работают',
  },
  'app.systemOnline': {
    tr: 'Sistem Çevrimiçi',
    az: 'Sistem Onlayn',
    ru: 'Система онлайн',
  },
  'app.systemActive': {
    tr: 'Sistem Aktif',
    az: 'Sistem Aktiv',
    ru: 'Система активна',
  },
  'app.footer': {
    tr: 'StokSay — Depo Sayım Sistemi v4.1.3',
    az: 'StokSay — Anbar Sayım Sistemi v4.1.3',
    ru: 'StokSay — Система Инвентаризации v4.1.3',
  },

  // ══════════════════════════════════════
  // GİRİŞ / AUTH
  // ══════════════════════════════════════
  'login.badge': {
    tr: 'Yönetim Paneli',
    az: 'İdarə Paneli',
    ru: 'Панель управления',
  },
  'login.title': {
    tr: 'Yönetici Girişi',
    az: 'İdarəçi Girişi',
    ru: 'Вход администратора',
  },
  'login.subtitle': {
    tr: 'Yönetim paneline erişmek için giriş yapın',
    az: 'İdarə panelinə daxil olmaq üçün giriş edin',
    ru: 'Войдите для доступа к панели управления',
  },
  'login.email': {
    tr: 'E-POSTA ADRESİ',
    az: 'E-POÇT ÜNVANİ',
    ru: 'АДРЕС ЭЛЕКТРОННОЙ ПОЧТЫ',
  },
  'login.emailPlaceholder': {
    tr: 'admin@stoksay.com',
    az: 'admin@stoksay.com',
    ru: 'admin@stoksay.com',
  },
  'login.password': {
    tr: 'ŞİFRE',
    az: 'ŞİFRƏ',
    ru: 'ПАРОЛЬ',
  },
  'login.passwordPlaceholder': {
    tr: '••••••••',
    az: '••••••••',
    ru: '••••••••',
  },
  'login.submit': {
    tr: 'Panele Giriş Yap',
    az: 'Panelə Daxil Ol',
    ru: 'Войти в панель',
  },
  'login.loading': {
    tr: 'Giriş yapılıyor...',
    az: 'Daxil olunur...',
    ru: 'Вход выполняется...',
  },
  'login.sslSecure': {
    tr: 'SSL güvenli bağlantı ile korunuyor',
    az: 'SSL təhlükəsiz bağlantı ilə qorunur',
    ru: 'Защищено SSL безопасным соединением',
  },
  'login.adminOnly': {
    tr: 'Bu panel sadece yöneticilere özeldir.',
    az: 'Bu panel yalnız idarəçilər üçündür.',
    ru: 'Эта панель только для администраторов.',
  },
  'login.error': {
    tr: 'Email veya şifre hatalı.',
    az: 'Email və ya şifrə yanlışdır.',
    ru: 'Неверный email или пароль.',
  },
  'login.required': {
    tr: 'Email ve şifre zorunludur.',
    az: 'Email və şifrə tələb olunur.',
    ru: 'Email и пароль обязательны.',
  },
  'login.feature.multiCompany': {
    tr: 'Çoklu işletme yönetimi',
    az: 'Çoxlu müəssisə idarəetməsi',
    ru: 'Управление несколькими предприятиями',
  },
  'login.feature.userControl': {
    tr: 'Kullanıcı & yetki kontrolü',
    az: 'İstifadəçi & icazə nəzarəti',
    ru: 'Контроль пользователей и разрешений',
  },
  'login.feature.excelImport': {
    tr: 'Excel toplu ürün aktarımı',
    az: 'Excel toplu məhsul idxalı',
    ru: 'Массовый импорт товаров из Excel',
  },
  'login.feature.realTime': {
    tr: 'Gerçek zamanlı sayım takibi',
    az: 'Real vaxt sayım izləmə',
    ru: 'Отслеживание подсчёта в реальном времени',
  },

  // ══════════════════════════════════════
  // LAYOUT / NAVİGASYON
  // ══════════════════════════════════════
  'layout.management': {
    tr: 'Yönetim',
    az: 'İdarəetmə',
    ru: 'Управление',
  },
  'layout.panel': {
    tr: 'Paneli',
    az: 'Paneli',
    ru: 'Панель',
  },
  'layout.manageFromOneScreen': {
    tr: 'İşletme, depo ve kullanıcı yönetimini\ntek ekrandan yapın.',
    az: 'Müəssisə, anbar və istifadəçi idarəetməsini\ntək ekrandan edin.',
    ru: 'Управляйте предприятиями, складами\nи пользователями с одного экрана.',
  },
  'nav.businesses': {
    tr: 'İşletmeler',
    az: 'Müəssisələr',
    ru: 'Предприятия',
  },
  'nav.warehouses': {
    tr: 'Depolar',
    az: 'Anbarlar',
    ru: 'Склады',
  },
  'nav.users': {
    tr: 'Kullanıcılar',
    az: 'İstifadəçilər',
    ru: 'Пользователи',
  },
  'nav.products': {
    tr: 'Ürünler',
    az: 'Məhsullar',
    ru: 'Товары',
  },
  'nav.roles': {
    tr: 'Roller',
    az: 'Rollar',
    ru: 'Роли',
  },
  'nav.counts': {
    tr: 'Sayımlar',
    az: 'Sayımlar',
    ru: 'Подсчёты',
  },
  'nav.mergedCounts': {
    tr: 'Toplanmış Sayımlar',
    az: 'Toplanmış Sayımlar',
    ru: 'Объединённые подсчёты',
  },
  'nav.settings': {
    tr: 'Ayarlar',
    az: 'Parametrlər',
    ru: 'Настройки',
  },
  'nav.dashboard': {
    tr: 'Gösterge Paneli',
    az: 'İdarə Paneli',
    ru: 'Панель мониторинга',
  },
  'nav.logout': {
    tr: 'Çıkış',
    az: 'Çıxış',
    ru: 'Выход',
  },

  // ══════════════════════════════════════
  // SIDEBAR / HESAP BİLGİLERİ
  // ══════════════════════════════════════
  'sidebar.accountInfo': {
    tr: 'Hesap Bilgileri',
    az: 'Hesab Məlumatları',
    ru: 'Информация об аккаунте',
  },
  'sidebar.fullName': {
    tr: 'Ad Soyad',
    az: 'Ad Soyad',
    ru: 'ФИО',
  },
  'sidebar.role': {
    tr: 'Rol',
    az: 'Rol',
    ru: 'Роль',
  },
  'sidebar.email': {
    tr: 'E-posta',
    az: 'E-poçt',
    ru: 'Электронная почта',
  },
  'sidebar.roleAdmin': {
    tr: 'Yönetici',
    az: 'İdarəçi',
    ru: 'Администратор',
  },
  'sidebar.roleUser': {
    tr: 'Kullanıcı',
    az: 'İstifadəçi',
    ru: 'Пользователь',
  },

  // ══════════════════════════════════════
  // GÜN / AY İSİMLERİ
  // ══════════════════════════════════════
  'month.0': { tr: 'Ocak', az: 'Yanvar', ru: 'Январь' },
  'month.1': { tr: 'Şubat', az: 'Fevral', ru: 'Февраль' },
  'month.2': { tr: 'Mart', az: 'Mart', ru: 'Март' },
  'month.3': { tr: 'Nisan', az: 'Aprel', ru: 'Апрель' },
  'month.4': { tr: 'Mayıs', az: 'May', ru: 'Май' },
  'month.5': { tr: 'Haziran', az: 'İyun', ru: 'Июнь' },
  'month.6': { tr: 'Temmuz', az: 'İyul', ru: 'Июль' },
  'month.7': { tr: 'Ağustos', az: 'Avqust', ru: 'Август' },
  'month.8': { tr: 'Eylül', az: 'Sentyabr', ru: 'Сентябрь' },
  'month.9': { tr: 'Ekim', az: 'Oktyabr', ru: 'Октябрь' },
  'month.10': { tr: 'Kasım', az: 'Noyabr', ru: 'Ноябрь' },
  'month.11': { tr: 'Aralık', az: 'Dekabr', ru: 'Декабрь' },

  // ══════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════
  'dashboard.countStatus': {
    tr: 'Sayım Durumu',
    az: 'Sayım Vəziyyəti',
    ru: 'Статус подсчёта',
  },
  'dashboard.countByBusiness': {
    tr: 'İşletme Bazlı Sayım',
    az: 'Müəssisə Əsaslı Sayım',
    ru: 'Подсчёт по предприятиям',
  },
  'dashboard.recentCounts': {
    tr: 'Son Sayımlar',
    az: 'Son Sayımlar',
    ru: 'Последние подсчёты',
  },
  'dashboard.viewAll': {
    tr: 'Tümünü Gör',
    az: 'Hamısını Gör',
    ru: 'Посмотреть все',
  },
  'dashboard.noCountYet': {
    tr: 'Henüz sayım yok',
    az: 'Hələ sayım yoxdur',
    ru: 'Подсчётов пока нет',
  },
  'dashboard.noData': {
    tr: 'Veri yok',
    az: 'Məlumat yoxdur',
    ru: 'Нет данных',
  },

  // ══════════════════════════════════════
  // İŞLETMELER
  // ══════════════════════════════════════
  'businesses.title': {
    tr: 'İşletme Yönetimi',
    az: 'Müəssisə İdarəetməsi',
    ru: 'Управление предприятиями',
  },
  'businesses.new': {
    tr: 'Yeni İşletme',
    az: 'Yeni Müəssisə',
    ru: 'Новое предприятие',
  },
  'businesses.edit': {
    tr: 'İşletme Düzenle',
    az: 'Müəssisəni Redaktə Et',
    ru: 'Редактировать предприятие',
  },
  'businesses.name': {
    tr: 'Ad',
    az: 'Ad',
    ru: 'Название',
  },
  'businesses.code': {
    tr: 'Kod',
    az: 'Kod',
    ru: 'Код',
  },
  'businesses.phone': {
    tr: 'Telefon',
    az: 'Telefon',
    ru: 'Телефон',
  },
  'businesses.address': {
    tr: 'Adres',
    az: 'Ünvan',
    ru: 'Адрес',
  },
  'businesses.search': {
    tr: 'İşletme ara...',
    az: 'Müəssisə axtar...',
    ru: 'Поиск предприятия...',
  },
  'businesses.notFound': {
    tr: 'İşletme bulunamadı.',
    az: 'Müəssisə tapılmadı.',
    ru: 'Предприятие не найдено.',
  },
  'businesses.deactivateTitle': {
    tr: 'Pasife Al',
    az: 'Deaktiv Et',
    ru: 'Деактивировать',
  },
  'businesses.activateTitle': {
    tr: 'Aktife Al',
    az: 'Aktiv Et',
    ru: 'Активировать',
  },
  'businesses.deactivateWarning': {
    tr: 'Bu işletme pasife alındığında kullanıcılar erişemeyecek ve uygulama listesinden kaybolacak. Mevcut sayımlar korunur.',
    az: 'Bu müəssisə deaktiv edildikdə istifadəçilər daxil ola bilməyəcək və tətbiq siyahısından silinəcək. Mövcud sayımlar qorunur.',
    ru: 'При деактивации предприятия пользователи потеряют доступ, и оно исчезнет из списка приложений. Существующие подсчёты сохранятся.',
  },
  'businesses.activateInfo': {
    tr: 'Bu işletme tekrar aktif hale getirilecek. Atanmış kullanıcılar yeniden erişebilecek.',
    az: 'Bu müəssisə yenidən aktiv ediləcək. Təyin edilmiş istifadəçilər yenidən daxil ola biləcək.',
    ru: 'Предприятие будет снова активировано. Назначенные пользователи снова получат доступ.',
  },
  'businesses.copyId': {
    tr: 'ID\'yi kopyala',
    az: 'ID-ni kopyala',
    ru: 'Копировать ID',
  },

  // ══════════════════════════════════════
  // DEPOLAR
  // ══════════════════════════════════════
  'warehouses.title': {
    tr: 'Depo Yönetimi',
    az: 'Anbar İdarəetməsi',
    ru: 'Управление складами',
  },
  'warehouses.new': {
    tr: 'Yeni Depo',
    az: 'Yeni Anbar',
    ru: 'Новый склад',
  },
  'warehouses.edit': {
    tr: 'Depo Düzenle',
    az: 'Anbarı Redaktə Et',
    ru: 'Редактировать склад',
  },
  'warehouses.name': {
    tr: 'Ad',
    az: 'Ad',
    ru: 'Название',
  },
  'warehouses.code': {
    tr: 'Kod',
    az: 'Kod',
    ru: 'Код',
  },
  'warehouses.location': {
    tr: 'Konum',
    az: 'Məkan',
    ru: 'Расположение',
  },
  'warehouses.locationPlaceholder': {
    tr: 'Örn: 2. kat, raf A',
    az: 'Məs: 2-ci mərtəbə, rəf A',
    ru: 'Напр: 2 этаж, стеллаж A',
  },
  'warehouses.search': {
    tr: 'Depo ara...',
    az: 'Anbar axtar...',
    ru: 'Поиск склада...',
  },
  'warehouses.notFound': {
    tr: 'Depo bulunamadı.',
    az: 'Anbar tapılmadı.',
    ru: 'Склад не найден.',
  },
  'warehouses.countsFound': {
    tr: 'sayım bulundu',
    az: 'sayım tapıldı',
    ru: 'подсчётов найдено',
  },
  'warehouses.noCountsForWarehouse': {
    tr: 'Bu depoya ait sayım yok',
    az: 'Bu anbara aid sayım yoxdur',
    ru: 'Нет подсчётов для этого склада',
  },

  // ══════════════════════════════════════
  // KULLANICILAR
  // ══════════════════════════════════════
  'users.title': {
    tr: 'Kullanıcı Yönetimi',
    az: 'İstifadəçi İdarəetməsi',
    ru: 'Управление пользователями',
  },
  'users.new': {
    tr: 'Yeni Kullanıcı',
    az: 'Yeni İstifadəçi',
    ru: 'Новый пользователь',
  },
  'users.fullName': {
    tr: 'Ad Soyad',
    az: 'Ad Soyad',
    ru: 'ФИО',
  },
  'users.email': {
    tr: 'E-posta',
    az: 'E-poçt',
    ru: 'Электронная почта',
  },
  'users.password': {
    tr: 'Şifre',
    az: 'Şifrə',
    ru: 'Пароль',
  },
  'users.phone': {
    tr: 'Telefon',
    az: 'Telefon',
    ru: 'Телефон',
  },
  'users.role': {
    tr: 'Rol',
    az: 'Rol',
    ru: 'Роль',
  },
  'users.admin': {
    tr: 'Yönetici',
    az: 'İdarəçi',
    ru: 'Администратор',
  },
  'users.user': {
    tr: 'Kullanıcı',
    az: 'İstifadəçi',
    ru: 'Пользователь',
  },
  'users.search': {
    tr: 'Kullanıcı ara...',
    az: 'İstifadəçi axtar...',
    ru: 'Поиск пользователя...',
  },
  'users.notFound': {
    tr: 'Kullanıcı bulunamadı.',
    az: 'İstifadəçi tapılmadı.',
    ru: 'Пользователь не найден.',
  },
  'users.noBusinessAssigned': {
    tr: 'İşletme atanmamış',
    az: 'Müəssisə təyin edilməyib',
    ru: 'Предприятие не назначено',
  },
  'users.showBusinesses': {
    tr: 'İşletmeleri göster',
    az: 'Müəssisələri göstər',
    ru: 'Показать предприятия',
  },
  'users.selectAll': {
    tr: 'Tümünü Seç',
    az: 'Hamısını Seç',
    ru: 'Выбрать все',
  },
  'users.newPassword': {
    tr: 'Yeni Şifre',
    az: 'Yeni Şifrə',
    ru: 'Новый пароль',
  },
  'users.newPasswordHint': {
    tr: 'boş bırakılırsa değişmez',
    az: 'boş qalsa dəyişməz',
    ru: 'оставьте пустым, чтобы не менять',
  },
  'users.minChars': {
    tr: 'En az {n} karakter',
    az: 'Ən azı {n} simvol',
    ru: 'Минимум {n} символов',
  },
  'users.deactivateTitle': {
    tr: 'Kullanıcıyı Pasife Al',
    az: 'İstifadəçini Deaktiv Et',
    ru: 'Деактивировать пользователя',
  },
  'users.deactivateConsequences': {
    tr: 'Bu işlemin sonuçları:',
    az: 'Bu əməliyyatın nəticələri:',
    ru: 'Последствия этой операции:',
  },
  'users.deactivate.noLogin': {
    tr: 'Kullanıcı sisteme giriş yapamaz',
    az: 'İstifadəçi sistemə daxil ola bilməz',
    ru: 'Пользователь не сможет войти в систему',
  },
  'users.deactivate.sessionEnd': {
    tr: 'Mevcut oturumu anında sonlandırılır',
    az: 'Cari sessiyası dərhal dayandırılır',
    ru: 'Текущая сессия немедленно завершается',
  },
  'users.deactivate.permsSuspended': {
    tr: 'Tüm yetkiler askıya alınır',
    az: 'Bütün icazələr dayandırılır',
    ru: 'Все разрешения приостанавливаются',
  },
  'users.activateTitle': {
    tr: 'Kullanıcıyı Aktife Al',
    az: 'İstifadəçini Aktiv Et',
    ru: 'Активировать пользователя',
  },
  'users.activateInfo': {
    tr: 'Aktife alınca ne olur?',
    az: 'Aktiv edildikdə nə baş verir?',
    ru: 'Что произойдёт при активации?',
  },
  'users.activate.canLogin': {
    tr: 'Kullanıcı sisteme tekrar giriş yapabilir',
    az: 'İstifadəçi sistemə yenidən daxil ola bilər',
    ru: 'Пользователь снова сможет войти в систему',
  },
  'users.activate.permsRestore': {
    tr: 'Tüm yetkileri yeniden devreye girer',
    az: 'Bütün icazələri yenidən aktivləşir',
    ru: 'Все разрешения будут восстановлены',
  },
  'users.activate.unblocked': {
    tr: 'Hesap engeli kaldırılır',
    az: 'Hesab bloku götürülür',
    ru: 'Блокировка аккаунта снимается',
  },
  'users.creating': {
    tr: 'Oluşturuluyor...',
    az: 'Yaradılır...',
    ru: 'Создание...',
  },
  'users.create': {
    tr: 'Oluştur',
    az: 'Yarat',
    ru: 'Создать',
  },

  // ══════════════════════════════════════
  // ÜRÜNLER
  // ══════════════════════════════════════
  'products.title': {
    tr: 'Ürün Yönetimi',
    az: 'Məhsul İdarəetməsi',
    ru: 'Управление товарами',
  },
  'products.new': {
    tr: 'Yeni Ürün',
    az: 'Yeni Məhsul',
    ru: 'Новый товар',
  },
  'products.edit': {
    tr: 'Ürün Düzenle',
    az: 'Məhsulu Redaktə Et',
    ru: 'Редактировать товар',
  },
  'products.code': {
    tr: 'Ürün Kodu',
    az: 'Məhsul Kodu',
    ru: 'Код товара',
  },
  'products.codePlaceholder': {
    tr: 'Örn: SHK001',
    az: 'Məs: SHK001',
    ru: 'Напр: SHK001',
  },
  'products.name': {
    tr: 'Ürün Adı',
    az: 'Məhsul Adı',
    ru: 'Название товара',
  },
  'products.namePlaceholder': {
    tr: 'Örn: Şeker 1 KG',
    az: 'Məs: Şəkər 1 KQ',
    ru: 'Напр: Сахар 1 КГ',
  },
  'products.secondName': {
    tr: 'İkinci İsim',
    az: 'İkinci Ad',
    ru: 'Второе название',
  },
  'products.secondNameHint': {
    tr: 'opsiyonel',
    az: 'ixtiyari',
    ru: 'необязательно',
  },
  'products.secondNamePlaceholder': {
    tr: 'Örn: Sugar 1 KG',
    az: 'Məs: Sugar 1 KG',
    ru: 'Напр: Sugar 1 KG',
  },
  'products.unit': {
    tr: 'Birim',
    az: 'Vahid',
    ru: 'Единица',
  },
  'products.barcodes': {
    tr: 'Barkodlar',
    az: 'Barkodlar',
    ru: 'Штрих-коды',
  },
  'products.barcodePlaceholder': {
    tr: 'Barkod girin, Enter ile ekleyin',
    az: 'Barkod daxil edin, Enter ilə əlavə edin',
    ru: 'Введите штрих-код, нажмите Enter для добавления',
  },
  'products.search': {
    tr: 'Ürün adı, kod veya barkod...',
    az: 'Məhsul adı, kod və ya barkod...',
    ru: 'Название товара, код или штрих-код...',
  },
  'products.totalProducts': {
    tr: 'Toplam Ürün',
    az: 'Ümumi Məhsul',
    ru: 'Всего товаров',
  },
  'products.thisPage': {
    tr: 'Bu Sayfada',
    az: 'Bu Səhifədə',
    ru: 'На этой странице',
  },
  'products.notFound': {
    tr: 'Henüz ürün yok. İlk ürünü ekleyin.',
    az: 'Hələ məhsul yoxdur. İlk məhsulu əlavə edin.',
    ru: 'Товаров пока нет. Добавьте первый товар.',
  },
  'products.searchNotFound': {
    tr: 'için sonuç bulunamadı.',
    az: 'üçün nəticə tapılmadı.',
    ru: 'результатов не найдено.',
  },
  'products.delete': {
    tr: 'Ürünü Sil',
    az: 'Məhsulu Sil',
    ru: 'Удалить товар',
  },
  'products.deleteConfirm': {
    tr: 'Bu ürün pasife alınacak. Emin misiniz?',
    az: 'Bu məhsul deaktiv ediləcək. Əminsiniz?',
    ru: 'Этот товар будет деактивирован. Вы уверены?',
  },
  'products.excelUpload': {
    tr: 'Excel Yükle',
    az: 'Excel Yüklə',
    ru: 'Загрузить Excel',
  },
  'products.business': {
    tr: 'İşletme',
    az: 'Müəssisə',
    ru: 'Предприятие',
  },
  'products.businessSelect': {
    tr: 'İşletme seçin...',
    az: 'Müəssisə seçin...',
    ru: 'Выберите предприятие...',
  },

  // ══════════════════════════════════════
  // SAYIMLAR
  // ══════════════════════════════════════
  'counts.title': {
    tr: 'Sayım Yönetimi',
    az: 'Sayım İdarəetməsi',
    ru: 'Управление подсчётами',
  },
  'counts.total': {
    tr: 'Toplam Sayım',
    az: 'Ümumi Sayım',
    ru: 'Всего подсчётов',
  },
  'counts.ongoing': {
    tr: 'Devam Eden',
    az: 'Davam Edən',
    ru: 'В процессе',
  },
  'counts.completed': {
    tr: 'Tamamlanan',
    az: 'Tamamlanan',
    ru: 'Завершённые',
  },
  'counts.search': {
    tr: 'Sayım adı ara...',
    az: 'Sayım adı axtar...',
    ru: 'Поиск подсчёта...',
  },
  'counts.allWarehouses': {
    tr: 'Tüm Depolar',
    az: 'Bütün Anbarlar',
    ru: 'Все склады',
  },
  'counts.allStatuses': {
    tr: 'Tüm Durumlar',
    az: 'Bütün Vəziyyətlər',
    ru: 'Все статусы',
  },
  'counts.notFound': {
    tr: 'Henüz sayım yok.',
    az: 'Hələ sayım yoxdur.',
    ru: 'Подсчётов пока нет.',
  },
  'counts.searchNotFound': {
    tr: 'için sayım bulunamadı.',
    az: 'üçün sayım tapılmadı.',
    ru: 'подсчётов не найдено.',
  },
  'counts.close': {
    tr: 'Sayımı Kapat',
    az: 'Sayımı Bağla',
    ru: 'Закрыть подсчёт',
  },
  'counts.reopen': {
    tr: 'Sayımı Yeniden Aç',
    az: 'Sayımı Yenidən Aç',
    ru: 'Повторно открыть подсчёт',
  },
  'counts.restore': {
    tr: 'Sayımı Geri Al',
    az: 'Sayımı Bərpa Et',
    ru: 'Восстановить подсчёт',
  },
  'counts.restoreConfirm': {
    tr: 'Bu sayım tekrar aktif olacak',
    az: 'Bu sayım yenidən aktiv olacaq',
    ru: 'Этот подсчёт снова станет активным',
  },
  'counts.items': {
    tr: 'kalem',
    az: 'kalem',
    ru: 'позиций',
  },
  'counts.noItems': {
    tr: 'Kalem eklenmemiş',
    az: 'Kalem əlavə edilməyib',
    ru: 'Позиции не добавлены',
  },
  'counts.pdfDownload': {
    tr: 'PDF İndir',
    az: 'PDF Yüklə',
    ru: 'Скачать PDF',
  },
  'counts.excelDownload': {
    tr: 'Excel İndir',
    az: 'Excel Yüklə',
    ru: 'Скачать Excel',
  },
  'counts.countId': {
    tr: 'Sayım ID',
    az: 'Sayım ID',
    ru: 'ID подсчёта',
  },

  // Durum etiketleri
  'status.ongoing': {
    tr: 'Devam Ediyor',
    az: 'Davam Edir',
    ru: 'В процессе',
  },
  'status.completed': {
    tr: 'Tamamlandı',
    az: 'Tamamlandı',
    ru: 'Завершён',
  },
  'status.passive': {
    tr: 'Pasif',
    az: 'Deaktiv',
    ru: 'Неактивный',
  },
  'status.active': {
    tr: 'Aktif',
    az: 'Aktiv',
    ru: 'Активный',
  },

  // ══════════════════════════════════════
  // TOPLANMIŞ SAYIMLAR
  // ══════════════════════════════════════
  'mergedCounts.title': {
    tr: 'Toplanmış Sayımlar',
    az: 'Toplanmış Sayımlar',
    ru: 'Объединённые подсчёты',
  },
  'mergedCounts.badge': {
    tr: 'Toplanmış Sayım',
    az: 'Toplanmış Sayım',
    ru: 'Объединённый подсчёт',
  },
  'mergedCounts.merged': {
    tr: 'sayım toplandı',
    az: 'sayım toplandı',
    ru: 'подсчётов объединено',
  },
  'mergedCounts.editName': {
    tr: 'Sayımı Düzenle',
    az: 'Sayımı Redaktə Et',
    ru: 'Редактировать подсчёт',
  },
  'mergedCounts.countName': {
    tr: 'Sayım İsmi',
    az: 'Sayım Adı',
    ru: 'Название подсчёта',
  },
  'mergedCounts.deleteTitle': {
    tr: 'Toplanmış Sayımı Sil',
    az: 'Toplanmış Sayımı Sil',
    ru: 'Удалить объединённый подсчёт',
  },
  'mergedCounts.deleteWarning': {
    tr: 'Bu işlem geri alınamaz',
    az: 'Bu əməliyyat geri qaytarıla bilməz',
    ru: 'Это действие необратимо',
  },
  'mergedCounts.deleteConfirm': {
    tr: 'silinecek. Orijinal sayımlar etkilenmez.',
    az: 'silinəcək. Orijinal sayımlar təsirlənməz.',
    ru: 'будет удалён. Исходные подсчёты не затрагиваются.',
  },
  'mergedCounts.notFound': {
    tr: 'Henüz toplanmış sayım yok.',
    az: 'Hələ toplanmış sayım yoxdur.',
    ru: 'Объединённых подсчётов пока нет.',
  },
  'mergedCounts.searchNotFound': {
    tr: 'için toplanmış sayım bulunamadı.',
    az: 'üçün toplanmış sayım tapılmadı.',
    ru: 'объединённых подсчётов не найдено.',
  },
  'mergedCounts.sourceDetails': {
    tr: 'Toplanan sayımların detayları',
    az: 'Toplanan sayımların detalları',
    ru: 'Детали объединённых подсчётов',
  },
  'mergedCounts.sourceNotFound': {
    tr: 'Kaynak bilgisi bulunamadı',
    az: 'Mənbə məlumatı tapılmadı',
    ru: 'Информация об источнике не найдена',
  },
  'mergedCounts.itemsNotFound': {
    tr: 'Kalem bulunamadı',
    az: 'Kalem tapılmadı',
    ru: 'Позиции не найдены',
  },

  // ══════════════════════════════════════
  // ROLLER
  // ══════════════════════════════════════
  'roles.title': {
    tr: 'Rol Yönetimi',
    az: 'Rol İdarəetməsi',
    ru: 'Управление ролями',
  },
  'roles.new': {
    tr: 'Yeni Rol',
    az: 'Yeni Rol',
    ru: 'Новая роль',
  },
  'roles.createTitle': {
    tr: 'Yeni Rol Oluştur',
    az: 'Yeni Rol Yarat',
    ru: 'Создать новую роль',
  },
  'roles.name': {
    tr: 'Rol Adı',
    az: 'Rol Adı',
    ru: 'Название роли',
  },
  'roles.namePlaceholder': {
    tr: 'Örn: Depo Sorumlusu, Muhasebeci...',
    az: 'Məs: Anbar Məsulu, Mühasib...',
    ru: 'Напр: Кладовщик, Бухгалтер...',
  },
  'roles.permissions': {
    tr: 'Yetkiler',
    az: 'İcazələr',
    ru: 'Разрешения',
  },
  'roles.totalRoles': {
    tr: 'Toplam Rol',
    az: 'Ümumi Rol',
    ru: 'Всего ролей',
  },
  'roles.customRole': {
    tr: 'Özel Rol',
    az: 'Xüsusi Rol',
    ru: 'Пользовательская роль',
  },
  'roles.systemRole': {
    tr: 'Sistem rolü',
    az: 'Sistem rolu',
    ru: 'Системная роль',
  },
  'roles.systemRoleNoChange': {
    tr: 'Sistem rolü • Değiştirilemez',
    az: 'Sistem rolu • Dəyişdirilə bilməz',
    ru: 'Системная роль • Нельзя изменить',
  },
  'roles.adminFullAccess': {
    tr: 'Yönetici rolü tüm işlemlere tam erişime sahiptir. Bu rol değiştirilemez ve silinemez.',
    az: 'İdarəçi rolu bütün əməliyyatlara tam girişə malikdir. Bu rol dəyişdirilə və silinə bilməz.',
    ru: 'Роль администратора имеет полный доступ ко всем операциям. Эту роль нельзя изменить или удалить.',
  },
  'roles.systemRoleInfo': {
    tr: 'Sistem rolü — yetki matrisini düzenleyebilirsiniz. Ad değiştirilemez.',
    az: 'Sistem rolu — icazə matrisini redaktə edə bilərsiniz. Ad dəyişdirilə bilməz.',
    ru: 'Системная роль — можно редактировать матрицу разрешений. Название изменить нельзя.',
  },
  'roles.customRoleInfo': {
    tr: 'Özel rol — yetki matrisini ve adını düzenleyebilirsiniz.',
    az: 'Xüsusi rol — icazə matrisini və adını redaktə edə bilərsiniz.',
    ru: 'Пользовательская роль — можно редактировать матрицу разрешений и название.',
  },
  'roles.usersInRole': {
    tr: 'Bu Roldeki Kullanıcılar',
    az: 'Bu Roldakı İstifadəçilər',
    ru: 'Пользователи с этой ролью',
  },
  'roles.deleteTitle': {
    tr: 'Rolü Sil',
    az: 'Rolu Sil',
    ru: 'Удалить роль',
  },
  'roles.deleteSubtitle': {
    tr: 'Bu rol kalıcı olarak silinecek',
    az: 'Bu rol qalıcı olaraq silinəcək',
    ru: 'Эта роль будет удалена навсегда',
  },
  'roles.noUsersAssigned': {
    tr: 'Bu role atanmış kullanıcı yok.',
    az: 'Bu rola təyin edilmiş istifadəçi yoxdur.',
    ru: 'К этой роли не назначены пользователи.',
  },
  'roles.safeToDelete': {
    tr: 'Rol güvenle silinebilir.',
    az: 'Rol təhlükəsiz silinə bilər.',
    ru: 'Роль можно безопасно удалить.',
  },
  'roles.usersWillLosePerms': {
    tr: 'kullanıcı atanmış. Yeni bir rol seçmezseniz tüm yetkileri kaldırılacak.',
    az: 'istifadəçi təyin edilib. Yeni rol seçməsəniz bütün icazələri silinəcək.',
    ru: 'пользователей назначено. Если не выбрать новую роль, все разрешения будут удалены.',
  },
  'roles.allPermsRemoved': {
    tr: 'kullanıcının tüm yetkileri kaldırılacak.',
    az: 'istifadəçinin bütün icazələri silinəcək.',
    ru: 'все разрешения пользователей будут удалены.',
  },
  'roles.selectRole': {
    tr: 'Rol seçilmedi',
    az: 'Rol seçilmədi',
    ru: 'Роль не выбрана',
  },
  'roles.templateInfo': {
    tr: 'Özel roller yetki şablonu olarak kullanılır. Kullanıcı düzenleme ekranında bir işletmeye atama yaparken bu şablonlardan birini seçerek yetkileri otomatik doldurabilirsiniz.',
    az: 'Xüsusi rollar icazə şablonu olaraq istifadə olunur. İstifadəçi redaktə ekranında müəssisəyə təyinat edərkən bu şablonlardan birini seçərək icazələri avtomatik doldura bilərsiniz.',
    ru: 'Пользовательские роли используются как шаблоны разрешений. При назначении пользователя на предприятие можно выбрать один из этих шаблонов для автоматического заполнения разрешений.',
  },

  // ══════════════════════════════════════
  // YETKİ KATEGORİLERİ / İŞLEMLER
  // ══════════════════════════════════════
  'perm.products': {
    tr: 'Ürünler',
    az: 'Məhsullar',
    ru: 'Товары',
  },
  'perm.warehouses': {
    tr: 'Depolar',
    az: 'Anbarlar',
    ru: 'Склады',
  },
  'perm.counts': {
    tr: 'Sayım',
    az: 'Sayım',
    ru: 'Подсчёт',
  },
  'perm.mergedCounts': {
    tr: 'Toplanmış Sayımlar',
    az: 'Toplanmış Sayımlar',
    ru: 'Объединённые подсчёты',
  },
  'perm.view': {
    tr: 'Görüntüle',
    az: 'Bax',
    ru: 'Просмотр',
  },
  'perm.add': {
    tr: 'Ekle',
    az: 'Əlavə Et',
    ru: 'Добавить',
  },
  'perm.edit': {
    tr: 'Düzenle',
    az: 'Redaktə Et',
    ru: 'Редактировать',
  },
  'perm.delete': {
    tr: 'Sil',
    az: 'Sil',
    ru: 'Удалить',
  },

  // ══════════════════════════════════════
  // AYARLAR
  // ══════════════════════════════════════
  'settings.title': {
    tr: 'Ayarlar',
    az: 'Parametrlər',
    ru: 'Настройки',
  },
  'settings.emailUpdate': {
    tr: 'E-posta Güncelle',
    az: 'E-poçtu Yenilə',
    ru: 'Обновить email',
  },
  'settings.currentEmail': {
    tr: 'Mevcut E-posta',
    az: 'Cari E-poçt',
    ru: 'Текущий email',
  },
  'settings.newEmail': {
    tr: 'Yeni E-posta',
    az: 'Yeni E-poçt',
    ru: 'Новый email',
  },
  'settings.newEmailPlaceholder': {
    tr: 'yeni@email.com',
    az: 'yeni@email.com',
    ru: 'new@email.com',
  },
  'settings.passwordUpdate': {
    tr: 'Şifre Güncelle',
    az: 'Şifrəni Yenilə',
    ru: 'Обновить пароль',
  },
  'settings.oldPassword': {
    tr: 'Eski Şifre',
    az: 'Köhnə Şifrə',
    ru: 'Старый пароль',
  },
  'settings.oldPasswordPlaceholder': {
    tr: 'Eski şifreniz',
    az: 'Köhnə şifrəniz',
    ru: 'Ваш старый пароль',
  },
  'settings.newPassword': {
    tr: 'Yeni Şifre',
    az: 'Yeni Şifrə',
    ru: 'Новый пароль',
  },
  'settings.newPasswordPlaceholder': {
    tr: 'Yeni şifreniz',
    az: 'Yeni şifrəniz',
    ru: 'Ваш новый пароль',
  },
  'settings.confirmPassword': {
    tr: 'Şifre Tekrar',
    az: 'Şifrə Təkrar',
    ru: 'Повтор пароля',
  },
  'settings.confirmPasswordPlaceholder': {
    tr: 'Yeni şifre tekrar',
    az: 'Yeni şifrə təkrar',
    ru: 'Повторите новый пароль',
  },
  'settings.passwordMismatch': {
    tr: 'Şifreler eşleşmiyor',
    az: 'Şifrələr uyğun gəlmir',
    ru: 'Пароли не совпадают',
  },
  'settings.passwordTooShort': {
    tr: 'Şifre en az 8 karakter olmalı',
    az: 'Şifrə ən azı 8 simvol olmalıdır',
    ru: 'Пароль должен быть не менее 8 символов',
  },
  'settings.language': {
    tr: 'Dil',
    az: 'Dil',
    ru: 'Язык',
  },
  'settings.languageDesc': {
    tr: 'Arayüz dilini seçin',
    az: 'İnterfeys dilini seçin',
    ru: 'Выберите язык интерфейса',
  },

  // ══════════════════════════════════════
  // ORTAK EYLEMLER
  // ══════════════════════════════════════
  'action.save': {
    tr: 'Kaydet',
    az: 'Saxla',
    ru: 'Сохранить',
  },
  'action.saving': {
    tr: 'Kaydediliyor...',
    az: 'Saxlanılır...',
    ru: 'Сохранение...',
  },
  'action.saved': {
    tr: 'Kaydedildi',
    az: 'Saxlanıldı',
    ru: 'Сохранено',
  },
  'action.cancel': {
    tr: 'İptal',
    az: 'Ləğv Et',
    ru: 'Отмена',
  },
  'action.close': {
    tr: 'Kapat',
    az: 'Bağla',
    ru: 'Закрыть',
  },
  'action.edit': {
    tr: 'Düzenle',
    az: 'Redaktə Et',
    ru: 'Редактировать',
  },
  'action.delete': {
    tr: 'Sil',
    az: 'Sil',
    ru: 'Удалить',
  },
  'action.add': {
    tr: 'Ekle',
    az: 'Əlavə Et',
    ru: 'Добавить',
  },
  'action.update': {
    tr: 'Güncelle',
    az: 'Yenilə',
    ru: 'Обновить',
  },
  'action.reset': {
    tr: 'Sıfırla',
    az: 'Sıfırla',
    ru: 'Сбросить',
  },
  'action.confirm': {
    tr: 'Onayla',
    az: 'Təsdiqlə',
    ru: 'Подтвердить',
  },
  'action.back': {
    tr: 'Geri',
    az: 'Geri',
    ru: 'Назад',
  },
  'action.giveUp': {
    tr: 'Vazgeç',
    az: 'İmtina Et',
    ru: 'Отказаться',
  },
  'action.yesDeactivate': {
    tr: 'Evet, Pasife Al',
    az: 'Bəli, Deaktiv Et',
    ru: 'Да, деактивировать',
  },
  'action.yesActivate': {
    tr: 'Evet, Aktife Al',
    az: 'Bəli, Aktiv Et',
    ru: 'Да, активировать',
  },
  'action.yesDelete': {
    tr: 'Evet, Sil',
    az: 'Bəli, Sil',
    ru: 'Да, удалить',
  },
  'action.restore': {
    tr: 'Geri Al',
    az: 'Bərpa Et',
    ru: 'Восстановить',
  },
  'action.deactivate': {
    tr: 'Pasifleştir',
    az: 'Deaktiv Et',
    ru: 'Деактивировать',
  },
  'action.activate': {
    tr: 'Aktifleştir',
    az: 'Aktiv Et',
    ru: 'Активировать',
  },
  'action.pdf': {
    tr: 'PDF',
    az: 'PDF',
    ru: 'PDF',
  },
  'action.excel': {
    tr: 'Excel',
    az: 'Excel',
    ru: 'Excel',
  },
  'action.create': {
    tr: 'Oluştur',
    az: 'Yarat',
    ru: 'Создать',
  },

  // ══════════════════════════════════════
  // FİLTRELER
  // ══════════════════════════════════════
  'filter.all': {
    tr: 'Tümü',
    az: 'Hamısı',
    ru: 'Все',
  },
  'filter.active': {
    tr: 'Aktif',
    az: 'Aktiv',
    ru: 'Активные',
  },
  'filter.passive': {
    tr: 'Pasif',
    az: 'Deaktiv',
    ru: 'Неактивные',
  },
  'filter.allBusinesses': {
    tr: 'Tüm İşletmeler',
    az: 'Bütün Müəssisələr',
    ru: 'Все предприятия',
  },

  // ══════════════════════════════════════
  // İSTATİSTİK
  // ══════════════════════════════════════
  'stat.total': {
    tr: 'Toplam',
    az: 'Ümumi',
    ru: 'Всего',
  },
  'stat.active': {
    tr: 'Aktif',
    az: 'Aktiv',
    ru: 'Активных',
  },
  'stat.passive': {
    tr: 'Pasif',
    az: 'Deaktiv',
    ru: 'Неактивных',
  },
  'stat.business': {
    tr: 'İşletme',
    az: 'Müəssisə',
    ru: 'Предприятие',
  },
  'stat.totalWarehouse': {
    tr: 'Toplam Depo',
    az: 'Ümumi Anbar',
    ru: 'Всего складов',
  },

  // ══════════════════════════════════════
  // TABLO BAŞLIKLARI
  // ══════════════════════════════════════
  'table.productCode': {
    tr: 'Ürün Kodu',
    az: 'Məhsul Kodu',
    ru: 'Код товара',
  },
  'table.productName': {
    tr: 'Ürün Adı',
    az: 'Məhsul Adı',
    ru: 'Название товара',
  },
  'table.secondName': {
    tr: 'İkinci İsim',
    az: 'İkinci Ad',
    ru: 'Второе название',
  },
  'table.barcode': {
    tr: 'Barkod',
    az: 'Barkod',
    ru: 'Штрих-код',
  },
  'table.unit': {
    tr: 'Birim',
    az: 'Vahid',
    ru: 'Единица',
  },
  'table.quantity': {
    tr: 'Miktar',
    az: 'Miqdar',
    ru: 'Количество',
  },
  'table.status': {
    tr: 'Durum',
    az: 'Vəziyyət',
    ru: 'Статус',
  },
  'table.passiveProduct': {
    tr: 'Pasif Ürün',
    az: 'Deaktiv Məhsul',
    ru: 'Неактивный товар',
  },
  'table.business': {
    tr: 'İşletme',
    az: 'Müəssisə',
    ru: 'Предприятие',
  },
  'table.warehouse': {
    tr: 'Depo',
    az: 'Anbar',
    ru: 'Склад',
  },
  'table.date': {
    tr: 'Tarih',
    az: 'Tarix',
    ru: 'Дата',
  },
  'table.user': {
    tr: 'Kullanıcı',
    az: 'İstifadəçi',
    ru: 'Пользователь',
  },
  'table.sourceWarehouses': {
    tr: 'Kaynak Depolar',
    az: 'Mənbə Anbarlar',
    ru: 'Исходные склады',
  },
  'table.notes': {
    tr: 'Notlar',
    az: 'Qeydlər',
    ru: 'Заметки',
  },
  'table.collected': {
    tr: 'Toplanan',
    az: 'Toplanan',
    ru: 'Объединено',
  },

  // ══════════════════════════════════════
  // TOAST MESAJLARI
  // ══════════════════════════════════════
  'toast.updated': {
    tr: 'Güncellendi.',
    az: 'Yeniləndi.',
    ru: 'Обновлено.',
  },
  'toast.added': {
    tr: 'Eklendi.',
    az: 'Əlavə edildi.',
    ru: 'Добавлено.',
  },
  'toast.error': {
    tr: 'Hata.',
    az: 'Xəta.',
    ru: 'Ошибка.',
  },
  'toast.deactivated': {
    tr: 'Pasife alındı.',
    az: 'Deaktiv edildi.',
    ru: 'Деактивировано.',
  },
  'toast.activated': {
    tr: 'Aktife alındı.',
    az: 'Aktiv edildi.',
    ru: 'Активировано.',
  },
  'toast.loadFailed': {
    tr: 'Veriler yüklenemedi.',
    az: 'Məlumatlar yüklənə bilmədi.',
    ru: 'Не удалось загрузить данные.',
  },
  'toast.restored': {
    tr: 'Geri alındı.',
    az: 'Bərpa edildi.',
    ru: 'Восстановлено.',
  },
  'toast.restoreFailed': {
    tr: 'Geri alma başarısız.',
    az: 'Bərpa uğursuz oldu.',
    ru: 'Восстановление не удалось.',
  },
  'toast.operationFailed': {
    tr: 'İşlem başarısız.',
    az: 'Əməliyyat uğursuz oldu.',
    ru: 'Операция не удалась.',
  },
  'toast.saveFailed': {
    tr: 'Kayıt başarısız.',
    az: 'Saxlama uğursuz oldu.',
    ru: 'Сохранение не удалось.',
  },
  'toast.createFailed': {
    tr: 'Oluşturulamadı.',
    az: 'Yaradıla bilmədi.',
    ru: 'Не удалось создать.',
  },
  'toast.deleteFailed': {
    tr: 'Silinemedi.',
    az: 'Silinə bilmədi.',
    ru: 'Не удалось удалить.',
  },
  'toast.updateFailed': {
    tr: 'Güncelleme başarısız.',
    az: 'Yeniləmə uğursuz oldu.',
    ru: 'Обновление не удалось.',
  },
  'toast.resetToDefault': {
    tr: 'Varsayılana sıfırlandı.',
    az: 'Standart dəyərlərə sıfırlandı.',
    ru: 'Сброшено до значений по умолчанию.',
  },
  'toast.pdfFailed': {
    tr: 'PDF oluşturulamadı.',
    az: 'PDF yaradıla bilmədi.',
    ru: 'Не удалось создать PDF.',
  },
  'toast.excelFailed': {
    tr: 'Excel oluşturulamadı.',
    az: 'Excel yaradıla bilmədi.',
    ru: 'Не удалось создать Excel.',
  },
  'toast.emailUpdated': {
    tr: 'E-posta güncellendi',
    az: 'E-poçt yeniləndi',
    ru: 'Email обновлён',
  },
  'toast.emailUpdateFailed': {
    tr: 'E-posta güncellenemedi',
    az: 'E-poçt yenilənə bilmədi',
    ru: 'Не удалось обновить email',
  },
  'toast.passwordUpdated': {
    tr: 'Şifre güncellendi',
    az: 'Şifrə yeniləndi',
    ru: 'Пароль обновлён',
  },
  'toast.passwordUpdateFailed': {
    tr: 'Şifre güncellenemedi',
    az: 'Şifrə yenilənə bilmədi',
    ru: 'Не удалось обновить пароль',
  },
  'toast.passwordMinLength': {
    tr: 'Şifre en az 8 karakter olmalıdır.',
    az: 'Şifrə ən azı 8 simvol olmalıdır.',
    ru: 'Пароль должен быть не менее 8 символов.',
  },
  'toast.nameUpdated': {
    tr: 'İsim güncellendi',
    az: 'Ad yeniləndi',
    ru: 'Название обновлено',
  },
  'toast.deleted': {
    tr: 'Silindi.',
    az: 'Silindi.',
    ru: 'Удалено.',
  },
  'toast.countClosed': {
    tr: 'Sayım kapatıldı.',
    az: 'Sayım bağlandı.',
    ru: 'Подсчёт закрыт.',
  },
  'toast.countReopened': {
    tr: 'Sayım yeniden açıldı.',
    az: 'Sayım yenidən açıldı.',
    ru: 'Подсчёт повторно открыт.',
  },
  'toast.selectBusiness': {
    tr: 'İşletme seçiniz.',
    az: 'Müəssisə seçin.',
    ru: 'Выберите предприятие.',
  },
  'toast.selectFile': {
    tr: 'Dosya seçiniz.',
    az: 'Fayl seçin.',
    ru: 'Выберите файл.',
  },
  'toast.fileReadFailed': {
    tr: 'Dosya okunamadı.',
    az: 'Fayl oxuna bilmədi.',
    ru: 'Не удалось прочитать файл.',
  },
  'toast.templateFailed': {
    tr: 'Şablon indirilemedi.',
    az: 'Şablon yüklənə bilmədi.',
    ru: 'Не удалось скачать шаблон.',
  },
  'toast.productCodeRequired': {
    tr: 'Ürün kodu ve adı zorunludur.',
    az: 'Məhsul kodu və adı tələb olunur.',
    ru: 'Код и название товара обязательны.',
  },
  'toast.usersLoadFailed': {
    tr: 'Atanmış kullanıcılar yüklenemedi.',
    az: 'Təyin edilmiş istifadəçilər yüklənə bilmədi.',
    ru: 'Не удалось загрузить назначенных пользователей.',
  },
  'toast.roleNameRequired': {
    tr: 'Rol adı zorunludur.',
    az: 'Rol adı tələb olunur.',
    ru: 'Название роли обязательно.',
  },

  // kullanıcı işlem toast
  'toast.userCreated': {
    tr: 'Kullanıcı oluşturuldu.',
    az: 'İstifadəçi yaradıldı.',
    ru: 'Пользователь создан.',
  },
  'toast.userUpdated': {
    tr: 'Kullanıcı güncellendi.',
    az: 'İstifadəçi yeniləndi.',
    ru: 'Пользователь обновлён.',
  },
  'toast.userDeactivated': {
    tr: 'Kullanıcı pasife alındı.',
    az: 'İstifadəçi deaktiv edildi.',
    ru: 'Пользователь деактивирован.',
  },
  'toast.userActivated': {
    tr: 'Kullanıcı aktife alındı.',
    az: 'İstifadəçi aktiv edildi.',
    ru: 'Пользователь активирован.',
  },
  'toast.userRestored': {
    tr: 'Kullanıcı geri alındı.',
    az: 'İstifadəçi bərpa edildi.',
    ru: 'Пользователь восстановлен.',
  },

  // ürün işlem toast
  'toast.productAdded': {
    tr: 'Ürün eklendi.',
    az: 'Məhsul əlavə edildi.',
    ru: 'Товар добавлен.',
  },
  'toast.productUpdated': {
    tr: 'Ürün güncellendi.',
    az: 'Məhsul yeniləndi.',
    ru: 'Товар обновлён.',
  },
  'toast.productDeleted': {
    tr: 'Ürün silindi.',
    az: 'Məhsul silindi.',
    ru: 'Товар удалён.',
  },
  'toast.productRestored': {
    tr: 'Ürün geri alındı.',
    az: 'Məhsul bərpa edildi.',
    ru: 'Товар восстановлен.',
  },

  // sayım işlem toast
  'toast.countRestored': {
    tr: 'Sayım geri alındı.',
    az: 'Sayım bərpa edildi.',
    ru: 'Подсчёт восстановлен.',
  },
  'toast.countDeleted': {
    tr: 'Sayım silindi.',
    az: 'Sayım silindi.',
    ru: 'Подсчёт удалён.',
  },

  // depo işlem toast
  'toast.warehouseRestored': {
    tr: 'Depo geri alındı.',
    az: 'Anbar bərpa edildi.',
    ru: 'Склад восстановлен.',
  },

  // rol işlem toast
  'toast.roleCreated': {
    tr: 'rolü oluşturuldu.',
    az: 'rolu yaradıldı.',
    ru: 'роль создана.',
  },
  'toast.rolePermsSaved': {
    tr: 'yetkiler kaydedildi.',
    az: 'icazələr saxlanıldı.',
    ru: 'разрешения сохранены.',
  },
  'toast.roleDeleted': {
    tr: 'rolü silindi.',
    az: 'rolu silindi.',
    ru: 'роль удалена.',
  },

  // ══════════════════════════════════════
  // DİKKAT / UYARI
  // ══════════════════════════════════════
  'warning.attention': {
    tr: '⚠️ Dikkat',
    az: '⚠️ Diqqət',
    ru: '⚠️ Внимание',
  },
  'warning.confirm': {
    tr: '✓ Aktifleştir',
    az: '✓ Aktiv Et',
    ru: '✓ Активировать',
  },

  // ══════════════════════════════════════
  // DİL İSİMLERİ
  // ══════════════════════════════════════
  'lang.tr': {
    tr: 'Türkçe',
    az: 'Türkcə',
    ru: 'Турецкий',
  },
  'lang.az': {
    tr: 'Azerbaycanca',
    az: 'Azərbaycanca',
    ru: 'Азербайджанский',
  },
  'lang.ru': {
    tr: 'Rusça',
    az: 'Rusca',
    ru: 'Русский',
  },

  // ══════════════════════════════════════
  // ZORUNLU ALAN İŞARETLERİ
  // ══════════════════════════════════════
  'field.required': {
    tr: '*',
    az: '*',
    ru: '*',
  },
  'field.select': {
    tr: 'Seçin...',
    az: 'Seçin...',
    ru: 'Выберите...',
  },

  // ══════════════════════════════════════
  // SAYFALAMA
  // ══════════════════════════════════════
  'table.id': {
    tr: 'ID',
    az: 'ID',
    ru: 'ID',
  },
  'pagination.total': {
    tr: 'Toplam',
    az: 'Cəmi',
    ru: 'Всего',
  },
  'pagination.showing': {
    tr: 'Bu Sayfada',
    az: 'Bu Səhifədə',
    ru: 'На странице',
  },
  'pagination.page': {
    tr: 'Sayfa',
    az: 'Səhifə',
    ru: 'Страница',
  },
  'pagination.of': {
    tr: '/',
    az: '/',
    ru: '/',
  },

  // ══════════════════════════════════════
  // EKSİK KEY'LER — QA TESTİ SONRASI
  // ══════════════════════════════════════

  // ── Roller Sayfası Ek ──
  'action.create': {
    tr: 'Oluştur',
    az: 'Yarat',
    ru: 'Создать',
  },
  'action.reset': {
    tr: 'Sıfırla',
    az: 'Sıfırla',
    ru: 'Сбросить',
  },
  'action.close': {
    tr: 'Kapat',
    az: 'Bağla',
    ru: 'Закрыть',
  },
  'toast.saved': {
    tr: 'Kaydedildi',
    az: 'Saxlanıldı',
    ru: 'Сохранено',
  },
  'toast.createFailed': {
    tr: 'Oluşturulamadı.',
    az: 'Yaradıla bilmədi.',
    ru: 'Не удалось создать.',
  },
  'toast.saveFailed': {
    tr: 'Kayıt başarısız.',
    az: 'Saxlama uğursuz.',
    ru: 'Сохранение не удалось.',
  },
  'roles.deleteSubtitle': {
    tr: 'Bu rol kalıcı olarak silinecek.',
    az: 'Bu rol həmişəlik silinəcək.',
    ru: 'Эта роль будет удалена навсегда.',
  },
  'roles.noUsersAssigned': {
    tr: 'Bu role atanmış kullanıcı yok.',
    az: 'Bu rola təyin edilmiş istifadəçi yoxdur.',
    ru: 'Нет пользователей, назначенных на эту роль.',
  },
  'roles.safeToDelete': {
    tr: 'Bu rolü güvenle silebilirsiniz.',
    az: 'Bu rolu təhlükəsiz silə bilərsiniz.',
    ru: 'Вы можете безопасно удалить эту роль.',
  },
  'roles.usersWillLosePerms': {
    tr: 'Bu kullanıcılar rol şablonunu kaybedecek:',
    az: 'Bu istifadəçilər rol şablonunu itirəcək:',
    ru: 'Эти пользователи потеряют шаблон роли:',
  },
  'roles.confirmDelete': {
    tr: 'Evet, Sil',
    az: 'Bəli, Sil',
    ru: 'Да, удалить',
  },

  // ── Kullanıcılar Sayfası Ek ──
  'users.panelAccess': {
    tr: 'Panel Erişimi',
    az: 'Panel Girişi',
    ru: 'Доступ к панели',
  },
  'users.businessAssignments': {
    tr: 'İşletme Atamaları',
    az: 'Müəssisə Təyinatları',
    ru: 'Назначения предприятий',
  },
  'users.noAssignments': {
    tr: 'Henüz atama yok',
    az: 'Hələ təyinat yoxdur',
    ru: 'Назначений пока нет',
  },
  'users.addBusinessPlaceholder': {
    tr: 'İşletme ekle...',
    az: 'Müəssisə əlavə et...',
    ru: 'Добавить предприятие...',
  },
  'users.noResults': {
    tr: 'Sonuç yok',
    az: 'Nəticə yoxdur',
    ru: 'Нет результатов',
  },

  // ── Depolar Sayfası Ek ──
  'action.selectAll': {
    tr: 'Tümünü Seç',
    az: 'Hamısını Seç',
    ru: 'Выбрать все',
  },
  'products.code': {
    tr: 'Ürün Kodu',
    az: 'Məhsul Kodu',
    ru: 'Код товара',
  },
  'products.altName': {
    tr: 'İkinci İsim',
    az: 'İkinci Ad',
    ru: 'Второе название',
  },
  'products.unit': {
    tr: 'Birim',
    az: 'Vahid',
    ru: 'Единица',
  },
  'products.inactiveProduct': {
    tr: 'Pasif Ürün',
    az: 'Deaktiv Məhsul',
    ru: 'Неактивный товар',
  },
  'status.status': {
    tr: 'Durum',
    az: 'Vəziyyət',
    ru: 'Статус',
  },
  'status.inactive': {
    tr: 'Pasif',
    az: 'Deaktiv',
    ru: 'Неактивный',
  },
  'status.all': {
    tr: 'Tümü',
    az: 'Hamısı',
    ru: 'Все',
  },
  'counts.close': {
    tr: 'Sayımı Kapat',
    az: 'Sayımı Bağla',
    ru: 'Закрыть подсчёт',
  },
  'counts.noItems': {
    tr: 'Kalem bulunamadı',
    az: 'Element tapılmadı',
    ru: 'Позиции не найдены',
  },
  'warehouses.countsFound': {
    tr: 'sayım bulundu',
    az: 'sayım tapıldı',
    ru: 'подсчётов найдено',
  },
  'warehouses.noCounts': {
    tr: 'Bu depoya ait sayım yok',
    az: 'Bu anbara aid sayım yoxdur',
    ru: 'Нет подсчётов для этого склада',
  },
  'warehouses.notFound': {
    tr: 'Depo bulunamadı.',
    az: 'Anbar tapılmadı.',
    ru: 'Склад не найден.',
  },

  // ── Toplanmış Sayımlar Sayfası Ek ──
  'totalCounts.merged': {
    tr: 'Toplanan',
    az: 'Toplanan',
    ru: 'Объединено',
  },
  'totalCounts.mergedInfo': {
    tr: '{n} sayım birleştirildi',
    az: '{n} sayım birləşdirildi',
    ru: '{n} подсчётов объединено',
  },
  'totalCounts.items': {
    tr: 'kalem',
    az: 'element',
    ru: 'позиций',
  },
  'totalCounts.sourceDetails': {
    tr: 'Toplanan sayımların detayları',
    az: 'Toplanmış sayımların təfərrüatları',
    ru: 'Детали объединённых подсчётов',
  },
  'totalCounts.noSourceInfo': {
    tr: 'Kaynak bilgisi bulunamadı',
    az: 'Mənbə məlumatı tapılmadı',
    ru: 'Информация об источнике не найдена',
  },
  'totalCounts.editCount': {
    tr: 'Sayımı Düzenle',
    az: 'Sayımı Redaktə Et',
    ru: 'Редактировать подсчёт',
  },
  'totalCounts.countName': {
    tr: 'Sayım İsmi',
    az: 'Sayım Adı',
    ru: 'Название подсчёта',
  },
  'totalCounts.deleteTitle': {
    tr: 'Toplanmış Sayımı Sil',
    az: 'Toplanmış Sayımı Sil',
    ru: 'Удалить объединённый подсчёт',
  },
  'totalCounts.countReverted': {
    tr: 'Sayım geri alındı.',
    az: 'Sayım geri alındı.',
    ru: 'Подсчёт отменён.',
  },
  'totalCounts.revertFailed': {
    tr: 'Geri alma başarısız.',
    az: 'Geri alma uğursuz.',
    ru: 'Не удалось отменить.',
  },
  'totalCounts.noMergedCounts': {
    tr: 'Henüz toplanmış sayım yok.',
    az: 'Hələ toplanmış sayım yoxdur.',
    ru: 'Объединённых подсчётов пока нет.',
  },
  'totalCounts.deleteConfirmText': {
    tr: 'silinecek. Orijinal sayımlar etkilenmez.',
    az: 'silinəcək. Orijinal sayımlar təsirlənməz.',
    ru: 'будет удалён. Исходные подсчёты не затронуты.',
  },
  'totalCounts.revertInfo': {
    tr: 'Bu sayım tekrar aktif olacak',
    az: 'Bu sayım yenidən aktiv olacaq',
    ru: 'Этот подсчёт снова станет активным',
  },
  'totalCounts.revertConfirmText': {
    tr: 'geri alınacak. Devam etmek istiyor musunuz?',
    az: 'geri alınacaq. Davam etmək istəyirsiniz?',
    ru: 'будет отменён. Продолжить?',
  },
  'totalCounts.searchPlaceholder': {
    tr: 'Sayım adı ara...',
    az: 'Sayım adı axtar...',
    ru: 'Поиск подсчёта...',
  },
  'totalCounts.sourceCounts': {
    tr: 'Kaynak Sayımlar',
    az: 'Mənbə Sayımlar',
    ru: 'Исходные подсчёты',
  },
  'totalCounts.revertCount': {
    tr: 'Sayımı Geri Al',
    az: 'Sayımı Geri Al',
    ru: 'Отменить подсчёт',
  },
  'toast.countDeleted': {
    tr: 'Sayım silindi.',
    az: 'Sayım silindi.',
    ru: 'Подсчёт удалён.',
  },
  'toast.deleteFailed': {
    tr: 'Silme başarısız.',
    az: 'Silmə uğursuz.',
    ru: 'Не удалось удалить.',
  },
  'toast.updateFailed': {
    tr: 'Güncelleme başarısız.',
    az: 'Yeniləmə uğursuz.',
    ru: 'Не удалось обновить.',
  },

  // ── Ürünler Sayfası Ek ──
  'products.totalOnPage': {
    tr: '{n} ürün',
    az: '{n} məhsul',
    ru: '{n} товаров',
  },
  'products.clickToChange': {
    tr: 'Değiştirmek için tıklayın',
    az: 'Dəyişdirmək üçün klikləyin',
    ru: 'Нажмите для изменения',
  },
  'products.clickToSelect': {
    tr: 'Dosya seçmek için tıklayın',
    az: 'Fayl seçmək üçün klikləyin',
    ru: 'Нажмите для выбора файла',
  },
  'products.willChange': {
    tr: 'Değişecek',
    az: 'Dəyişəcək',
    ru: 'Будет изменено',
  },
  'products.hasError': {
    tr: 'Hatalı',
    az: 'Xətalı',
    ru: 'Ошибка',
  },
  'products.willDelete': {
    tr: 'Silme',
    az: 'Silmə',
    ru: 'Удаление',
  },
  'products.uploading': {
    tr: 'Yükleniyor...',
    az: 'Yüklənir...',
    ru: 'Загрузка...',
  },
  'products.confirmUpload': {
    tr: 'Onayla ve Yükle',
    az: 'Təsdiqlə və Yüklə',
    ru: 'Подтвердить и загрузить',
  },
};

export default translations;
