export const pt = {
  metadata: {
    titleTemplate: '%s | Histyon',
    defaultTitle: 'Início | Histyon',
    description: "Diagnóstico Médico Avançado",
    loginTitle: "Entrar",
    registerTitle: "Registrar"
  },
  landing: {
    hero: {
      title1: "Histopatologia",
      title2: "Cloud Native.",
      desc: "Gestão, armazenamento e análise IA de lâminas digitais (WSI). Supere os limites do software desktop com uma infraestrutura web escalável e segura.",
      badge1: "WSI Support",
      badge2: "Unlimited Storage",
      badge3: "AI Analysis",
      cta1: "Solicitar Acesso",
      cta2: "Saiba mais"
    },
    workflow: {
      title: "O fluxo,",
      titleColor: "digital.",
      desc: "Uma arquitetura projetada para gerenciar arquivos pesados sem latência, garantindo a máxima precisão diagnóstica.",
      f1_label: "01 — Ingestão",
      f1_title: "Armazenamento Ilimitado",
      f1_desc: "Upload direto e rápido de biópsias de vários Gigabytes. Nossa nuvem elástica elimina a necessidade de servidores físicos caros no hospital.",
      f2_label: "02 — Análise",
      f2_title: "Morfometria IA",
      f2_desc: "A rede neural processa a imagem em segundo plano, identificando tecidos saudáveis e patológicos com métricas objetivas e reprodutíveis.",
      f2_tag1: "Segmentation",
      f2_tag2: "Classification",
      f3_label: "03 — Relatório",
      f3_title: "Dados & QuPath",
      f3_desc: "Obtenha relatórios estruturados e acesse diretamente o projeto QuPath pré-configurado para uma análise microscópica de segundo nível.",
      f4_label: "04 — Privacidade",
      f4_title: "Segurança de Dados",
      f4_desc: "Isolamento total dos pacientes. Cada médico acessa de forma criptografada exclusivamente seus próprios casos. Conformidade GDPR nativa."
    },
    cta: {
      title: "Pronto para implantar?",
      desc: "A infraestrutura Histyon está pronta. Carregue a primeira lâmina e deixe a IA fazer o trabalho pesado.",
      btn: "Criar conta",
      note: "Acesso reservado a pessoal médico e pesquisadores."
    },
    footer: {
      rights: "Todos os direitos reservados.",
      credits: "Créditos",
      dev: "Web Design & Desenvolvimento:",
      platform: "Plataforma",
      support: "Suporte",
      legalSection: "Legal",
      login: "Entrar",
      register: "Registrar",
      docs: "Documentação",
      contact: "Contato",
      legal: "Info Legal"
    }
  },
  auth: {
    sidebar: {
      footer: "Console Histyon \u00A9 2026",
      secure: "Conexão Segura",
      testimonials: [
        { text: "Um passo incrível na gestão de lâminas digitais.", author: "Dr. A. Branco", role: "Patologista Sênior" },
        { text: "A IA reduz tempos de triagem em 40%.", author: "Dr. M. Vermelho", role: "Oncologia Clínica" },
        { text: "Segurança e velocidade. Finalmente.", author: "Eng. G. Verde", role: "DPO Hospitalar" }
      ]
    },
    login: {
      title: "Entrar",
      heading: "Acesso ao Console",
      subheading: "Insira credenciais institucionais.",
      noCredentials: "Sem credenciais?",
      requestAccess: "Solicitar Acesso",
      medicalProfile: "Perfil médico",
      btn: "Entrar",
      forgotPassword: "Esqueceu a senha?",
      successRedirect: "Conta verificada. Faça login.",
      emailConfirmed: "E-mail confirmado com sucesso. Agora você pode entrar.",
      linkInvalid: "Link inválido ou expirado."
    },
    forgotPassword: {
      title: "Recuperar Senha",
      heading: "Esqueceu a senha?",
      subheading: "Insira seu e-mail institucional. Enviaremos um link para redefinição.",
      btn: "Enviar Link",
      backToLogin: "Voltar ao Login",
      successTitle: "E-mail Enviado",
      successDesc: "Se o endereço existir, você receberá instruções em breve.",
      errorGeneric: "Ocorreu um erro. Tente novamente."
    },
    updatePassword: {
      title: "Nova Senha",
      heading: "Definir Nova Senha",
      subheading: "Escolha uma senha segura.",
      btn: "Atualizar Senha",
      success: "Senha atualizada. Redirecionando...",
      errorMatch: "As senhas não coincidem."
    },
    register: {
      title: "Registrar",
      heading: "Novo Perfil",
      subheading: "Configuração guiada.",
      alreadyAccount: "Já tem conta?",
      accessConsole: "Acessar Console",
      steps: {
        one: "Passo 1", two: "Passo 2", three: "Passo 3",
        registry: "Registro", residence: "Residência", profession: "Profissão"
      },
      buttons: { back: "Voltar", next: "Próximo", complete: "Concluir" },
      success: {
        title: "Verifique seu E-mail",
        desc: "Enviamos um link de confirmação. Você deve verificar seu e-mail para acessar o painel.",
        spamNotice: "Não recebeu? Verifique Spam ou Promoções.",
        backToLogin: "Voltar à página de Login"
      }
    },
    form: {
      labels: {
        firstName: "Nome", lastName: "Sobrenome", fiscalCode: "CPF/NIF", gender: "Gênero",
        dob: "Data de Nascimento", birthPlace: "Local de Nascimento", phone: "Celular",
        country: "País", address: "Endereço", civic: "Nº", zip: "CEP", city: "Cidade", province: "Estado",
        medicalLicense: "Nº Licença", hospital: "Instituição", email: "E-mail Institucional", password: "Senha",
        emailSimple: "E-mail", passwordSimple: "Senha", confirmPassword: "Confirmar Senha"
      },
      placeholders: {
        name: "João", surname: "Silva", cf: "123456789...", city: "Cidade", address: "Rua", civic: "Nº",
        zip: "00000-000", municipality: "Município", province: "Estado", license: "Ex. 12345",
        hospital: "Ex. Hospital Geral...", select: "Selecionar", day: "Dia", month: "Mês", year: "Ano",
        phonePlaceholder: "+55 11...", emailPlaceholder: "email@paciente.com"
      },
      options: { male: "Masculino", female: "Feminino", other: "Outro" },
      sections: { credentials: "Credenciais", identity: "Identidade", contacts: "Contatos", domicile: "Domicílio" },
      warnings: { attention: "Atenção", required: "Obrigatório", requiredSymbol: "*", loading: "Carregando..." }
    }
  },
  dashboard: {
    header: { console: "Console", unassigned: "Não atribuído", logout: "Sair" },
    tabs: { patients: "Pacientes", analysis: "Análises", profile: "Dados Pessoais" },
    titles: {
      main: "Console Médica", patientRegistry: "Registro Pacientes", globalHistory: "Histórico Global",
      uploadHistory: "Histórico Uploads", patientFolder: "Pasta Pessoal"
    },
    patients: {
      empty: { title: "Sem pacientes.", subtitle: "Comece adicionando um.", btnNew: "Novo Paciente" },
      card: { openFolder: "Abrir Pasta" },
      modal: {
        title: "Registro Paciente", subtitle: "Preencher obrigatórios (*)",
        btnSave: "Criar Pasta", btnSaving: "Salvando..."
      }
    },
    tickets: {
      empty: "Sem análises no arquivo.",
      table: { id: "ID Ticket", patient: "Paciente", file: "Arquivo", date: "Data", status: "Status" },
      status: {
        completed: "Concluído", processing: "Processando", queued: "Na Fila", uploading: "Enviando...", error: "Erro",
        failedAnalysis: "ANÁLISE FALHOU"
      },
      steps: { uploading: "Upload", queued: "Fila Nuvem", processing: "Análise IA", completed: "Concluído" },
      detail: { analysis: "Análise", patient: "Paciente" }
    },
    upload: {
      title: "Nova Análise Histológica", dragDrop: "Arraste arquivo (SVS, NDPI, TIFF)", remove: "Remover",
      notesPlaceholder: "Notas clínicas (opcional)...", btnStart: "Iniciar Upload e Análise",
      sending: "Envio seguro...", successTitle: "Ticket Criado", successMsg: "Aguardando IA...",
      errorTitle: "Erro Upload", retry: "Tentar Novamente"
    },
    realtime: {
      sourceData: "Dados Fonte", inputFile: "Arquivo Entrada", size: "Tamanho", date: "Data",
      clinicalNotes: "Notas Clínicas", noNotes: "Sem notas.",
      errorAnalysis: "Erro Análise", completedAnalysis: "Análise Concluída", progressStatus: "Progresso",
      statusLabel: "STATUS", processInterrupted: "Processo Interrompido", errorDetails: "Detalhes:",
      genericError: "Erro genérico.", retryUpload: "Tentar Novamente",
      outputFile: "Arquivo Gerado", download: "Baixar", resultsJson: "Resultados IA (JSON)",
      noJson: "Sem dados estruturados.",
      queuedTitle: "Na Fila", processingTitle: "Análise em Curso",
      queuedDesc: "Arquivo seguro. Aguardando motor IA.",
      processingDesc: "Analisando tecidos e gerando JSON.",
      outputNotReady: "Saída não pronta."
    },
    results: {
      title: "Resultados Análise IA", tissueView: "Visualização Tecido",
      previewNote: "Prévia rápida. Para análise profunda, baixe o projeto.",
      sickTissue: "Tecido Doente", totalGlom: "Glomérulos Totais", scleroGlom: "Glomérulos Escleróticos",
      fullProject: "Projeto QuPath Completo", downloadZip: "Baixe o .zip para abrir no PC.",
      btnDownload: "Baixar Projeto (.zip)"
    },
    profile: { dob: "Data Nascimento", birthPlace: "Local Nascimento", residence: "Residência", contacts: "Contatos" },
    settings: {
      title: "Configurações Perfil",
      subtitle: "Gerencie dados pessoais e segurança.",
      tabs: { profile: "Dados Pessoais", security: "Segurança" },
      sections: {
        personal: "Informações Pessoais",
        residence: "Residência",
        professional: "Dados Profissionais",
        email: "E-mail",
        password: "Senha"
      },
      form: {
        updateBtn: "Salvar Alterações",
        success: "Perfil atualizado.",
        emailNotice: "Mudar e-mail requer confirmação.",
        passwordNotice: "Deixar em branco para manter atual.",
        savePassword: "Definir Nova Senha",
        newPassword: "Nova Senha",
        confirmPassword: "Confirmar Senha",
        updating: "Salvando..."
      }
    }
  },
  legal: {
    title: "Centro Legal e Privacidade",
    subtitle: "Transparência no diagnóstico médico.",
    update: "Última atualização: 21 Janeiro 2026",
    tabs: { privacy: "Privacidade", terms: "Termos", cookie: "Cookies", dpa: "Processamento (DPA)" },
    content: {
      privacyTitle: "Política de Privacidade", privacySub: "Regulamento UE 2016/679 (GDPR)",
      termsTitle: "Termos e Condições", termsSub: "Regulamento de uso",
      cookieTitle: "Política de Cookies", cookieSub: "Transparência de rastreamento",
      dpaTitle: "Segurança e DPA", dpaSub: "Apêndice técnico",
      disclaimer: "ATENÇÃO - AVISO MÉDICO:",
      disclaimerText: "Histyon é suporte técnico e não substitui o julgamento médico. A IA deve ser validada.",
      privacy: {
        sec1: { title: "1. Responsável", body: "Histyon Team é responsável pelos dados da conta." },
        sec2: { title: "2. Dados Coletados", body: "Dados Profissionais e Dados de Saúde Pacientes (criptografados)." },
        sec3: { title: "3. Finalidade", body: "Serviço SaaS, Suporte Diagnóstico, Segurança." },
        sec4: { title: "4. Localização", body: "Dados no EEE (Espaço Econômico Europeu)." }
      },
      terms: {
        sec1: { title: "1. Requisitos", body: "Acesso reservado a médicos registrados." },
        sec2: { title: "2. Responsabilidade", body: "O Usuário garante ter consentimento informado." },
        sec3: { title: "3. Segurança", body: "Credenciais pessoais. Compartilhamento proibido." }
      },
      cookie: {
        sec1: { title: "1. O que são", body: "Pequenos arquivos de texto para melhorar experiência." },
        sec2: { title: "2. Técnicos", body: "Estritamente necessários (Sessão, Segurança)." },
        sec3: { title: "3. Sem Perfil", body: "Histyon NÃO usa cookies de perfil." }
      },
      dpa: {
        cards: { 
            crypto: { title: "Criptografia", body: "TLS 1.3 trânsito. AES-256 repouso." }, 
            access: { title: "Controle Acesso", body: "Políticas RLS estritas." } 
        },
        sec1: { title: "1. Processador", body: "Usuário nomeia Histyon como Processador (Art. 28 GDPR)." },
        sec2: { title: "2. Medidas Segurança", body: "Defesa em Profundidade: Auth, Isolamento, Backups." }
      }
    }
  },
  validation: {
    passwordLength: "Mínimo 8 caracteres",
    passwordComplexity: "Deve conter uma Maiúscula",
    passwordSpecial: "Deve conter caractere especial",
    passwordRegexMsg: "Use maiúscula, número e especial",
    passwordMismatch: "As senhas não coincidem",
    name: "Apenas letras", nameAllowed: "Apenas letras permitidas",
    fiscalCodeLen: "16 caracteres alfanuméricos", fiscalCodeFormat: "Formato inválido",
    emailInvalid: "E-mail inválido", phoneShort: "Número muito curto",
    required: "Obrigatório", genericError: "Erro inesperado.",
    alreadyRegistered: "Este e-mail já está registrado.",
    profileError: "Erro ao salvar perfil: ",
    patientExists: "Paciente já existe.",
    unauthorized: "Não autorizado",
    dbError: "Erro DB: ",
    uploadError: "Erro URL",
    cloudflareError: "Erro upload Cloudflare",
    networkError: "Erro de rede",
    fileNotFound: "Arquivo não encontrado.",
    fileRetrievalError: "Impossível recuperar arquivo",
    credentialsInvalid: "Credenciais inválidas",
    linkSent: "Link enviado com sucesso"
  }
}