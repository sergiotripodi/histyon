export const zh = {
  metadata: {
    titleTemplate: '%s | Histyon',
    defaultTitle: '首页 | Histyon',
    description: "先进医疗诊断",
    loginTitle: "登录",
    registerTitle: "注册"
  },
  landing: {
    hero: {
      title1: "组织病理学",
      title2: "云原生。",
      desc: "数字切片（WSI）的管理、存储和AI分析。通过可扩展且安全的Web基础设施克服桌面软件的限制。",
      badge1: "WSI Support",
      badge2: "Unlimited Storage",
      badge3: "AI Analysis",
      cta1: "申请访问",
      cta2: "了解更多"
    },
    workflow: {
      title: "工作流程，",
      titleColor: "数字化。",
      desc: "专为处理大文件而设计的架构，无延迟，确保最大的诊断精度。",
      f1_label: "01 — 摄取",
      f1_title: "无限存储",
      f1_desc: "直接且快速上传数GB的活检数据。我们的弹性云消除了医院昂贵物理服务器的需求。",
      f2_label: "02 — 分析",
      f2_title: "AI 形态计量学",
      f2_desc: "神经网络在后台处理图像，通过客观和可重复的指标识别健康和病变组织。",
      f2_tag1: "Segmentation",
      f2_tag2: "Classification",
      f3_label: "03 — 报告",
      f3_title: "数据与 QuPath",
      f3_desc: "获取结构化报告并直接访问预配置的 QuPath 项目，进行二级显微分析。",
      f4_label: "04 — 隐私",
      f4_title: "数据安全",
      f4_desc: "患者完全隔离。每位医生仅以加密方式访问自己的病例。原生符合 GDPR。"
    },
    cta: {
      title: "准备部署？",
      desc: "Histyon 基础设施已就绪。上传第一张切片，让 AI 完成繁重的工作。",
      btn: "创建账户",
      note: "仅限医务人员和研究人员访问。"
    },
    footer: {
      rights: "保留所有权利。",
      credits: "致谢",
      dev: "网页设计与开发：",
      platform: "平台",
      support: "支持",
      legalSection: "法律",
      login: "登录",
      register: "注册",
      docs: "文档",
      contact: "联系我们",
      legal: "法律信息"
    }
  },
  auth: {
    sidebar: {
      footer: "Histyon 控制台 \u00A9 2026",
      secure: "安全连接",
      testimonials: [
        { text: "数字切片管理惊人的一步。", author: "A. 白医生", role: "高级病理学家" },
        { text: "AI 将筛查时间缩短了 40%。", author: "M. 红医生", role: "临床肿瘤学" },
        { text: "安全与速度。终于实现了。", author: "G. 绿工程师", role: "医院 DPO" }
      ]
    },
    login: {
      title: "登录",
      heading: "访问控制台",
      subheading: "输入机构凭证。",
      noCredentials: "没有凭证？",
      requestAccess: "申请访问",
      medicalProfile: "医疗档案",
      btn: "登录",
      forgotPassword: "忘记密码？",
      successRedirect: "账户已验证。请登录。",
      emailConfirmed: "邮箱确认成功。现在可以登录。",
      linkInvalid: "链接无效或已过期。"
    },
    forgotPassword: {
      title: "密码恢复",
      heading: "忘记密码？",
      subheading: "输入您的机构邮箱。我们将发送重置链接。",
      btn: "发送链接",
      backToLogin: "返回登录",
      successTitle: "邮件已发送",
      successDesc: "如果地址存在，您将很快收到说明。",
      errorGeneric: "发生错误。"
    },
    updatePassword: {
      title: "新密码",
      heading: "设置新密码",
      subheading: "选择一个安全的密码。",
      btn: "更新密码",
      success: "密码已更新。正在重定向...",
      errorMatch: "密码不匹配。"
    },
    register: {
      title: "注册",
      heading: "新档案",
      subheading: "引导配置。",
      alreadyAccount: "已有账户？",
      accessConsole: "进入控制台",
      steps: {
        one: "步骤 1", two: "步骤 2", three: "步骤 3",
        registry: "登记", residence: "居住地", profession: "职业"
      },
      buttons: { back: "返回", next: "下一步", complete: "完成" },
      success: {
        title: "检查您的邮件",
        desc: "我们已发送确认链接。您必须验证邮箱才能访问仪表板。",
        spamNotice: "没收到？检查垃圾邮件或促销文件夹。",
        backToLogin: "返回登录页面"
      }
    },
    form: {
      labels: {
        firstName: "名字", lastName: "姓氏", fiscalCode: "税号", gender: "性别",
        dob: "出生日期", birthPlace: "出生地", phone: "手机",
        country: "国家", address: "地址", civic: "门牌", zip: "邮编", city: "城市", province: "省份",
        medicalLicense: "执照号", hospital: "机构", email: "机构邮箱", password: "密码",
        emailSimple: "邮箱", passwordSimple: "密码", confirmPassword: "确认密码"
      },
      placeholders: {
        name: "小明", surname: "王", cf: "税号...", city: "城市", address: "街道", civic: "号",
        zip: "100000", municipality: "区/县", province: "省份", license: "例 12345",
        hospital: "例 总医院...", select: "选择", day: "日", month: "月", year: "年",
        phonePlaceholder: "+86 1...", emailPlaceholder: "email@patient.com"
      },
      options: { male: "男", female: "女", other: "其他" },
      sections: { credentials: "凭证", identity: "身份", contacts: "联系方式", domicile: "居住地" },
      warnings: { attention: "注意", required: "必填", requiredSymbol: "*", loading: "加载中..." }
    }
  },
  dashboard: {
    header: { console: "控制台", unassigned: "未分配", logout: "登出" },
    tabs: { patients: "患者", analysis: "分析", profile: "个人资料" },
    titles: {
      main: "医疗控制台", patientRegistry: "患者登记", globalHistory: "全局历史",
      uploadHistory: "上传历史", patientFolder: "个人文件夹"
    },
    patients: {
      empty: { title: "无患者。", subtitle: "开始添加一个。", btnNew: "新患者" },
      card: { openFolder: "打开文件夹" },
      modal: {
        title: "登记患者", subtitle: "填写必填项 (*)",
        btnSave: "创建文件夹", btnSaving: "保存中..."
      }
    },
    tickets: {
      empty: "存档中无分析。",
      table: { id: "工单 ID", patient: "患者", file: "文件", date: "日期", status: "状态" },
      status: {
        completed: "完成", processing: "处理中", queued: "排队中", uploading: "上传中...", error: "错误",
        failedAnalysis: "分析失败"
      },
      steps: { uploading: "上传", queued: "云排队", processing: "AI 分析", completed: "完成" },
      detail: { analysis: "分析", patient: "患者" }
    },
    upload: {
      title: "新组织学分析", dragDrop: "拖放文件 (SVS, NDPI, TIFF)", remove: "移除",
      notesPlaceholder: "临床备注 (可选)...", btnStart: "开始上传与分析",
      sending: "安全发送至云端...", successTitle: "工单已创建", successMsg: "等待 AI...",
      errorTitle: "上传错误", retry: "重试"
    },
    realtime: {
      sourceData: "源数据", inputFile: "输入文件名", size: "大小", date: "日期",
      clinicalNotes: "临床备注", noNotes: "无备注。",
      errorAnalysis: "分析错误", completedAnalysis: "分析完成", progressStatus: "进度",
      statusLabel: "状态", processInterrupted: "过程由于中断", errorDetails: "详情：",
      genericError: "通用错误。", retryUpload: "重试上传",
      outputFile: "生成的文件", download: "下载", resultsJson: "AI 结果 (JSON)",
      noJson: "无结构化数据。",
      queuedTitle: "排队中", processingTitle: "正在分析",
      queuedDesc: "文件安全。等待 AI 引擎。",
      processingDesc: "正在分析组织并生成 JSON。",
      outputNotReady: "输出未就绪。"
    },
    results: {
      title: "AI 分析结果", tissueView: "组织可视化",
      previewNote: "快速预览。深度分析请下载项目。",
      sickTissue: "病变组织", totalGlom: "总肾小球", scleroGlom: "硬化肾小球",
      fullProject: "完整 QuPath 项目", downloadZip: "下载 .zip 以在 PC 上打开。",
      btnDownload: "下载项目 (.zip)"
    },
    profile: { dob: "出生日期", birthPlace: "出生地", residence: "居住地", contacts: "联系方式" },
    settings: {
      title: "个人资料设置",
      subtitle: "管理个人数据与安全。",
      tabs: { profile: "个人数据", security: "安全" },
      sections: {
        personal: "个人信息",
        residence: "居住地",
        professional: "职业数据",
        email: "邮箱",
        password: "密码"
      },
      form: {
        updateBtn: "保存更改",
        success: "个人资料已更新。",
        emailNotice: "更改邮箱需要确认。",
        passwordNotice: "留空以保持当前密码。",
        savePassword: "设置新密码",
        newPassword: "新密码",
        confirmPassword: "确认密码",
        updating: "保存中..."
      }
    }
  },
  legal: {
    title: "法律与隐私中心",
    subtitle: "医疗诊断的透明度。",
    update: "最后更新：2026年1月21日",
    tabs: { privacy: "隐私政策", terms: "条款", cookie: "Cookies", dpa: "数据处理 (DPA)" },
    content: {
      privacyTitle: "隐私政策", privacySub: "欧盟法规 2016/679 (GDPR)",
      termsTitle: "条款与条件", termsSub: "使用规则",
      cookieTitle: "Cookie 政策", cookieSub: "追踪透明度",
      dpaTitle: "安全与 DPA", dpaSub: "技术附录",
      disclaimer: "注意 - 医疗免责声明：",
      disclaimerText: "Histyon 是技术工具，不替代医疗判断。AI 必须经过验证。",
      privacy: {
        sec1: { title: "1. 控制者", body: "Histyon Team 负责账户数据。" },
        sec2: { title: "2. 收集的数据", body: "职业数据和患者健康数据 (加密)。" },
        sec3: { title: "3. 目的", body: "SaaS 服务, 诊断支持, 安全。" },
        sec4: { title: "4. 地点", body: "数据位于欧洲经济区 (EEA)。" }
      },
      terms: {
        sec1: { title: "1. 要求", body: "仅限注册医疗专业人员访问。" },
        sec2: { title: "2. 责任", body: "用户保证已获得知情同意。" },
        sec3: { title: "3. 安全", body: "凭证是个人的。禁止共享账户。" }
      },
      cookie: {
        sec1: { title: "1. 是什么", body: "改善体验的小文本文件。" },
        sec2: { title: "2. 技术性", body: "严格必要 (会话, 安全)。" },
        sec3: { title: "3. 无画像", body: "Histyon 不使用画像 Cookie。" }
      },
      dpa: {
        cards: { 
            crypto: { title: "加密", body: "传输中 TLS 1.3。静态 AES-256。" }, 
            access: { title: "访问控制", body: "严格的 RLS 策略。" } 
        },
        sec1: { title: "1. 处理者", body: "用户指定 Histyon 为处理者 (GDPR 第28条)。" },
        sec2: { title: "2. 安全措施", body: "纵深防御：认证, 隔离, 备份。" }
      }
    }
  },
  validation: {
    passwordLength: "至少 8 个字符",
    passwordComplexity: "必须包含大写字母",
    passwordSpecial: "必须包含特殊字符",
    passwordRegexMsg: "使用大写字母、数字和特殊字符",
    passwordMismatch: "密码不匹配",
    name: "仅限字母", nameAllowed: "仅允许字母",
    fiscalCodeLen: "16 位字母数字", fiscalCodeFormat: "格式无效",
    emailInvalid: "邮箱无效", phoneShort: "号码太短",
    required: "必填", genericError: "意外错误。",
    alreadyRegistered: "此邮箱已注册。",
    profileError: "保存错误：",
    patientExists: "患者已存在。",
    unauthorized: "未授权",
    dbError: "数据库错误：",
    uploadError: "URL 错误",
    cloudflareError: "Cloudflare 上传错误",
    networkError: "网络错误",
    fileNotFound: "文件未找到。",
    fileRetrievalError: "无法检索文件",
    credentialsInvalid: "凭证无效",
    linkSent: "链接发送成功"
  }
}