export const fr = {
  metadata: {
    titleTemplate: '%s | Histyon',
    defaultTitle: 'Accueil | Histyon',
    description: "Diagnostic Médical Avancé",
    loginTitle: "Connexion",
    registerTitle: "Inscription"
  },
  landing: {
    hero: {
      title1: "Histopathologie",
      title2: "Cloud Native.",
      desc: "Gestion, stockage et analyse IA de lames numériques (WSI). Dépassez les limites des logiciels de bureau avec une infrastructure web évolutive et sécurisée.",
      badge1: "WSI Support",
      badge2: "Unlimited Storage",
      badge3: "AI Analysis",
      cta1: "Demander l'accès",
      cta2: "En savoir plus"
    },
    workflow: {
      title: "Le flux,",
      titleColor: "numérique.",
      desc: "Une architecture conçue pour gérer des fichiers lourds sans latence, garantissant une précision diagnostique maximale.",
      f1_label: "01 — Ingestion",
      f1_title: "Stockage Illimité",
      f1_desc: "Téléversement direct et rapide de biopsies de plusieurs gigaoctets. Notre cloud élastique élimine le besoin de serveurs physiques coûteux à l'hôpital.",
      f2_label: "02 — Analyse",
      f2_title: "Morphométrie IA",
      f2_desc: "Le réseau de neurones traite l'image en arrière-plan, identifiant les tissus sains et pathologiques avec des métriques objectives et reproductibles.",
      f2_tag1: "Segmentation",
      f2_tag2: "Classification",
      f3_label: "03 — Rapport",
      f3_title: "Données & QuPath",
      f3_desc: "Obtenez des rapports structurés et accédez directement au projet QuPath préconfiguré pour une analyse microscopique de second niveau.",
      f4_label: "04 — Confidentialité",
      f4_title: "Sécurité des Données",
      f4_desc: "Isolation totale des patients. Chaque médecin accède de manière chiffrée uniquement à ses propres cas. Conformité RGPD native."
    },
    cta: {
      title: "Prêt à déployer ?",
      desc: "L'infrastructure Histyon est prête. Chargez la première lame et laissez l'IA faire le gros du travail.",
      btn: "Créer un compte",
      note: "Accès réservé au personnel médical et aux chercheurs."
    },
    footer: {
      rights: "Tous droits réservés.",
      credits: "Crédits",
      dev: "Web Design & Développement :",
      platform: "Plateforme",
      support: "Support",
      legalSection: "Légal",
      login: "Connexion",
      register: "Inscription",
      docs: "Documentation",
      contact: "Contact",
      legal: "Mentions Légales"
    }
  },
  auth: {
    sidebar: {
      footer: "Console Histyon \u00A9 2026",
      secure: "Connexion Sécurisée",
      testimonials: [
        { text: "Une avancée incroyable dans la gestion des lames numériques.", author: "Dr. A. Blanc", role: "Pathologiste Senior" },
        { text: "L'IA réduit les temps de dépistage de 40%.", author: "Dr. M. Rouge", role: "Oncologie Clinique" },
        { text: "Sécurité et rapidité. Enfin.", author: "Ing. G. Vert", role: "DPO Hospitalier" }
      ]
    },
    login: {
      title: "Connexion",
      heading: "Accès Console",
      subheading: "Entrez vos identifiants institutionnels.",
      noCredentials: "Pas d'identifiants ?",
      requestAccess: "Demander l'Accès",
      medicalProfile: "Profil médical",
      btn: "Se connecter",
      forgotPassword: "Mot de passe oublié ?",
      successRedirect: "Compte vérifié. Veuillez vous connecter.",
      emailConfirmed: "Email confirmé avec succès. Vous pouvez maintenant vous connecter.",
      linkInvalid: "Lien invalide ou expiré."
    },
    forgotPassword: {
      title: "Récupération",
      heading: "Mot de passe oublié ?",
      subheading: "Entrez votre email institutionnel. Nous vous enverrons un lien de réinitialisation.",
      btn: "Envoyer le lien",
      backToLogin: "Retour",
      successTitle: "Email Envoyé",
      successDesc: "Si l'adresse existe, vous recevrez les instructions sous peu.",
      errorGeneric: "Une erreur est survenue."
    },
    updatePassword: {
      title: "Nouveau Mot de Passe",
      heading: "Définir Nouveau Mot de Passe",
      subheading: "Choisissez un mot de passe sécurisé.",
      btn: "Mettre à jour",
      success: "Mot de passe mis à jour. Redirection...",
      errorMatch: "Les mots de passe ne correspondent pas."
    },
    register: {
      title: "Inscription",
      heading: "Nouveau Profil",
      subheading: "Configuration guidée.",
      alreadyAccount: "Déjà un compte ?",
      accessConsole: "Accéder à la Console",
      steps: {
        one: "Étape 1", two: "Étape 2", three: "Étape 3",
        registry: "État Civil", residence: "Résidence", profession: "Profession"
      },
      buttons: { back: "Retour", next: "Suivant", complete: "Terminer" },
      success: {
        title: "Vérifiez votre Email",
        desc: "Nous vous avons envoyé un lien de confirmation. Vous devez vérifier votre email pour accéder au tableau de bord.",
        spamNotice: "Pas reçu ? Vérifiez les Spams ou Promotions.",
        backToLogin: "Retour à la page de Connexion"
      }
    },
    form: {
      labels: {
        firstName: "Prénom", lastName: "Nom", fiscalCode: "Code Fiscal", gender: "Genre",
        dob: "Date de Naissance", birthPlace: "Lieu de Naissance", phone: "Mobile",
        country: "Pays", address: "Adresse", civic: "N°", zip: "Code Postal", city: "Ville", province: "Région",
        medicalLicense: "N° Licence", hospital: "Institution", email: "Email Institutionnel", password: "Mot de Passe",
        emailSimple: "Email", passwordSimple: "Mot de Passe", confirmPassword: "Confirmer Mot de Passe"
      },
      placeholders: {
        name: "Jean", surname: "Dupont", cf: "Numéro fiscal...", city: "Ville", address: "Rue", civic: "N°",
        zip: "75000", municipality: "Commune", province: "Région", license: "Ex. 12345",
        hospital: "Ex. Hôpital Général...", select: "Sélectionner", day: "Jour", month: "Mois", year: "Année",
        phonePlaceholder: "+33 6...", emailPlaceholder: "email@patient.com"
      },
      options: { male: "Masculin", female: "Féminin", other: "Autre" },
      sections: { credentials: "Identifiants", identity: "Identité", contacts: "Contacts", domicile: "Domicile" },
      warnings: { attention: "Attention", required: "Obligatoire", requiredSymbol: "*", loading: "Chargement..." }
    }
  },
  dashboard: {
    header: { console: "Console", unassigned: "Non assigné", logout: "Déconnexion" },
    tabs: { patients: "Patients", analysis: "Analyses", profile: "Données Personnelles" },
    titles: {
      main: "Console Médicale", patientRegistry: "Registre Patients", globalHistory: "Historique Global",
      uploadHistory: "Historique Téléversements", patientFolder: "Dossier Personnel"
    },
    patients: {
      empty: { title: "Aucun patient.", subtitle: "Commencez par en ajouter un.", btnNew: "Nouveau Patient" },
      card: { openFolder: "Ouvrir Dossier" },
      modal: {
        title: "Registre Patient", subtitle: "Remplir les champs obligatoires (*)",
        btnSave: "Créer Dossier", btnSaving: "Enregistrement..."
      }
    },
    tickets: {
      empty: "Aucune analyse archivée.",
      table: { id: "ID Ticket", patient: "Patient", file: "Fichier", date: "Date", status: "Statut" },
      status: {
        completed: "Terminé", processing: "Traitement", queued: "En file", uploading: "Envoi...", error: "Erreur",
        failedAnalysis: "ÉCHEC ANALYSE"
      },
      steps: { uploading: "Envoi", queued: "File Cloud", processing: "Analyse IA", completed: "Terminé" },
      detail: { analysis: "Analyse", patient: "Patient" }
    },
    upload: {
      title: "Nouvelle Analyse Histologique", dragDrop: "Glisser fichier (SVS, NDPI, TIFF)", remove: "Retirer",
      notesPlaceholder: "Notes cliniques (optionnel)...", btnStart: "Démarrer Envoi et Analyse",
      sending: "Envoi sécurisé...", successTitle: "Ticket Créé", successMsg: "En attente IA...",
      errorTitle: "Erreur Envoi", retry: "Réessayer"
    },
    realtime: {
      sourceData: "Données Source", inputFile: "Fichier Entrée", size: "Taille", date: "Date",
      clinicalNotes: "Notes Cliniques", noNotes: "Aucune note.",
      errorAnalysis: "Erreur Analyse", completedAnalysis: "Analyse Terminée", progressStatus: "Progression",
      statusLabel: "STATUT", processInterrupted: "Processus Interrompu", errorDetails: "Détails:",
      genericError: "Erreur générique.", retryUpload: "Réessayer Envoi",
      outputFile: "Fichier Généré", download: "Télécharger", resultsJson: "Résultats IA (JSON)",
      noJson: "Aucune donnée structurée.",
      queuedTitle: "En file d'attente", processingTitle: "Analyse en cours",
      queuedDesc: "Fichier sécurisé. En attente du moteur IA.",
      processingDesc: "Analyse des tissus et génération JSON.",
      outputNotReady: "Sortie non prête."
    },
    results: {
      title: "Résultats Analyse IA", tissueView: "Visualisation Tissu",
      previewNote: "Aperçu rapide. Pour analyse approfondie, téléchargez le projet.",
      sickTissue: "Tissu Malade", totalGlom: "Glomérules Totaux", scleroGlom: "Glomérules Sclérosés",
      fullProject: "Projet QuPath Complet", downloadZip: "Téléchargez le .zip pour ouvrir sur PC.",
      btnDownload: "Télécharger Projet (.zip)"
    },
    profile: { dob: "Date de Naissance", birthPlace: "Lieu de Naissance", residence: "Résidence", contacts: "Contacts" },
    settings: {
      title: "Paramètres Profil",
      subtitle: "Gérez vos données et la sécurité.",
      tabs: { profile: "Données Personnelles", security: "Sécurité" },
      sections: {
        personal: "Informations Personnelles",
        residence: "Résidence",
        professional: "Données Professionnelles",
        email: "Email",
        password: "Mot de Passe"
      },
      form: {
        updateBtn: "Enregistrer",
        success: "Profil mis à jour.",
        emailNotice: "Changer l'email requiert confirmation.",
        passwordNotice: "Laisser vide pour conserver l'actuel.",
        savePassword: "Définir Nouveau MdP",
        newPassword: "Nouveau Mot de Passe",
        confirmPassword: "Confirmer Mot de Passe",
        updating: "Enregistrement..."
      }
    }
  },
  legal: {
    title: "Centre Légal et Confidentialité",
    subtitle: "Transparence du diagnostic médical.",
    update: "Dernière mise à jour : 21 Janvier 2026",
    tabs: { privacy: "Confidentialité", terms: "Conditions", cookie: "Cookies", dpa: "Traitement (DPA)" },
    content: {
      privacyTitle: "Politique de Confidentialité", privacySub: "Règlement UE 2016/679 (GDPR)",
      termsTitle: "Conditions Générales", termsSub: "Règlement d'utilisation",
      cookieTitle: "Politique Cookies", cookieSub: "Transparence traçage",
      dpaTitle: "Sécurité et DPA", dpaSub: "Annexe technique",
      disclaimer: "ATTENTION - AVIS MÉDICAL :",
      disclaimerText: "Histyon est un outil technique et ne remplace pas le jugement médical. L'IA doit être validée.",
      privacy: {
        sec1: { title: "1. Responsable", body: "Histyon Team est responsable des données de compte." },
        sec2: { title: "2. Données Collectées", body: "Données Pro et Données Santé Patients (chiffrées)." },
        sec3: { title: "3. Finalité", body: "Service SaaS, Support Diagnostic, Sécurité." },
        sec4: { title: "4. Lieu", body: "Données hébergées dans l'EEE (Espace Économique Européen)." }
      },
      terms: {
        sec1: { title: "1. Prérequis", body: "Accès réservé aux professionnels médicaux enregistrés." },
        sec2: { title: "2. Responsabilité", body: "L'Utilisateur garantit avoir obtenu le consentement éclairé." },
        sec3: { title: "3. Sécurité", body: "Identifiants personnels. Partage de compte interdit." }
      },
      cookie: {
        sec1: { title: "1. Qu'est-ce que c'est", body: "Petits fichiers texte pour améliorer l'expérience." },
        sec2: { title: "2. Techniques", body: "Strictement nécessaires (Session, Sécurité)." },
        sec3: { title: "3. Pas de Profilage", body: "Histyon n'utilise PAS de cookies de profilage." }
      },
      dpa: {
        cards: { 
            crypto: { title: "Chiffrement", body: "TLS 1.3 en transit. AES-256 au repos." }, 
            access: { title: "Contrôle Accès", body: "Politiques RLS strictes." } 
        },
        sec1: { title: "1. Sous-traitant", body: "L'Utilisateur désigne Histyon comme Sous-traitant (Art. 28 GDPR)." },
        sec2: { title: "2. Mesures Sécurité", body: "Défense en Profondeur : Auth, Isolation, Backups." }
      }
    }
  },
  validation: {
    passwordLength: "Minimum 8 caractères",
    passwordComplexity: "Doit contenir une Majuscule",
    passwordSpecial: "Doit contenir un caractère spécial",
    passwordRegexMsg: "Utilisez majuscule, chiffre et spécial",
    passwordMismatch: "Les mots de passe ne correspondent pas",
    name: "Lettres uniquement", nameAllowed: "Seules lettres autorisées",
    fiscalCodeLen: "16 car. alphanumériques", fiscalCodeFormat: "Format invalide",
    emailInvalid: "Email invalide", phoneShort: "Numéro trop court",
    required: "Obligatoire", genericError: "Erreur inattendue.",
    alreadyRegistered: "Cet email est déjà enregistré.",
    profileError: "Erreur sauvegarde profil : ",
    patientExists: "Patient existe déjà.",
    unauthorized: "Non autorisé",
    dbError: "Erreur DB : ",
    uploadError: "Erreur URL",
    cloudflareError: "Erreur envoi Cloudflare",
    networkError: "Erreur réseau",
    fileNotFound: "Fichier introuvable.",
    fileRetrievalError: "Impossible de récupérer le fichier",
    credentialsInvalid: "Identifiants invalides",
    linkSent: "Lien envoyé avec succès"
  }
}