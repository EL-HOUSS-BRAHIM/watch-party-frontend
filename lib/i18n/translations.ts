export const translations = {
  en: {
    common: {
      welcome: "Welcome to WatchParty",
      loading: "Loading...",
      error: "An error occurred",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search",
      filter: "Filter",
      export: "Export",
      import: "Import",
    },
    auth: {
      login: {
        title: "Sign in to your account",
        email: "Email address",
        password: "Password",
        submit: "Sign in",
        forgot: "Forgot password?",
        register: "Don't have an account? Sign up",
      },
      register: {
        title: "Create your account",
        name: "Full name",
        email: "Email address",
        password: "Password",
        confirm: "Confirm password",
        submit: "Create account",
        login: "Already have an account? Sign in",
      },
    },
    party: {
      create: {
        title: "Create Watch Party",
        button: "Create Watch Party",
        name: "Party name",
        description: "Description",
        video: "Select video",
        privacy: "Privacy settings",
        schedule: "Schedule for later",
      },
      join: {
        title: "Join Watch Party",
        button: "Join Party",
        code: "Party code",
        invalid: "Invalid party code",
      },
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome back, {{name}}!",
      stats: {
        parties: "Total Parties",
        friends: "Friends",
        videos: "Videos Watched",
        hours: "Hours Watched",
      },
    },
  },
  es: {
    common: {
      welcome: "Bienvenido a WatchParty",
      loading: "Cargando...",
      error: "Ocurrió un error",
      success: "Éxito",
      cancel: "Cancelar",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      create: "Crear",
      search: "Buscar",
      filter: "Filtrar",
      export: "Exportar",
      import: "Importar",
    },
    auth: {
      login: {
        title: "Inicia sesión en tu cuenta",
        email: "Dirección de correo",
        password: "Contraseña",
        submit: "Iniciar sesión",
        forgot: "¿Olvidaste tu contraseña?",
        register: "¿No tienes cuenta? Regístrate",
      },
      register: {
        title: "Crea tu cuenta",
        name: "Nombre completo",
        email: "Dirección de correo",
        password: "Contraseña",
        confirm: "Confirmar contraseña",
        submit: "Crear cuenta",
        login: "¿Ya tienes cuenta? Inicia sesión",
      },
    },
    party: {
      create: {
        title: "Crear Fiesta de Visualización",
        button: "Crear Fiesta de Visualización",
        name: "Nombre de la fiesta",
        description: "Descripción",
        video: "Seleccionar video",
        privacy: "Configuración de privacidad",
        schedule: "Programar para más tarde",
      },
      join: {
        title: "Unirse a Fiesta de Visualización",
        button: "Unirse a la Fiesta",
        code: "Código de la fiesta",
        invalid: "Código de fiesta inválido",
      },
    },
    dashboard: {
      title: "Panel de Control",
      welcome: "¡Bienvenido de vuelta, {{name}}!",
      stats: {
        parties: "Fiestas Totales",
        friends: "Amigos",
        videos: "Videos Vistos",
        hours: "Horas Vistas",
      },
    },
  },
  fr: {
    common: {
      welcome: "Bienvenue sur WatchParty",
      loading: "Chargement...",
      error: "Une erreur s'est produite",
      success: "Succès",
      cancel: "Annuler",
      save: "Enregistrer",
      delete: "Supprimer",
      edit: "Modifier",
      create: "Créer",
      search: "Rechercher",
      filter: "Filtrer",
      export: "Exporter",
      import: "Importer",
    },
    auth: {
      login: {
        title: "Connectez-vous à votre compte",
        email: "Adresse e-mail",
        password: "Mot de passe",
        submit: "Se connecter",
        forgot: "Mot de passe oublié ?",
        register: "Pas de compte ? Inscrivez-vous",
      },
      register: {
        title: "Créez votre compte",
        name: "Nom complet",
        email: "Adresse e-mail",
        password: "Mot de passe",
        confirm: "Confirmer le mot de passe",
        submit: "Créer un compte",
        login: "Déjà un compte ? Connectez-vous",
      },
    },
    party: {
      create: {
        title: "Créer une Soirée Cinéma",
        button: "Créer une Soirée Cinéma",
        name: "Nom de la soirée",
        description: "Description",
        video: "Sélectionner une vidéo",
        privacy: "Paramètres de confidentialité",
        schedule: "Programmer pour plus tard",
      },
      join: {
        title: "Rejoindre une Soirée Cinéma",
        button: "Rejoindre la Soirée",
        code: "Code de la soirée",
        invalid: "Code de soirée invalide",
      },
    },
    dashboard: {
      title: "Tableau de Bord",
      welcome: "Bon retour, {{name}} !",
      stats: {
        parties: "Soirées Totales",
        friends: "Amis",
        videos: "Vidéos Regardées",
        hours: "Heures Regardées",
      },
    },
  },
}

export type TranslationKey = keyof typeof translations.en
export type NestedTranslationKey<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends object ? `${string & K}.${NestedTranslationKey<T[K]>}` : string & K
    }[keyof T]
  : never

export type AllTranslationKeys = NestedTranslationKey<typeof translations.en>
