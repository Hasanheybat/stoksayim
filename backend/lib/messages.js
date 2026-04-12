/**
 * StokSay Backend — Çok Dilli Mesaj Sistemi
 * Desteklenen diller: tr (Türkçe), az (Azerbaycanca), ru (Rusça)
 *
 * Yeni mesaj eklerken 3 dili de yazmak ZORUNLUDUR.
 * Yeni dil eklemek için: her mesaja yeni key ekle + SUPPORTED_LANGS'a ekle.
 */

const SUPPORTED_LANGS = ['tr', 'az', 'ru'];
const DEFAULT_LANG = 'az';

const messages = {

  // ══════════════════════════════════════
  // GENEL
  // ══════════════════════════════════════
  SERVER_ERROR: {
    tr: 'Sunucu hatası.',
    az: 'Server xətası.',
    ru: 'Ошибка сервера.',
  },
  NO_FIELDS_TO_UPDATE: {
    tr: 'Güncellenecek alan yok.',
    az: 'Yenilənəcək sahə yoxdur.',
    ru: 'Нет полей для обновления.',
  },

  TOO_MANY_REQUESTS: {
    tr: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.',
    az: 'Çox sayda sorğu göndərildi. Zəhmət olmasa 15 dəqiqə sonra təkrar cəhd edin.',
    ru: 'Слишком много запросов. Пожалуйста, повторите через 15 минут.',
  },
  TOO_MANY_LOGIN_ATTEMPTS: {
    tr: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.',
    az: 'Çox sayda giriş cəhdi. Zəhmət olmasa 15 dəqiqə sonra təkrar cəhd edin.',
    ru: 'Слишком много попыток входа. Пожалуйста, повторите через 15 минут.',
  },
  CORS_BLOCKED: {
    tr: 'Bu kaynaktan erişim izni yok.',
    az: 'Bu mənbədən giriş icazəsi yoxdur.',
    ru: 'Доступ из этого источника запрещён.',
  },

  // ══════════════════════════════════════
  // AUTH (Oturum)
  // ══════════════════════════════════════
  EMAIL_AND_PASSWORD_REQUIRED: {
    tr: 'Email ve şifre zorunludur.',
    az: 'Email və şifrə tələb olunur.',
    ru: 'Email и пароль обязательны.',
  },
  INVALID_EMAIL: {
    tr: 'Geçerli bir email adresi giriniz.',
    az: 'Düzgün email ünvanı daxil edin.',
    ru: 'Введите действительный email адрес.',
  },
  INVALID_CREDENTIALS: {
    tr: 'Geçersiz email veya şifre.',
    az: 'Yanlış email və ya şifrə.',
    ru: 'Неверный email или пароль.',
  },
  ACCOUNT_INACTIVE: {
    tr: 'Hesabınız pasif durumdadır.',
    az: 'Hesabınız deaktivdir.',
    ru: 'Ваш аккаунт деактивирован.',
  },
  SESSION_NOT_FOUND: {
    tr: 'Oturum açılmamış.',
    az: 'Sessiya açılmayıb.',
    ru: 'Сессия не открыта.',
  },
  SESSION_INVALID: {
    tr: 'Geçersiz veya süresi dolmuş oturum.',
    az: 'Etibarsız və ya müddəti bitmiş sessiya.',
    ru: 'Недействительная или истекшая сессия.',
  },
  EMAIL_REQUIRED: {
    tr: 'Email zorunludur.',
    az: 'Email tələb olunur.',
    ru: 'Email обязателен.',
  },
  EMAIL_ALREADY_IN_USE: {
    tr: 'Bu email zaten kullanımda.',
    az: 'Bu email artıq istifadə olunur.',
    ru: 'Этот email уже используется.',
  },
  OLD_AND_NEW_PASSWORD_REQUIRED: {
    tr: 'Eski ve yeni şifre zorunludur.',
    az: 'Köhnə və yeni şifrə tələb olunur.',
    ru: 'Старый и новый пароль обязательны.',
  },
  NEW_PASSWORD_MIN_LENGTH: {
    tr: 'Yeni şifre en az 8 karakter olmalıdır.',
    az: 'Yeni şifrə ən azı 8 simvol olmalıdır.',
    ru: 'Новый пароль должен быть не менее 8 символов.',
  },
  PASSWORD_MAX_LENGTH: {
    tr: 'Şifre en fazla 128 karakter olabilir.',
    az: 'Şifrə ən çox 128 simvol ola bilər.',
    ru: 'Пароль может быть не более 128 символов.',
  },
  CURRENT_PASSWORD_WRONG: {
    tr: 'Mevcut şifre hatalı.',
    az: 'Cari şifrə yanlışdır.',
    ru: 'Текущий пароль неверен.',
  },

  // ══════════════════════════════════════
  // KULLANICI
  // ══════════════════════════════════════
  USER_NOT_FOUND: {
    tr: 'Kullanıcı bulunamadı.',
    az: 'İstifadəçi tapılmadı.',
    ru: 'Пользователь не найден.',
  },
  USER_FIELDS_REQUIRED: {
    tr: 'Ad soyad, email ve şifre zorunludur.',
    az: 'Ad soyad, email və şifrə tələb olunur.',
    ru: 'ФИО, email и пароль обязательны.',
  },
  NAME_MAX_LENGTH: {
    tr: 'Ad soyad en fazla 100 karakter olabilir.',
    az: 'Ad soyad ən çox 100 simvol ola bilər.',
    ru: 'ФИО может быть не более 100 символов.',
  },
  EMAIL_MAX_LENGTH: {
    tr: 'Email en fazla 255 karakter olabilir.',
    az: 'Email ən çox 255 simvol ola bilər.',
    ru: 'Email может быть не более 255 символов.',
  },
  PASSWORD_MIN_LENGTH: {
    tr: 'Şifre en az 8 karakter olmalıdır.',
    az: 'Şifrə ən azı 8 simvol olmalıdır.',
    ru: 'Пароль должен быть не менее 8 символов.',
  },
  INVALID_ROLE: {
    tr: 'Geçersiz rol.',
    az: 'Etibarsız rol.',
    ru: 'Недопустимая роль.',
  },
  INVALID_PHONE: {
    tr: 'Geçerli bir telefon numarası giriniz.',
    az: 'Düzgün telefon nömrəsi daxil edin.',
    ru: 'Введите действительный номер телефона.',
  },
  CANNOT_CHANGE_OWN_ADMIN_ROLE: {
    tr: 'Kendi yönetici rolünüzü değiştiremezsiniz.',
    az: 'Öz idarəçi rolunuzu dəyişə bilməzsiniz.',
    ru: 'Вы не можете изменить свою роль администратора.',
  },
  CANNOT_DEACTIVATE_SELF: {
    tr: 'Kendi hesabınızı pasife alamazsınız.',
    az: 'Öz hesabınızı deaktiv edə bilməzsiniz.',
    ru: 'Вы не можете деактивировать свой аккаунт.',
  },
  CANNOT_DELETE_SELF: {
    tr: 'Kendi hesabınızı silemezsiniz.',
    az: 'Öz hesabınızı silə bilməzsiniz.',
    ru: 'Вы не можете удалить свой аккаунт.',
  },
  USER_DEACTIVATED: {
    tr: 'Kullanıcı pasife alındı.',
    az: 'İstifadəçi deaktiv edildi.',
    ru: 'Пользователь деактивирован.',
  },
  USER_ALREADY_ACTIVE: {
    tr: 'Bu kullanıcı zaten aktif.',
    az: 'Bu istifadəçi artıq aktivdir.',
    ru: 'Этот пользователь уже активен.',
  },
  USER_RESTORED: {
    tr: 'Kullanıcı geri alındı.',
    az: 'İstifadəçi bərpa edildi.',
    ru: 'Пользователь восстановлен.',
  },
  BUSINESS_ID_REQUIRED: {
    tr: 'İşletme ID zorunludur.',
    az: 'Müəssisə ID tələb olunur.',
    ru: 'ID предприятия обязателен.',
  },
  BUSINESS_ASSIGNMENT_REMOVED: {
    tr: 'İşletme ataması kaldırıldı.',
    az: 'Müəssisə təyinatı silindi.',
    ru: 'Назначение предприятия удалено.',
  },
  ASSIGNMENT_NOT_FOUND: {
    tr: 'Atama bulunamadı.',
    az: 'Təyinat tapılmadı.',
    ru: 'Назначение не найдено.',
  },
  BUSINESS_ID_AND_PERMISSIONS_REQUIRED: {
    tr: 'İşletme ID ve yetkiler zorunludur.',
    az: 'Müəssisə ID və icazələr tələb olunur.',
    ru: 'ID предприятия и разрешения обязательны.',
  },

  // ══════════════════════════════════════
  // ÜRÜN
  // ══════════════════════════════════════
  PRODUCT_NOT_FOUND: {
    tr: 'Ürün bulunamadı.',
    az: 'Məhsul tapılmadı.',
    ru: 'Товар не найден.',
  },
  NO_ACCESS_TO_BUSINESS: {
    tr: 'Bu işletmeye erişim yetkiniz yok.',
    az: 'Bu müəssisəyə giriş icazəniz yoxdur.',
    ru: 'У вас нет доступа к этому предприятию.',
  },
  PRODUCT_NAME_REQUIRED: {
    tr: 'İşletme ID ve ürün adı zorunludur.',
    az: 'Müəssisə ID və məhsul adı tələb olunur.',
    ru: 'ID предприятия и название товара обязательны.',
  },
  PRODUCT_NAME_EMPTY: {
    tr: 'İsim 1 (sayım ismi) boş olamaz.',
    az: 'Ad 1 (sayım adı) boş ola bilməz.',
    ru: 'Имя 1 (название подсчёта) не может быть пустым.',
  },
  PRODUCT_CODE_EXISTS: {
    tr: 'Bu ürün kodu bu işletmede zaten var.',
    az: 'Bu məhsul kodu bu müəssisədə artıq mövcuddur.',
    ru: 'Этот код товара уже существует в этом предприятии.',
  },
  PRODUCT_IN_ACTIVE_COUNTS: {
    tr: 'Bu ürün aktif sayımlarda kullanılıyor.',
    az: 'Bu məhsul aktiv sayımlarda istifadə olunur.',
    ru: 'Этот товар используется в активных подсчётах.',
  },
  PRODUCT_DELETED: {
    tr: 'Ürün silindi.',
    az: 'Məhsul silindi.',
    ru: 'Товар удалён.',
  },
  PRODUCT_ALREADY_ACTIVE: {
    tr: 'Bu ürün zaten aktif.',
    az: 'Bu məhsul artıq aktivdir.',
    ru: 'Этот товар уже активен.',
  },
  PRODUCT_RESTORED: {
    tr: 'Ürün geri alındı.',
    az: 'Məhsul bərpa edildi.',
    ru: 'Товар восстановлен.',
  },
  BARCODE_NOT_FOUND: {
    tr: 'Barkod sistemde bulunamadı.',
    az: 'Barkod sistemdə tapılmadı.',
    ru: 'Штрих-код не найден в системе.',
  },
  BARCODE_REQUIRED: {
    tr: 'Barkod zorunludur.',
    az: 'Barkod tələb olunur.',
    ru: 'Штрих-код обязателен.',
  },
  INVALID_BARCODE: {
    tr: 'Geçerli bir barkod giriniz.',
    az: 'Düzgün barkod daxil edin.',
    ru: 'Введите действительный штрих-код.',
  },
  BARCODE_ALREADY_ON_PRODUCT: {
    tr: 'Bu barkod zaten bu ürüne tanımlı.',
    az: 'Bu barkod artıq bu məhsula təyin edilib.',
    ru: 'Этот штрих-код уже назначен этому товару.',
  },
  FILE_TOO_LARGE: {
    tr: 'Dosya 10 MB sınırını aşıyor.',
    az: 'Fayl 10 MB həddini aşır.',
    ru: 'Файл превышает лимит 10 МБ.',
  },
  FILE_UPLOAD_FAILED: {
    tr: 'Dosya yüklenemedi.',
    az: 'Fayl yüklənə bilmədi.',
    ru: 'Не удалось загрузить файл.',
  },
  EXCEL_FILE_REQUIRED: {
    tr: 'Excel dosyası gereklidir.',
    az: 'Excel faylı tələb olunur.',
    ru: 'Требуется файл Excel.',
  },
  ONLY_XLSX_ALLOWED: {
    tr: 'Sadece .xlsx veya .xls dosyası yüklenebilir.',
    az: 'Yalnız .xlsx və ya .xls faylı yüklənə bilər.',
    ru: 'Можно загрузить только файлы .xlsx или .xls.',
  },
  UPLOAD_COMPLETE: {
    tr: 'Yükleme tamamlandı.',
    az: 'Yükləmə tamamlandı.',
    ru: 'Загрузка завершена.',
  },

  // ══════════════════════════════════════
  // SAYIM
  // ══════════════════════════════════════
  COUNT_NOT_FOUND: {
    tr: 'Sayım bulunamadı.',
    az: 'Sayım tapılmadı.',
    ru: 'Подсчёт не найден.',
  },
  NO_ACCESS_TO_COUNT: {
    tr: 'Bu sayıma erişim yetkiniz yok.',
    az: 'Bu sayıma giriş icazəniz yoxdur.',
    ru: 'У вас нет доступа к этому подсчёту.',
  },
  COUNT_FIELDS_REQUIRED: {
    tr: 'İşletme ID, depo ID ve ad zorunludur.',
    az: 'Müəssisə ID, anbar ID və ad tələb olunur.',
    ru: 'ID предприятия, ID склада и название обязательны.',
  },
  COMPLETED_COUNT_NO_EDIT: {
    tr: 'Tamamlanmış sayım düzenlenemez.',
    az: 'Tamamlanmış sayım redaktə edilə bilməz.',
    ru: 'Завершённый подсчёт нельзя редактировать.',
  },
  COMPLETED_COUNT_NO_DELETE: {
    tr: 'Tamamlanmış sayım silinemez.',
    az: 'Tamamlanmış sayım silinə bilməz.',
    ru: 'Завершённый подсчёт нельзя удалить.',
  },
  COMPLETED_COUNT_NO_ADD_ITEM: {
    tr: 'Tamamlanmış sayıma kalem eklenemez.',
    az: 'Tamamlanmış sayıma kalem əlavə edilə bilməz.',
    ru: 'В завершённый подсчёт нельзя добавить позицию.',
  },
  COMPLETED_COUNT_NAME_ONLY: {
    tr: 'Tamamlanmış sayımda sadece isim değiştirilebilir.',
    az: 'Tamamlanmış sayımda yalnız ad dəyişdirilə bilər.',
    ru: 'В завершённом подсчёте можно изменить только название.',
  },
  COMPLETED_COUNT_NO_DELETE_ITEM: {
    tr: 'Tamamlanmış sayımdan kalem silinemez.',
    az: 'Tamamlanmış sayımdan kalem silinə bilməz.',
    ru: 'Из завершённого подсчёта нельзя удалить позицию.',
  },
  ONLY_ONGOING_CAN_COMPLETE: {
    tr: 'Sadece devam eden sayımlar tamamlanabilir.',
    az: 'Yalnız davam edən sayımlar tamamlana bilər.',
    ru: 'Только текущие подсчёты могут быть завершены.',
  },
  REOPEN_ADMIN_ONLY: {
    tr: 'Sayımı yeniden açma yetkisi yalnızca yöneticilere aittir.',
    az: 'Sayımı yenidən açma icazəsi yalnız idarəçilərə aiddir.',
    ru: 'Право повторного открытия подсчёта только у администраторов.',
  },
  COUNT_ALREADY_OPEN: {
    tr: 'Sayım zaten açık durumda.',
    az: 'Sayım artıq açıq vəziyyətdədir.',
    ru: 'Подсчёт уже открыт.',
  },
  COUNT_DELETED: {
    tr: 'Sayım silindi.',
    az: 'Sayım silindi.',
    ru: 'Подсчёт удалён.',
  },
  COUNT_NOT_DELETED_STATE: {
    tr: 'Bu sayım silinmiş durumda değil.',
    az: 'Bu sayım silinmiş vəziyyətdə deyil.',
    ru: 'Этот подсчёт не в удалённом состоянии.',
  },
  COUNT_RESTORED: {
    tr: 'Sayım geri alındı.',
    az: 'Sayım bərpa edildi.',
    ru: 'Подсчёт восстановлен.',
  },
  ITEM_ID_AND_QUANTITY_REQUIRED: {
    tr: 'Ürün ID ve miktar zorunludur.',
    az: 'Məhsul ID və miqdar tələb olunur.',
    ru: 'ID товара и количество обязательны.',
  },
  QUANTITY_MUST_BE_NUMBER: {
    tr: 'Miktar sayısal bir değer olmalıdır.',
    az: 'Miqdar rəqəmsal dəyər olmalıdır.',
    ru: 'Количество должно быть числовым значением.',
  },
  PRODUCT_NOT_IN_BUSINESS: {
    tr: 'Bu ürün bu işletmeye ait değil.',
    az: 'Bu məhsul bu müəssisəyə aid deyil.',
    ru: 'Этот товар не принадлежит этому предприятию.',
  },
  ITEM_NOT_FOUND: {
    tr: 'Kalem bulunamadı.',
    az: 'Kalem tapılmadı.',
    ru: 'Позиция не найдена.',
  },
  ITEM_DELETED: {
    tr: 'Kalem silindi.',
    az: 'Kalem silindi.',
    ru: 'Позиция удалена.',
  },
  OPTIMISTIC_LOCK_CONFLICT: {
    tr: 'Bu kayıt başka biri tarafından güncellendi. Lütfen sayfayı yenileyip tekrar deneyin.',
    az: 'Bu qeyd başqa biri tərəfindən yenilənib. Zəhmət olmasa səhifəni yeniləyib təkrar cəhd edin.',
    ru: 'Эта запись была обновлена другим пользователем. Обновите страницу и попробуйте снова.',
  },
  ADMIN_ONLY: {
    tr: 'Bu işlem için yönetici yetkisi gereklidir.',
    az: 'Bu əməliyyat üçün idarəçi icazəsi tələb olunur.',
    ru: 'Для этой операции требуются права администратора.',
  },
  ONLY_ADMIN_CAN_DO_THIS: {
    tr: 'Yalnızca yönetici bu işlemi yapabilir.',
    az: 'Yalnız idarəçi bu əməliyyatı edə bilər.',
    ru: 'Только администратор может выполнить эту операцию.',
  },

  // ══════════════════════════════════════
  // TOPLANMIŞ SAYIM
  // ══════════════════════════════════════
  MERGE_MIN_TWO: {
    tr: 'En az 2 sayım seçilmelidir.',
    az: 'Ən azı 2 sayım seçilməlidir.',
    ru: 'Необходимо выбрать минимум 2 подсчёта.',
  },
  MERGE_MIN_ONE: {
    tr: 'En az 1 sayım seçilmelidir.',
    az: 'Ən azı 1 sayım seçilməlidir.',
    ru: 'Необходимо выбрать минимум 1 подсчёт.',
  },
  MERGE_NAME_REQUIRED: {
    tr: 'Toplanmış sayım adı zorunludur.',
    az: 'Toplanmış sayım adı tələb olunur.',
    ru: 'Название объединённого подсчёта обязательно.',
  },
  MERGE_ONLY_COMPLETED: {
    tr: 'Sadece tamamlanmış sayımlar toplanabilir.',
    az: 'Yalnız tamamlanmış sayımlar toplana bilər.',
    ru: 'Можно объединять только завершённые подсчёты.',
  },
  MERGE_SAME_BUSINESS: {
    tr: 'Tüm sayımlar aynı işletmeye ait olmalıdır.',
    az: 'Bütün sayımlar eyni müəssisəyə aid olmalıdır.',
    ru: 'Все подсчёты должны принадлежать одному предприятию.',
  },
  MERGE_OWN_COUNTS_ONLY: {
    tr: 'Sadece kendi sayımlarınızı toplayabilirsiniz.',
    az: 'Yalnız öz sayımlarınızı toplaya bilərsiniz.',
    ru: 'Вы можете объединять только свои подсчёты.',
  },

  // ══════════════════════════════════════
  // DEPO
  // ══════════════════════════════════════
  WAREHOUSE_NOT_FOUND: {
    tr: 'Depo bulunamadı.',
    az: 'Anbar tapılmadı.',
    ru: 'Склад не найден.',
  },
  WAREHOUSE_FIELDS_REQUIRED: {
    tr: 'İşletme ID ve ad zorunludur.',
    az: 'Müəssisə ID və ad tələb olunur.',
    ru: 'ID предприятия и название обязательны.',
  },
  WAREHOUSE_NAME_EMPTY: {
    tr: 'Depo adı boş olamaz.',
    az: 'Anbar adı boş ola bilməz.',
    ru: 'Название склада не может быть пустым.',
  },
  WAREHOUSE_EXISTS: {
    tr: 'Bu depo bu işletmede zaten var.',
    az: 'Bu anbar bu müəssisədə artıq mövcuddur.',
    ru: 'Этот склад уже существует в этом предприятии.',
  },
  WAREHOUSE_CODE_EXISTS: {
    tr: 'Bu depo kodu bu işletmede zaten var.',
    az: 'Bu anbar kodu bu müəssisədə artıq mövcuddur.',
    ru: 'Этот код склада уже существует в этом предприятии.',
  },
  WAREHOUSE_IN_ACTIVE_COUNTS: {
    tr: 'Bu depo aktif sayımlarda kullanılıyor.',
    az: 'Bu anbar aktiv sayımlarda istifadə olunur.',
    ru: 'Этот склад используется в активных подсчётах.',
  },
  WAREHOUSE_DELETED: {
    tr: 'Depo silindi.',
    az: 'Anbar silindi.',
    ru: 'Склад удалён.',
  },
  WAREHOUSE_ALREADY_ACTIVE: {
    tr: 'Bu depo zaten aktif.',
    az: 'Bu anbar artıq aktivdir.',
    ru: 'Этот склад уже активен.',
  },
  WAREHOUSE_RESTORED: {
    tr: 'Depo geri alındı.',
    az: 'Anbar bərpa edildi.',
    ru: 'Склад восстановлен.',
  },

  // ══════════════════════════════════════
  // İŞLETME
  // ══════════════════════════════════════
  BUSINESS_NOT_FOUND: {
    tr: 'İşletme bulunamadı.',
    az: 'Müəssisə tapılmadı.',
    ru: 'Предприятие не найдено.',
  },
  BUSINESS_NAME_AND_CODE_REQUIRED: {
    tr: 'Ad ve kod zorunludur.',
    az: 'Ad və kod tələb olunur.',
    ru: 'Название и код обязательны.',
  },
  BUSINESS_NAME_MAX_LENGTH: {
    tr: 'Ad en fazla 255 karakter olabilir.',
    az: 'Ad ən çox 255 simvol ola bilər.',
    ru: 'Название может быть не более 255 символов.',
  },
  BUSINESS_CODE_MAX_LENGTH: {
    tr: 'Kod en fazla 50 karakter olabilir.',
    az: 'Kod ən çox 50 simvol ola bilər.',
    ru: 'Код может быть не более 50 символов.',
  },
  BUSINESS_ADDRESS_MAX_LENGTH: {
    tr: 'Adres en fazla 500 karakter olabilir.',
    az: 'Ünvan ən çox 500 simvol ola bilər.',
    ru: 'Адрес может быть не более 500 символов.',
  },
  BUSINESS_CODE_IN_USE: {
    tr: 'Bu kod zaten kullanımda.',
    az: 'Bu kod artıq istifadə olunur.',
    ru: 'Этот код уже используется.',
  },
  BUSINESS_DEACTIVATED: {
    tr: 'İşletme pasife alındı.',
    az: 'Müəssisə deaktiv edildi.',
    ru: 'Предприятие деактивировано.',
  },
  BUSINESS_ALREADY_ACTIVE: {
    tr: 'Bu işletme zaten aktif.',
    az: 'Bu müəssisə artıq aktivdir.',
    ru: 'Это предприятие уже активно.',
  },
  BUSINESS_RESTORED: {
    tr: 'İşletme geri alındı.',
    az: 'Müəssisə bərpa edildi.',
    ru: 'Предприятие восстановлено.',
  },

  // ══════════════════════════════════════
  // ROL
  // ══════════════════════════════════════
  ROLE_NAME_REQUIRED: {
    tr: 'Rol adı zorunludur.',
    az: 'Rol adı tələb olunur.',
    ru: 'Название роли обязательно.',
  },
  ROLE_NAME_EXISTS: {
    tr: 'Bu rol adı zaten mevcut.',
    az: 'Bu rol adı artıq mövcuddur.',
    ru: 'Это название роли уже существует.',
  },
  ROLE_NOT_FOUND: {
    tr: 'Rol bulunamadı.',
    az: 'Rol tapılmadı.',
    ru: 'Роль не найдена.',
  },
  ROLE_DELETED: {
    tr: 'Rol silindi.',
    az: 'Rol silindi.',
    ru: 'Роль удалена.',
  },

  // ══════════════════════════════════════
  // PROFİL / AYARLAR
  // ══════════════════════════════════════
  SETTINGS_REQUIRED: {
    tr: 'Ayarlar zorunludur.',
    az: 'Parametrlər tələb olunur.',
    ru: 'Настройки обязательны.',
  },

  // ══════════════════════════════════════
  // YETKİ (Dinamik mesajlar için şablon)
  // ══════════════════════════════════════
  NO_PERMISSION_VIEW: {
    tr: 'görüntüleme yetkiniz yok.',
    az: 'baxış icazəniz yoxdur.',
    ru: 'у вас нет прав на просмотр.',
  },
  NO_PERMISSION_TEMPLATE: {
    tr: 'yetkisine sahip değilsiniz.',
    az: 'icazəniz yoxdur.',
    ru: 'у вас нет разрешения.',
  },
  BUSINESS_ID_MISSING: {
    tr: 'İşletme ID gerekli.',
    az: 'Müəssisə ID tələb olunur.',
    ru: 'Требуется ID предприятия.',
  },
};

// ── Dinamik mesaj oluşturucular ──

/**
 * Barkod çakışma mesajı
 * @param {string} lang
 * @param {string} barkod
 * @param {string} urunAdi
 */
messages._BARCODE_CONFLICT = (lang, barkod, urunAdi) => {
  const t = {
    tr: `"${barkod}" barkodu "${urunAdi}" ürününe zaten tanımlı.`,
    az: `"${barkod}" barkodu "${urunAdi}" məhsuluna artıq təyin edilib.`,
    ru: `Штрих-код "${barkod}" уже назначен товару "${urunAdi}".`,
  };
  return t[lang] || t[DEFAULT_LANG];
};

/**
 * Sistem rolü silinemez mesajı
 * @param {string} lang
 * @param {string} rolAdi
 */
messages._SYSTEM_ROLE_NO_DELETE = (lang, rolAdi) => {
  const t = {
    tr: `"${rolAdi}" sistem rolü silinemez.`,
    az: `"${rolAdi}" sistem rolu silinə bilməz.`,
    ru: `Системную роль "${rolAdi}" нельзя удалить.`,
  };
  return t[lang] || t[DEFAULT_LANG];
};

/**
 * Yetki yok mesajı (kategori + işlem)
 * @param {string} lang
 * @param {string} kategori — ürün, depo, sayım vb.
 * @param {string} islem — görüntüleme, ekleme, düzenleme, silme
 */
messages._NO_PERMISSION = (lang, kategori, islem) => {
  const t = {
    tr: `${kategori} ${islem} yetkiniz yok.`,
    az: `${kategori} ${islem} icazəniz yoxdur.`,
    ru: `У вас нет прав на ${islem} ${kategori}.`,
  };
  return t[lang] || t[DEFAULT_LANG];
};

/**
 * Kaynak yetki mesajı (Ürün/Depo/Sayım + işlem)
 * @param {string} lang
 * @param {string} kaynak — Ürün, Depo, Sayım, Toplanmış sayım
 * @param {string} islem — görüntüleme, ekleme, düzenleme, silme
 */
messages._RESOURCE_NO_PERMISSION = (lang, kaynak, islem) => {
  const t = {
    tr: `${kaynak} ${islem} yetkiniz yok.`,
    az: `${kaynak} ${islem} icazəniz yoxdur.`,
    ru: `У вас нет прав на ${islem} — ${kaynak}.`,
  };
  return t[lang] || t[DEFAULT_LANG];
};

// ── Helper ──

/**
 * Mesaj kodu ile çeviri döndür
 * @param {string} lang — 'tr' | 'az' | 'ru'
 * @param {string} code — mesaj kodu (örn: 'EMAIL_REQUIRED')
 * @returns {string}
 */
function msg(lang, code) {
  const entry = messages[code];
  if (!entry) return code;
  const validLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  return entry[validLang] || entry[DEFAULT_LANG] || code;
}

module.exports = { msg, messages, SUPPORTED_LANGS, DEFAULT_LANG };
