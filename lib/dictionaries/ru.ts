export const ru = {
  metadata: {
    titleTemplate: '%s | Histyon',
    defaultTitle: 'Главная | Histyon',
    description: "Передовая медицинская диагностика",
    loginTitle: "Вход",
    registerTitle: "Регистрация"
  },
  landing: {
    hero: {
      title1: "Гистопатология",
      title2: "Cloud Native.",
      desc: "Управление, хранение и ИИ-анализ цифровых слайдов (WSI). Преодолейте ограничения десктопного ПО с помощью масштабируемой и безопасной веб-инфраструктуры.",
      badge1: "WSI Support",
      badge2: "Unlimited Storage",
      badge3: "AI Analysis",
      cta1: "Запросить доступ",
      cta2: "Узнать больше"
    },
    workflow: {
      title: "Рабочий процесс,",
      titleColor: "цифровой.",
      desc: "Архитектура, разработанная для работы с тяжелыми файлами без задержек, гарантирующая максимальную диагностическую точность.",
      f1_label: "01 — Загрузка",
      f1_title: "Безлимитное хранение",
      f1_desc: "Прямая и быстрая загрузка биопсий объемом в несколько гигабайт. Наше эластичное облако устраняет необходимость в дорогих физических серверах в больнице.",
      f2_label: "02 — Анализ",
      f2_title: "ИИ Морфометрия",
      f2_desc: "Нейросеть обрабатывает изображение в фоновом режиме, выявляя здоровые и патологические ткани с объективными и воспроизводимыми метриками.",
      f2_tag1: "Segmentation",
      f2_tag2: "Classification",
      f3_label: "03 — Отчет",
      f3_title: "Данные и QuPath",
      f3_desc: "Получайте структурированные отчеты и прямой доступ к преднастроенному проекту QuPath для микроскопического анализа второго уровня.",
      f4_label: "04 — Конфиденциальность",
      f4_title: "Безопасность данных",
      f4_desc: "Полная изоляция пациентов. Каждый врач получает зашифрованный доступ исключительно к своим случаям. Нативная совместимость с GDPR."
    },
    cta: {
      title: "Готовы к внедрению?",
      desc: "Инфраструктура Histyon готова. Загрузите первый слайд и позвольте ИИ выполнить тяжелую работу.",
      btn: "Создать аккаунт",
      note: "Доступ только для медперсонала и исследователей."
    },
    footer: {
      rights: "Все права защищены.",
      credits: "Кредиты",
      dev: "Веб-дизайн и разработка:",
      platform: "Платформа",
      support: "Поддержка",
      legalSection: "Юридический",
      login: "Вход",
      register: "Регистрация",
      docs: "Документация",
      contact: "Контакты",
      legal: "Правовая информация"
    }
  },
  auth: {
    sidebar: {
      footer: "Консоль Histyon \u00A9 2026",
      secure: "Безопасное соединение",
      testimonials: [
        { text: "Невероятный шаг вперед в управлении цифровыми слайдами.", author: "Д-р А. Белов", role: "Старший патолог" },
        { text: "ИИ сокращает время скрининга на 40%.", author: "Д-р М. Краснов", role: "Клиническая онкология" },
        { text: "Безопасность и скорость. Наконец-то.", author: "Инж. Г. Зеленов", role: "DPO больницы" }
      ]
    },
    login: {
      title: "Вход",
      heading: "Доступ к консоли",
      subheading: "Введите институциональные учетные данные.",
      noCredentials: "Нет учетных данных?",
      requestAccess: "Запросить доступ",
      medicalProfile: "Мед. профиль",
      btn: "Войти",
      forgotPassword: "Забыли пароль?",
      successRedirect: "Аккаунт подтвержден. Войдите.",
      emailConfirmed: "Email успешно подтвержден. Теперь вы можете войти.",
      linkInvalid: "Ссылка недействительна или истекла."
    },
    forgotPassword: {
      title: "Восстановление",
      heading: "Забыли пароль?",
      subheading: "Введите вашу рабочую почту. Мы отправим ссылку для сброса.",
      btn: "Отправить ссылку",
      backToLogin: "Вернуться ко входу",
      successTitle: "Email отправлен",
      successDesc: "Если адрес существует, вы скоро получите инструкции.",
      errorGeneric: "Произошла ошибка."
    },
    updatePassword: {
      title: "Новый пароль",
      heading: "Установить новый пароль",
      subheading: "Выберите надежный пароль.",
      btn: "Обновить пароль",
      success: "Пароль обновлен. Перенаправление...",
      errorMatch: "Пароли не совпадают."
    },
    register: {
      title: "Регистрация",
      heading: "Новый профиль",
      subheading: "Мастер настройки.",
      alreadyAccount: "Уже есть аккаунт?",
      accessConsole: "Войти в консоль",
      steps: {
        one: "Шаг 1", two: "Шаг 2", three: "Шаг 3",
        registry: "Данные", residence: "Адрес", profession: "Профессия"
      },
      buttons: { back: "Назад", next: "Далее", complete: "Завершить" },
      success: {
        title: "Проверьте ваш Email",
        desc: "Мы отправили ссылку для подтверждения. Вы должны подтвердить email для доступа.",
        spamNotice: "Не пришло? Проверьте Спам или Промоакции.",
        backToLogin: "Вернуться на страницу входа"
      }
    },
    form: {
      labels: {
        firstName: "Имя", lastName: "Фамилия", fiscalCode: "ИНН", gender: "Пол",
        dob: "Дата рождения", birthPlace: "Место рождения", phone: "Мобильный",
        country: "Страна", address: "Адрес", civic: "№", zip: "Индекс", city: "Город", province: "Область",
        medicalLicense: "№ Лицензии", hospital: "Учреждение", email: "Рабочий Email", password: "Пароль",
        emailSimple: "Email", passwordSimple: "Пароль", confirmPassword: "Подтвердить пароль"
      },
      placeholders: {
        name: "Иван", surname: "Иванов", cf: "1234567890", city: "Город", address: "Улица", civic: "№",
        zip: "101000", municipality: "Район", province: "Область", license: "Напр. 12345",
        hospital: "Напр. Городская больница...", select: "Выбрать", day: "День", month: "Месяц", year: "Год",
        phonePlaceholder: "+7 9...", emailPlaceholder: "email@patient.ru"
      },
      options: { male: "Мужской", female: "Женский", other: "Другой" },
      sections: { credentials: "Учетные данные", identity: "Личность", contacts: "Контакты", domicile: "Адрес" },
      warnings: { attention: "Внимание", required: "Обязательно", requiredSymbol: "*", loading: "Загрузка..." }
    }
  },
  dashboard: {
    header: { console: "Консоль", unassigned: "Не назначено", logout: "Выход" },
    tabs: { patients: "Пациенты", analysis: "Анализы", profile: "Профиль" },
    titles: {
      main: "Мед. Консоль", patientRegistry: "Реестр пациентов", globalHistory: "История анализов",
      uploadHistory: "История загрузок", patientFolder: "Личная папка"
    },
    patients: {
      empty: { title: "Нет пациентов.", subtitle: "Добавьте нового.", btnNew: "Новый пациент" },
      card: { openFolder: "Открыть папку" },
      modal: {
        title: "Регистрация пациента", subtitle: "Заполните обязательные поля (*)",
        btnSave: "Создать папку", btnSaving: "Сохранение..."
      }
    },
    tickets: {
      empty: "Нет анализов в архиве.",
      table: { id: "ID Тикета", patient: "Пациент", file: "Файл", date: "Дата", status: "Статус" },
      status: {
        completed: "Завершено", processing: "Обработка", queued: "В очереди", uploading: "Загрузка...", error: "Ошибка",
        failedAnalysis: "ОШИБКА АНАЛИЗА"
      },
      steps: { uploading: "Загрузка", queued: "Очередь", processing: "Анализ ИИ", completed: "Готово" },
      detail: { analysis: "Анализ", patient: "Пациент" }
    },
    upload: {
      title: "Новый гистологический анализ", dragDrop: "Перетащите файл (SVS, NDPI, TIFF)", remove: "Удалить",
      notesPlaceholder: "Клин. заметки (опционально)...", btnStart: "Начать загрузку и анализ",
      sending: "Отправка в облако...", successTitle: "Тикет создан", successMsg: "Ожидание ИИ...",
      errorTitle: "Ошибка загрузки", retry: "Повторить"
    },
    realtime: {
      sourceData: "Исх. данные", inputFile: "Имя файла", size: "Размер", date: "Дата",
      clinicalNotes: "Клин. заметки", noNotes: "Нет заметок.",
      errorAnalysis: "Ошибка анализа", completedAnalysis: "Анализ завершен", progressStatus: "Прогресс",
      statusLabel: "СТАТУС", processInterrupted: "Процесс прерван", errorDetails: "Детали:",
      genericError: "Общая ошибка.", retryUpload: "Повторить загрузку",
      outputFile: "Созданный файл", download: "Скачать", resultsJson: "Результаты ИИ (JSON)",
      noJson: "Нет структурированных данных.",
      queuedTitle: "В очереди", processingTitle: "Идет анализ",
      queuedDesc: "Файл в безопасности. Ожидание движка ИИ.",
      processingDesc: "Анализ тканей и генерация JSON.",
      outputNotReady: "Результат не готов."
    },
    results: {
      title: "Результаты ИИ", tissueView: "Визуализация",
      previewNote: "Предпросмотр. Для полного анализа скачайте проект.",
      sickTissue: "Больная ткань", totalGlom: "Всего клубочков", scleroGlom: "Склерозированные",
      fullProject: "Полный проект QuPath", downloadZip: "Скачайте .zip для ПК.",
      btnDownload: "Скачать проект (.zip)"
    },
    profile: { dob: "Дата рождения", birthPlace: "Место рождения", residence: "Адрес", contacts: "Контакты" },
    settings: {
      title: "Настройки профиля",
      subtitle: "Управление данными и безопасностью.",
      tabs: { profile: "Личные данные", security: "Безопасность" },
      sections: {
        personal: "Личная информация",
        residence: "Проживание",
        professional: "Проф. данные",
        email: "Email",
        password: "Пароль"
      },
      form: {
        updateBtn: "Сохранить",
        success: "Профиль обновлен.",
        emailNotice: "Смена email требует подтверждения.",
        passwordNotice: "Оставьте пустым, чтобы не менять.",
        savePassword: "Установить пароль",
        newPassword: "Новый пароль",
        confirmPassword: "Подтвердить",
        updating: "Сохранение..."
      }
    }
  },
  legal: {
    title: "Юридический центр",
    subtitle: "Прозрачность в диагностике.",
    update: "Обновлено: 21 Января 2026",
    tabs: { privacy: "Конфиденциальность", terms: "Условия", cookie: "Cookies", dpa: "Обработка (DPA)" },
    content: {
      privacyTitle: "Политика конфиденциальности", privacySub: "GDPR (EU 2016/679)",
      termsTitle: "Условия использования", termsSub: "Правила консоли",
      cookieTitle: "Политика Cookie", cookieSub: "Прозрачность трекинга",
      dpaTitle: "Безопасность и DPA", dpaSub: "Техническое приложение",
      disclaimer: "ВНИМАНИЕ - МЕДИЦИНСКИЙ ОТКАЗ:",
      disclaimerText: "Histyon — технический инструмент, не заменяет врача. ИИ требует валидации.",
      privacy: {
        sec1: { title: "1. Контроллер", body: "Histyon Team управляет данными аккаунта." },
        sec2: { title: "2. Данные", body: "Проф. данные и данные пациентов (зашифрованы)." },
        sec3: { title: "3. Цель", body: "SaaS сервис, Диагностика, Безопасность." },
        sec4: { title: "4. Локация", body: "Данные в ЕЭЗ (Европейская экономическая зона)." }
      },
      terms: {
        sec1: { title: "1. Требования", body: "Доступ только для зарегистрированных врачей." },
        sec2: { title: "2. Ответственность", body: "Пользователь гарантирует наличие согласия пациента." },
        sec3: { title: "3. Безопасность", body: "Учетные данные личные. Шеринг запрещен." }
      },
      cookie: {
        sec1: { title: "1. Что это", body: "Маленькие текстовые файлы." },
        sec2: { title: "2. Технические", body: "Строго необходимые (Сессия, Безопасность)." },
        sec3: { title: "3. Без профилирования", body: "Histyon НЕ использует профилирование." }
      },
      dpa: {
        cards: { 
            crypto: { title: "Шифрование", body: "TLS 1.3 в пути. AES-256 в покое." }, 
            access: { title: "Контроль доступа", body: "Строгие политики RLS." } 
        },
        sec1: { title: "1. Процессор", body: "Пользователь назначает Histyon Процессором (Art. 28 GDPR)." },
        sec2: { title: "2. Меры", body: "Глубокая защита: Auth, Изоляция, Бэкапы." }
      }
    }
  },
  validation: {
    passwordLength: "Минимум 8 символов",
    passwordComplexity: "Нужна заглавная буква",
    passwordSpecial: "Нужен спецсимвол",
    passwordRegexMsg: "Используйте заглавную, цифру и спецсимвол",
    passwordMismatch: "Пароли не совпадают",
    name: "Только буквы", nameAllowed: "Только буквы разрешены",
    fiscalCodeLen: "16 символов", fiscalCodeFormat: "Неверный формат",
    emailInvalid: "Неверный email", phoneShort: "Номер слишком короткий",
    required: "Обязательно", genericError: "Неожиданная ошибка.",
    alreadyRegistered: "Email уже зарегистрирован.",
    profileError: "Ошибка сохранения: ",
    patientExists: "Пациент уже существует.",
    unauthorized: "Не авторизовано",
    dbError: "Ошибка БД: ",
    uploadError: "Ошибка URL",
    cloudflareError: "Ошибка Cloudflare",
    networkError: "Ошибка сети",
    fileNotFound: "Файл не найден.",
    fileRetrievalError: "Невозможно получить файл",
    credentialsInvalid: "Неверные данные",
    linkSent: "Ссылка успешно отправлена"
  }
}