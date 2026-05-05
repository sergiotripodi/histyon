export const ar = {
  metadata: {
    titleTemplate: '%s | Histyon',
    defaultTitle: 'الرئيسية | Histyon',
    description: "تشخيص طبي متقدم",
    loginTitle: "دخول",
    registerTitle: "تسجيل"
  },
  landing: {
    hero: {
      title1: "علم أمراض الأنسجة",
      title2: "سحابي أصلي.",
      desc: "إدارة وتخزين وتحليل الذكاء الاصطناعي للشرائح الرقمية (WSI). تغلب على حدود برامج سطح المكتب من خلال بنية تحتية ويب قابلة للتطوير وآمنة.",
      badge1: "WSI Support",
      badge2: "Unlimited Storage",
      badge3: "AI Analysis",
      cta1: "طلب الوصول",
      cta2: "اعرف المزيد"
    },
    workflow: {
      title: "سير العمل،",
      titleColor: "رقمي.",
      desc: "بنية مصممة للتعامل مع الملفات الثقيلة دون تأخير، مما يضمن أقصى دقة تشخيصية.",
      f1_label: "01 — استيعاب",
      f1_title: "تخزين غير محدود",
      f1_desc: "تحميل مباشر وسريع لخزعات متعددة الجيجابايت. سحابتنا المرنة تلغي الحاجة إلى خوادم فعلية باهظة الثمن في المستشفى.",
      f2_label: "02 — تحليل",
      f2_title: "قياس الشكل بالذكاء الاصطناعي",
      f2_desc: "تقوم الشبكة العصبية بمعالجة الصورة في الخلفية، وتحديد الأنسجة السليمة والمرضية بمقاييس موضوعية وقابلة للتكرار.",
      f2_tag1: "Segmentation",
      f2_tag2: "Classification",
      f3_label: "03 — تقرير",
      f3_title: "البيانات و QuPath",
      f3_desc: "احصل على تقارير منظمة ووصول مباشر إلى مشروع QuPath المكون مسبقًا للتحليل المجهري من المستوى الثاني.",
      f4_label: "04 — الخصوصية",
      f4_title: "أمان البيانات",
      f4_desc: "عزل كامل للمرضى. يصل كل طبيب بشكل مشفر حصريًا إلى حالاته الخاصة. الامتثال الأصلي للائحة العامة لحماية البيانات (GDPR)."
    },
    cta: {
      title: "جاهز للنشر؟",
      desc: "البنية التحتية لـ Histyon جاهزة. قم بتحميل الشريحة الأولى واترك الذكاء الاصطناعي يقوم بالعمل الشاق.",
      btn: "إنشاء حساب",
      note: "الوصول محجوز للطاقم الطبي والباحثين."
    },
    footer: {
      rights: "جميع الحقوق محفوظة.",
      credits: "الاعتمادات",
      dev: "تصميم وتطوير الويب:",
      platform: "منصة",
      support: "دعم",
      legalSection: "قانوني",
      login: "دخول",
      register: "تسجيل",
      docs: "وثائق",
      contact: "اتصل بنا",
      legal: "معلومات قانونية"
    }
  },
  auth: {
    sidebar: {
      footer: "وحدة تحكم Histyon \u00A9 2026",
      secure: "اتصال آمن",
      testimonials: [
        { text: "خطوة مذهلة للأمام في إدارة الشرائح الرقمية.", author: "د. أ. أبيض", role: "أخصائي علم الأمراض" },
        { text: "الذكاء الاصطناعي يقلل وقت الفحص بنسبة 40%.", author: "د. م. أحمر", role: "الأورام السريرية" },
        { text: "أمان وسرعة. أخيراً.", author: "م. ج. أخضر", role: "مسؤول حماية البيانات" }
      ]
    },
    login: {
      title: "دخول",
      heading: "الوصول للوحدة",
      subheading: "أدخل بيانات الاعتماد المؤسسية.",
      noCredentials: "ليس لديك بيانات؟",
      requestAccess: "طلب وصول",
      medicalProfile: "ملف طبي",
      btn: "تسجيل الدخول",
      forgotPassword: "نسيت كلمة المرور؟",
      successRedirect: "تم التحقق من الحساب. الرجاء تسجيل الدخول.",
      emailConfirmed: "تم تأكيد البريد الإلكتروني بنجاح. يمكنك الآن الدخول.",
      linkInvalid: "الرابط غير صالح أو منتهي الصلاحية."
    },
    forgotPassword: {
      title: "استعادة كلمة المرور",
      heading: "نسيت كلمة المرور؟",
      subheading: "أدخل بريدك الإلكتروني المؤسسي. سنرسل لك رابطاً لإعادة التعيين.",
      btn: "إرسال الرابط",
      backToLogin: "العودة للدخول",
      successTitle: "تم إرسال البريد",
      successDesc: "إذا كان العنوان موجوداً، ستتلقى التعليمات قريباً.",
      errorGeneric: "حدث خطأ."
    },
    updatePassword: {
      title: "كلمة مرور جديدة",
      heading: "تعيين كلمة مرور جديدة",
      subheading: "اختر كلمة مرور آمنة.",
      btn: "تحديث كلمة المرور",
      success: "تم التحديث. جاري إعادة التوجيه...",
      errorMatch: "كلمات المرور غير متطابقة."
    },
    register: {
      title: "تسجيل",
      heading: "ملف جديد",
      subheading: "تكوين موجه.",
      alreadyAccount: "لديك حساب بالفعل؟",
      accessConsole: "دخول الوحدة",
      steps: {
        one: "خطوة 1", two: "خطوة 2", three: "خطوة 3",
        registry: "السجل", residence: "الإقامة", profession: "المهنة"
      },
      buttons: { back: "رجوع", next: "التالي", complete: "إكمال" },
      success: {
        title: "تحقق من بريدك الإلكتروني",
        desc: "لقد أرسلنا رابط تأكيد. يجب عليك التحقق من بريدك الإلكتروني للوصول إلى لوحة التحكم.",
        spamNotice: "لم يصلك؟ تحقق من البريد العشوائي.",
        backToLogin: "العودة لصفحة الدخول"
      }
    },
    form: {
      labels: {
        firstName: "الاسم", lastName: "اللقب", fiscalCode: "الرمز المالي", gender: "الجنس",
        dob: "تاريخ الميلاد", birthPlace: "مكان الميلاد", phone: "جوال",
        country: "دولة", address: "عنوان", civic: "رقم", zip: "رمز بريدي", city: "مدينة", province: "مقاطعة",
        medicalLicense: "رقم الترخيص", hospital: "مؤسسة", email: "بريد مؤسسي", password: "كلمة المرور",
        emailSimple: "بريد إلكتروني", passwordSimple: "كلمة مرور", confirmPassword: "تأكيد كلمة المرور"
      },
      placeholders: {
        name: "أحمد", surname: "محمد", cf: "رمز...", city: "مدينة", address: "شارع", civic: "رقم",
        zip: "12345", municipality: "بلدية", province: "منطقة", license: "مثال 12345",
        hospital: "مثال مستشفى عام...", select: "اختر", day: "يوم", month: "شهر", year: "سنة",
        phonePlaceholder: "+966 5...", emailPlaceholder: "email@patient.com"
      },
      options: { male: "ذكر", female: "أنثى", other: "آخر" },
      sections: { credentials: "بيانات الاعتماد", identity: "هوية", contacts: "اتصالات", domicile: "إقامة" },
      warnings: { attention: "انتباه", required: "مطلوب", requiredSymbol: "*", loading: "جاري التحميل..." }
    }
  },
  dashboard: {
    header: { console: "وحدة التحكم", unassigned: "غير معين", logout: "خروج" },
    tabs: { patients: "مرضى", analysis: "تحليلات", profile: "ملف شخصي" },
    titles: {
      main: "وحدة طبية", patientRegistry: "سجل المرضى", globalHistory: "سجل عالمي",
      uploadHistory: "سجل التحميل", patientFolder: "ملف شخصي"
    },
    patients: {
      empty: { title: "لا يوجد مرضى.", subtitle: "ابدأ بإضافة واحد.", btnNew: "مريض جديد" },
      card: { openFolder: "فتح الملف" },
      modal: {
        title: "تسجيل مريض", subtitle: "تعبئة الحقول المطلوبة (*)",
        btnSave: "إنشاء ملف", btnSaving: "جاري الحفظ..."
      }
    },
    tickets: {
      empty: "لا توجد تحليلات.",
      table: { id: "رقم التذكرة", patient: "مريض", file: "ملف", date: "تاريخ", status: "حالة" },
      status: {
        completed: "مكتمل", processing: "معالجة", queued: "في الانتظار", uploading: "جاري التحميل...", error: "خطأ",
        failedAnalysis: "فشل التحليل"
      },
      steps: { uploading: "تحميل", queued: "انتظار سحابي", processing: "تحليل AI", completed: "مكتمل" },
      detail: { analysis: "تحليل", patient: "مريض" }
    },
    upload: {
      title: "تحليل نسيجي جديد", dragDrop: "اسحب الملف هنا (SVS, NDPI, TIFF)", remove: "إزالة",
      notesPlaceholder: "ملاحظات سريرية (اختياري)...", btnStart: "بدء التحميل والتحليل",
      sending: "إرسال آمن...", successTitle: "تم إنشاء التذكرة", successMsg: "انتظار AI...",
      errorTitle: "خطأ في التحميل", retry: "إعادة المحاولة"
    },
    realtime: {
      sourceData: "بيانات المصدر", inputFile: "اسم الملف", size: "حجم", date: "تاريخ",
      clinicalNotes: "ملاحظات سريرية", noNotes: "لا توجد ملاحظات.",
      errorAnalysis: "خطأ في التحليل", completedAnalysis: "اكتمل التحليل", progressStatus: "تقدم",
      statusLabel: "الحالة", processInterrupted: "توقفت العملية", errorDetails: "تفاصيل:",
      genericError: "خطأ عام.", retryUpload: "إعادة التحميل",
      outputFile: "الملف الناتج", download: "تنزيل", resultsJson: "نتائج AI (JSON)",
      noJson: "لا توجد بيانات مهيكلة.",
      queuedTitle: "في الانتظار", processingTitle: "جاري التحليل",
      queuedDesc: "الملف آمن. في انتظار محرك الذكاء الاصطناعي.",
      processingDesc: "تحليل الأنسجة وإنشاء JSON.",
      outputNotReady: "المخرج غير جاهز."
    },
    results: {
      title: "نتائج تحليل AI", tissueView: "عرض الأنسجة",
      previewNote: "معاينة سريعة. للتحليل العميق، قم بتنزيل المشروع.",
      sickTissue: "نسيج مريض", totalGlom: "إجمالي الكبيبات", scleroGlom: "كبيبات متصلبة",
      fullProject: "مشروع QuPath كامل", downloadZip: "تنزيل .zip للكمبيوتر.",
      btnDownload: "تنزيل المشروع (.zip)"
    },
    profile: { dob: "تاريخ الميلاد", birthPlace: "مكان الميلاد", residence: "إقامة", contacts: "اتصالات" },
    settings: {
      title: "إعدادات الملف",
      subtitle: "إدارة البيانات والأمان.",
      tabs: { profile: "بيانات شخصية", security: "أمان" },
      sections: {
        personal: "معلومات شخصية",
        residence: "إقامة",
        professional: "بيانات مهنية",
        email: "بريد إلكتروني",
        password: "كلمة المرور"
      },
      form: {
        updateBtn: "حفظ التغييرات",
        success: "تم تحديث الملف.",
        emailNotice: "تغيير البريد يتطلب تأكيداً.",
        passwordNotice: "اتركه فارغاً للاحتفاظ بالحالي.",
        savePassword: "تعيين كلمة مرور جديدة",
        newPassword: "كلمة مرور جديدة",
        confirmPassword: "تأكيد كلمة المرور",
        updating: "جاري الحفظ..."
      }
    }
  },
  legal: {
    title: "المركز القانوني والخصوصية",
    subtitle: "الشفافية في التشخيص الطبي.",
    update: "آخر تحديث: 21 يناير 2026",
    tabs: { privacy: "سياسة الخصوصية", terms: "الشروط", cookie: "ملفات تعريف الارتباط", dpa: "معالجة البيانات" },
    content: {
      privacyTitle: "سياسة الخصوصية", privacySub: "لائحة الاتحاد الأوروبي 2016/679",
      termsTitle: "الشروط والأحكام", termsSub: "لوائح الاستخدام",
      cookieTitle: "سياسة الكوكيز", cookieSub: "شفافية التتبع",
      dpaTitle: "الأمان والمعالجة", dpaSub: "ملحق فني",
      disclaimer: "تنبيه - إخلاء مسؤولية طبي:",
      disclaimerText: "Histyon أداة تقنية ولا تحل محل الحكم الطبي. يجب التحقق من AI.",
      privacy: {
        sec1: { title: "1. المراقب", body: "فريق Histyon مسؤول عن بيانات الحساب." },
        sec2: { title: "2. البيانات المجمعة", body: "بيانات مهنية وبيانات صحية للمرضى (مشفرة)." },
        sec3: { title: "3. الغرض", body: "خدمة SaaS، دعم التشخيص، الأمان." },
        sec4: { title: "4. الموقع", body: "البيانات في المنطقة الاقتصادية الأوروبية (EEA)." }
      },
      terms: {
        sec1: { title: "1. المتطلبات", body: "الوصول للمهنيين الطبيين المسجلين فقط." },
        sec2: { title: "2. المسؤولية", body: "يضمن المستخدم الحصول على موافقة مستنيرة." },
        sec3: { title: "3. الأمان", body: "بيانات الاعتماد شخصية. يمنع مشاركة الحساب." }
      },
      cookie: {
        sec1: { title: "1. ما هي", body: "ملفات نصية صغيرة لتحسين التجربة." },
        sec2: { title: "2. تقنية", body: "ضرورية للغاية (جلسة، أمان)." },
        sec3: { title: "3. لا ملفات تعريف", body: "Histyon لا تستخدم ملفات تعريف للتحليل." }
      },
      dpa: {
        cards: { 
            crypto: { title: "تشفير", body: "TLS 1.3 أثناء النقل. AES-256 عند الراحة." }, 
            access: { title: "تحكم الوصول", body: "سياسات RLS صارمة." } 
        },
        sec1: { title: "1. المعالج", body: "يعين المستخدم Histyon كمعالج (المادة 28 GDPR)." },
        sec2: { title: "2. تدابير الأمان", body: "دفاع متعمق: مصادقة، عزل، نسخ احتياطي." }
      }
    }
  },
  validation: {
    passwordLength: "8 أحرف على الأقل",
    passwordComplexity: "يجب أن تحتوي على حرف كبير",
    passwordSpecial: "يجب أن تحتوي على رمز خاص",
    passwordRegexMsg: "استخدم حرفاً كبيراً ورقماً ورمزاً",
    passwordMismatch: "كلمات المرور غير متطابقة",
    name: "أحرف فقط", nameAllowed: "يسمح بالأحرف فقط",
    fiscalCodeLen: "16 حرفاً أبجدياً رقمياً", fiscalCodeFormat: "تنسيق غير صالح",
    emailInvalid: "بريد غير صالح", phoneShort: "الرقم قصير جداً",
    required: "مطلوب", genericError: "خطأ غير متوقع.",
    alreadyRegistered: "هذا البريد مسجل بالفعل.",
    profileError: "خطأ في حفظ الملف: ",
    patientExists: "المريض موجود بالفعل.",
    unauthorized: "غير مصرح",
    dbError: "خطأ قاعدة بيانات: ",
    uploadError: "خطأ URL",
    cloudflareError: "خطأ تحميل Cloudflare",
    networkError: "خطأ في الشبكة",
    fileNotFound: "لم يتم العثور على الملف.",
    fileRetrievalError: "تعذر استرداد الملف",
    credentialsInvalid: "بيانات الاعتماد غير صالحة",
    linkSent: "تم إرسال الرابط بنجاح"
  }
}