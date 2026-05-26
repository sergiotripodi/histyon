export const es = {
  metadata: {
    titleTemplate: '%s - Histyon',
    defaultTitle: 'Inicio | Histyon',
    description: "Diagnóstico Médico Avanzado",
    loginTitle: "Acceso",
    registerTitle: "Registro"
  },
  landing: {
    hero: {
      title1: "Histopatología",
      title2: "Cloud Native.",
      desc: "Gestión, almacenamiento y análisis IA de portaobjetos digitales (WSI). Supera los límites del software de escritorio con una infraestructura web escalable y segura.",
      badge1: "WSI Support",
      badge2: "Unlimited Storage",
      badge3: "AI Analysis",
      cta1: "Solicitar Acceso",
      cta2: "Saber más"
    },
    workflow: {
      title: "El flujo,",
      titleColor: "digital.",
      desc: "Una arquitectura diseñada para gestionar archivos pesados sin latencia, garantizando la máxima precisión diagnóstica.",
      f1_label: "01 — Ingesta",
      f1_title: "Almacenamiento Ilimitado",
      f1_desc: "Carga directa y rápida de biopsias de varios Gigabytes. Nuestra nube elástica elimina la necesidad de costosos servidores físicos en el hospital.",
      f2_label: "02 — Análisis",
      f2_title: "Morfometría IA",
      f2_desc: "La red neuronal procesa la imagen en segundo plano, identificando tejidos sanos y patológicos con métricas objetivas y reproducibles.",
      f2_tag1: "Segmentation",
      f2_tag2: "Classification",
      f3_label: "03 — Informe",
      f3_title: "Datos y QuPath",
      f3_desc: "Obtén informes estructurados y accede directamente al proyecto QuPath preconfigurado para un análisis microscópico de segundo nivel.",
      f4_label: "04 — Privacidad",
      f4_title: "Seguridad de Datos",
      f4_desc: "Aislamiento total de pacientes. Cada médico accede de forma cifrada exclusivamente a sus propios casos. Cumplimiento GDPR nativo."
    },
    cta: {
      title: "¿Listo para desplegar?",
      desc: "La infraestructura Histyon está lista. Carga el primer portaobjetos y deja que la IA haga el trabajo pesado.",
      btn: "Crear cuenta",
      note: "Acceso reservado a personal médico e investigadores."
    },
    footer: {
      rights: "Todos los derechos reservados.",
      credits: "Créditos",
      dev: "Diseño Web y Desarrollo:",
      platform: "Plataforma",
      support: "Soporte",
      legalSection: "Legal",
      login: "Acceso",
      register: "Registro",
      docs: "Documentación",
      contact: "Contacto",
      legal: "Info Legal"
    },
    header: { toConsole: "Volver a la Consola" }
  },
  auth: {
    sidebar: {
      footer: "Consola Histyon \u00A9 2026",
      secure: "Conexión Segura",
      testimonials: [
        { text: "Un paso adelante increíble en la gestión digital.", author: "Dr. A. Blanco", role: "Patólogo Senior" },
        { text: "La IA reduce tiempos de cribado un 40%.", author: "Dr. M. Rojo", role: "Oncología Clínica" },
        { text: "Seguridad y velocidad. Por fin.", author: "Ing. G. Verde", role: "DPO Hospitalario" }
      ]
    },
    login: {
      title: "Acceso",
      heading: "Acceso a Consola",
      subheading: "Introduce credenciales institucionales.",
      noCredentials: "¿No tienes credenciales?",
      requestAccess: "Solicitar Acceso",
      medicalProfile: "Perfil médico",
      btn: "Entrar",
      forgotPassword: "¿Olvidaste la contraseña?",
      successRedirect: "Cuenta verificada. Inicia sesión.",
      emailConfirmed: "Email confirmada con éxito. Ahora puedes acceder.",
      linkInvalid: "Enlace no válido o caducado.",
      errorInvalidCredentials: "Email o contraseña incorrectos.",
      errorAccountLocked: "Tu cuenta está temporalmente bloqueada.",
      errorUnverified: "Verifica tu email antes de iniciar sesión.",
      errorGeneric: "Se produjo un error al iniciar sesión.",
      successRegistered: "Registro completado. Inicia sesión.",
      successPasswordReset: "Contraseña actualizada. Inicia sesión."
    },
    forgotPassword: {
      title: "Recuperar Contraseña",
      heading: "¿Contraseña olvidada?",
      subheading: "Introduce tu email institucional. Te enviaremos un enlace para restablecerla.",
      btn: "Enviar Enlace",
      backToLogin: "Volver al Acceso",
      successTitle: "Email Enviado",
      successDesc: "Si la dirección existe, recibirás instrucciones en breve.",
      errorGeneric: "Ocurrió un error. Inténtalo más tarde."
    },
    updatePassword: {
      title: "Nueva Contraseña",
      heading: "Establecer Nueva Contraseña",
      subheading: "Elige una contraseña segura.",
      btn: "Actualizar Contraseña",
      success: "Contraseña actualizada. Redirigiendo...",
      errorMatch: "Las contraseñas no coinciden.",
      errorWeak: "La contraseña no cumple los requisitos de seguridad.",
      errorSame: "La nueva contraseña debe ser diferente a la actual.",
      errorUpdateFailed: "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
      errorDefault: "Se produjo un error."
    },
    deleted: {
      heading: "Cuenta eliminada",
      subheading: "Lamentamos verte partir.",
      message: "Tu cuenta ha sido eliminada con éxito. Todos los datos personales, pacientes, análisis y archivos han sido eliminados permanentemente de nuestros servidores.",
      homeBtn: "Volver al Inicio"
    },
    verified: {
      title: "Email Confirmado",
      desc: "Tu cuenta ha sido activada con éxito.",
      btn: "Iniciar Sesión"
    },
    register: {
      title: "Registro",
      heading: "Nuevo Perfil",
      subheading: "Configuración guiada.",
      alreadyAccount: "¿Ya tienes cuenta?",
      accessConsole: "Acceder a Consola",
      steps: {
        one: "Paso 1", two: "Paso 2", three: "Paso 3",
        registry: "Registro", residence: "Residencia", profession: "Profesión"
      },
      buttons: { back: "Atrás", next: "Siguiente", complete: "Completar" },
      success: {
        title: "Revisa tu Email",
        desc: "Te hemos enviado un enlace de confirmación. Debes verificar tu email para acceder.",
        spamNotice: "¿No recibiste el email? Revisa Spam o Promociones.",
        backToLogin: "Volver a la página de Acceso"
      }
    },
    form: {
      labels: {
        firstName: "Nombre", lastName: "Apellido", fiscalCode: "NIF/DNI", gender: "Género",
        dob: "Fecha de Nacimiento", birthPlace: "Lugar de Nacimiento", phone: "Móvil",
        country: "País", address: "Dirección", civic: "Nº", zip: "CP", city: "Ciudad", province: "Provincia",
        medicalLicense: "Nº Colegiado", hospital: "Institución", email: "Email Institucional", password: "Contraseña",
        emailSimple: "Email", passwordSimple: "Contraseña", confirmPassword: "Confirmar Contraseña"
      },
      placeholders: {
        name: "Juan", surname: "García", cf: "12345678A", city: "Ciudad", address: "Calle", civic: "Nº",
        zip: "28001", municipality: "Municipio", province: "Provincia", license: "Ej. 12345",
        hospital: "Ej. Hospital General...", select: "Seleccionar", day: "Día", month: "Mes", year: "Año",
        phonePlaceholder: "+34 600...", emailPlaceholder: "email@paciente.com"
      },
      options: { male: "Masculino", female: "Femenino", other: "Otro" },
      sections: { credentials: "Credenciales", identity: "Identidad", contacts: "Contactos", domicile: "Domicilio" },
      warnings: { attention: "Atención", required: "Obligatorio", requiredSymbol: "*", loading: "Cargando..." }
    }
  },
  dashboard: {
    header: { console: "Consola", unassigned: "Sin asignar", logout: "Salir", role: "Médico", assistance: "Asistencia" },
    tabs: { patients: "Pacientes", analysis: "Análisis", profile: "Datos Personales", settings: "Ajustes" },
    titles: {
      main: "Consola Médica", patientRegistry: "Registro Pacientes", globalHistory: "Historial Global",
      uploadHistory: "Historial Cargas", patientFolder: "Carpeta Personal"
    },
    patients: {
      empty: { title: "Sin pacientes.", subtitle: "Añade uno nuevo.", btnNew: "Nuevo Paciente" },
      card: { openFolder: "Abrir Carpeta" },
      modal: {
        title: "Registro Paciente", subtitle: "Rellenar campos obligatorios (*)",
        btnSave: "Crear Carpeta", btnSaving: "Guardando..."
      },
      delete: {
        title: "Eliminar Paciente", subtitle: "Todos los datos serán eliminados permanentemente. Acción irreversible.",
        warningLabel: "Advertencia", warning: "Todos los archivos de análisis (escáneres, mosaicos DZI, proyectos QuPath, máscaras de región) se eliminarán permanentemente del almacenamiento en la nube.",
        ticketCount: "análisis serán eliminados",
        confirm: "Introduce el código fiscal para confirmar:", placeholder: "Código fiscal",
        btnCancel: "Cancelar", btnDelete: "Eliminar Permanentemente", btnDeleting: "Eliminando..."
      }
    },
    tickets: {
      empty: "Sin análisis en archivo.",
      table: { id: "ID Ticket", patient: "Paciente", file: "Archivo", date: "Fecha", status: "Estado" },
      status: {
        completed: "Completado", processing: "Procesando", queued: "En Cola", uploading: "Cargando...", error: "Error",
        failedAnalysis: "ANÁLISIS FALLIDO"
      },
      steps: { uploading: "Carga", queued: "Cola Nube", processing: "Análisis IA", completed: "Completado" },
      detail: { analysis: "Análisis", patient: "Paciente" }
    },
    upload: {
      title: "Nuevo Análisis Histológico", dragDrop: "Arrastra archivo (SVS, NDPI, TIFF)", remove: "Eliminar",
      notesPlaceholder: "Notas clínicas (opcional)...", btnStart: "Iniciar Carga y Análisis",
      sending: "Envío seguro a Nube...", successTitle: "Ticket Creado", successMsg: "Esperando IA...",
      errorTitle: "Error Carga", retry: "Reintentar"
    },
    realtime: {
      sourceData: "Datos Fuente", inputFile: "Archivo Entrada", size: "Tamaño", date: "Fecha",
      clinicalNotes: "Notas Clínicas", noNotes: "Sin notas.",
      errorAnalysis: "Error Análisis", completedAnalysis: "Análisis Completado", progressStatus: "Progreso",
      statusLabel: "ESTADO", processInterrupted: "Proceso Interrumpido", errorDetails: "Detalles:",
      genericError: "Error genérico.", retryUpload: "Reintentar Carga",
      outputFile: "Archivo Generado", download: "Descargar", resultsJson: "Resultados IA (JSON)",
      noJson: "Sin datos estructurados.",
      queuedTitle: "En Cola", processingTitle: "Análisis en Curso",
      queuedDesc: "Archivo seguro. Esperando motor IA.",
      processingDesc: "Analizando tejidos y generando JSON.",
      outputNotReady: "Salida no lista.",
      interrupted: "Análisis interrumpido",
      reportReady: "Informe disponible",
      analyzing: "Análisis en curso",
      openViewer: "Visor",
      downloadQupath: "QuPath",
      downloadRegion: "Regiones",
      tissueStats: "Estadísticas",
      loadingTissues: "Cargando...", reportUnavailable: "Informe no disponible"
    },
    results: {
      title: "Resultados Análisis IA", tissueView: "Visualización Tejido",
      previewNote: "Vista previa. Para análisis profundo, descarga el proyecto.",
      sickTissue: "Tejido Enfermo", totalGlom: "Glomérulos Totales", scleroGlom: "Glomérulos Escleróticos",
      fullProject: "Proyecto QuPath Completo", downloadZip: "Descarga el .zip para abrir en PC.",
      btnDownload: "Descargar Proyecto (.zip)"
    },
    profile: { dob: "Fecha Nacimiento", birthPlace: "Lugar Nacimiento", residence: "Residencia", contacts: "Contactos" },
    settings: {
      title: "Ajustes Perfil",
      subtitle: "Gestiona datos personales y seguridad.",
      tabs: { profile: "Datos Personales", security: "Seguridad" },
      sections: {
        personal: "Información Personal",
        residence: "Residencia",
        professional: "Datos Profesionales",
        email: "Email",
        password: "Contraseña",
        security: "Cuenta y Seguridad"
      },
      form: {
        updateBtn: "Guardar Cambios",
        success: "Perfil actualizado.",
        emailNotice: "Cambiar email requiere confirmación.",
        passwordNotice: "Dejar vacío para mantener actual.",
        savePassword: "Fijar Nueva Contraseña",
        newPassword: "Nueva Contraseña",
        confirmPassword: "Confirmar Contraseña",
        updating: "Guardando..."
      },
      danger: {
        title: "Zona de Peligro",
        subtitle: "Esta acción es irreversible y elimina todos los datos.",
        deleteBtn: "Eliminar Cuenta",
        deleteDesc: "Elimina permanentemente tu cuenta, todos los pacientes, todos los análisis y todos los archivos almacenados.",
        modal: {
          title: "Eliminar tu cuenta",
          warning: "Estás a punto de eliminar permanentemente:",
          items: [
            "Tu cuenta y perfil médico",
            "Todos los pacientes registrados",
            "Todos los análisis y tickets",
            "Todos los archivos almacenados en la nube"
          ],
          irreversible: "Esta acción es irreversible y no puede deshacerse.",
          passwordLabel: "Confirma introduciendo tu contraseña",
          confirmBtn: "Eliminar permanentemente",
          cancelBtn: "Cancelar",
          deleting: "Eliminando...",
          errorWrong: "Contraseña incorrecta. Inténtalo de nuevo.",
          errorGeneric: "Error durante la eliminación. Inténtalo de nuevo."
        }
      }
    }
  },
  legal: {
    title: "Centro Legal y Privacidad",
    subtitle: "Transparencia en diagnóstico médico.",
    update: "Última actualización: 21 Enero 2026",
    tabs: { privacy: "Privacidad", terms: "Términos", cookie: "Cookies", dpa: "Procesamiento (DPA)" },
    content: {
      privacyTitle: "Política de Privacidad", privacySub: "Reglamento UE 2016/679 (GDPR)",
      termsTitle: "Términos y Condiciones", termsSub: "Reglamento de uso",
      cookieTitle: "Política de Cookies", cookieSub: "Transparencia de rastreo",
      dpaTitle: "Seguridad y DPA", dpaSub: "Apéndice técnico",
      disclaimer: "Aviso Médico",
      disclaimerText: "Histyon es soporte técnico y no sustituye el juicio médico. El análisis IA debe ser validado.",
      privacy: {
        sec1: { title: "1. Responsable", body: "Histyon Team es el responsable de los datos de cuenta." },
        sec2: { title: "2. Datos Recogidos", body: "Datos Profesionales y Datos de Salud Pacientes (cifrados)." },
        sec3: { title: "3. Finalidad", body: "Servicio SaaS, Soporte Diagnóstico, Seguridad." },
        sec4: { title: "4. Ubicación", body: "Datos alojados en el EEE (Espacio Económico Europeo)." },
        sec5: { title: "5. Derecho de Supresión (Art. 17 RGPD)", body: "Tiene derecho a la eliminación permanente de datos de pacientes y archivos de análisis. La eliminación se puede realizar desde el panel en cualquier momento y es inmediata e irreversible." }
      },
      terms: {
        sec1: { title: "1. Requisitos", body: "Acceso reservado a profesionales médicos registrados." },
        sec2: { title: "2. Responsabilidad", body: "El Usuario garantiza tener consentimiento informado." },
        sec3: { title: "3. Seguridad", body: "Credenciales personales. Prohibido compartir cuenta." }
      },
      cookie: {
        sec1: { title: "1. Qué son", body: "Pequeños archivos de texto para mejorar la experiencia." },
        sec2: { title: "2. Técnicas", body: "Estrictamente necesarias (Sesión, Seguridad)." },
        sec3: { title: "3. Sin Perfiles", body: "Histyon NO usa cookies de perfilado publicitario." }
      },
      dpa: {
        cards: { 
            crypto: { title: "Cifrado", body: "TLS 1.3 en tránsito. AES-256 en reposo." }, 
            access: { title: "Control Acceso", body: "Políticas RLS estrictas." } 
        },
        sec1: { title: "1. Encargado Tratamiento", body: "Usuario nombra a Histyon Encargado (Art. 28 GDPR)." },
        sec2: { title: "2. Medidas Seguridad", body: "Defensa en Profundidad: Autenticación, Aislamiento, Backups." }
      }
    }
  },
  validation: {
    passwordLength: "Mínimo 8 caracteres",
    passwordComplexity: "Debe contener una Mayúscula",
    passwordSpecial: "Debe contener un carácter especial",
    passwordRegexMsg: "Usa mayúscula, número y especial",
    passwordMismatch: "Las contraseñas no coinciden",
    name: "Solo letras", nameAllowed: "Solo letras permitidas",
    fiscalCodeLen: "16 car. alfanuméricos", fiscalCodeFormat: "Formato inválido",
    emailInvalid: "Email inválido", phoneShort: "Número muy corto",
    required: "Obligatorio", genericError: "Error inesperado.",
    alreadyRegistered: "Este email ya está registrado.",
    profileError: "Error guardando perfil: ",
    patientExists: "Paciente ya existe.",
    unauthorized: "No autorizado",
    dbError: "Error DB: ",
    uploadError: "Error URL",
    networkError: "Error de red",
    fileNotFound: "Archivo no encontrado.",
    fileRetrievalError: "Imposible recuperar archivo",
    credentialsInvalid: "Credenciales inválidas",
    linkSent: "Enlace enviado correctamente",
    deletePatientError: "Error al eliminar el paciente."
  }
}