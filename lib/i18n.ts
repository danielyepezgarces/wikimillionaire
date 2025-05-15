// Definición de tipos para las traducciones
export type Locale = "es" | "en" | "fr" | "de" | "pt"

export type Translations = {
  general: {
    appName: string
    play: string
    leaderboard: string
    about: string
    privacy: string
    terms: string
    loading: string
    error: string
    credits: string
  }
  home: {
    tagline: string
    description: string
    features: {
      wikidata: {
        title: string
        description: string
      }
      dailyContest: {
        title: string
        description: string
      }
      leaderboard: {
        title: string
        description: string
      }
    }
  }
  game: {
    level: string
    prize: string
    timeRemaining: string
    lifelines: {
      fiftyFifty: string
      audience: string
      phone: string
    }
    audienceHelp: {
      title: string
      description: string
    }
    phoneAFriend: {
      title: string
      description: string
      veryConfident: string
      quiteConfident: string
      notSure: string
    }
    prizeLevel: string
    gameOver: string
    finalScore: string
    congratulations: string
    playAgain: string
    viewLeaderboard: string
    enterName: string
    startGame: string
    backToHome: string
    nameRequired: {
      title: string
      description: string
    }
  }
  leaderboard: {
    title: string
    description: string
    tabs: {
      daily: string
      weekly: string
      monthly: string
    }
    noData: string
    points: string
  }
  auth: {
    login: string
    logout: string
    comingSoon: string
  }
}

// Traducciones en español
export const es: Translations = {
  general: {
    appName: "WikiMillionaire",
    play: "Jugar Ahora",
    leaderboard: "Clasificaciones",
    about: "Acerca de",
    privacy: "Privacidad",
    terms: "Términos",
    loading: "Cargando...",
    error: "Error al cargar. Inténtalo de nuevo.",
    credits: "Juego creado por Daniel Yepez Garces",
  },
  home: {
    tagline: 'Pon a prueba tus conocimientos con nuestro juego de preguntas estilo "¿Quién quiere ser millonario?"',
    description: "usando datos reales de Wikidata.",
    features: {
      wikidata: {
        title: "Preguntas de Wikidata",
        description: "Preguntas generadas a partir de la base de conocimientos de Wikidata.",
      },
      dailyContest: {
        title: "Concurso Diario",
        description: "Nuevas preguntas cada día para competir con otros jugadores.",
      },
      leaderboard: {
        title: "Tablas de Clasificación",
        description: "Compite por los primeros puestos en clasificaciones diarias, semanales y mensuales.",
      },
    },
  },
  game: {
    level: "Nivel",
    prize: "Premio",
    timeRemaining: "Tiempo restante",
    lifelines: {
      fiftyFifty: "50:50",
      audience: "Ayuda del Público",
      phone: "Llamada a un Amigo",
    },
    audienceHelp: {
      title: "Ayuda del Público",
      description: "La mayoría del público piensa que la respuesta correcta es:",
    },
    phoneAFriend: {
      title: "Llamada a un Amigo",
      description: "Tu amigo",
      veryConfident: "está muy seguro de que la respuesta es",
      quiteConfident: "está bastante seguro de que la respuesta es",
      notSure: "no está seguro, pero cree que podría ser",
    },
    prizeLevel: "Niveles de Premio",
    gameOver: "Juego Terminado",
    finalScore: "Tu puntuación final",
    congratulations: "¡Felicidades, Millonario!",
    playAgain: "Jugar de Nuevo",
    viewLeaderboard: "Ver Clasificaciones",
    enterName: "Tu nombre",
    startGame: "Comenzar Juego",
    backToHome: "Volver al Inicio",
    nameRequired: {
      title: "Nombre requerido",
      description: "Por favor ingresa tu nombre para comenzar",
    },
  },
  leaderboard: {
    title: "Tabla de Clasificación",
    description: "Compite por los primeros puestos y demuestra tus conocimientos",
    tabs: {
      daily: "Diario",
      weekly: "Semanal",
      monthly: "Mensual",
    },
    noData: "No hay datos disponibles para este período.",
    points: "puntos",
  },
  auth: {
    login: "Iniciar sesión con Wikidata",
    logout: "Cerrar sesión",
    comingSoon: "Próximamente",
  },
}

// Traducciones en inglés
export const en: Translations = {
  general: {
    appName: "WikiMillionaire",
    play: "Play Now",
    leaderboard: "Leaderboard",
    about: "About",
    privacy: "Privacy",
    terms: "Terms",
    loading: "Loading...",
    error: "Error loading. Please try again.",
    credits: "Game created by Daniel Yepez Garces",
  },
  home: {
    tagline: 'Test your knowledge with our "Who Wants to Be a Millionaire?" style quiz game',
    description: "using real data from Wikidata.",
    features: {
      wikidata: {
        title: "Wikidata Questions",
        description: "Questions generated from the Wikidata knowledge base.",
      },
      dailyContest: {
        title: "Daily Contest",
        description: "New questions every day to compete with other players.",
      },
      leaderboard: {
        title: "Leaderboards",
        description: "Compete for the top spots in daily, weekly, and monthly rankings.",
      },
    },
  },
  game: {
    level: "Level",
    prize: "Prize",
    timeRemaining: "Time remaining",
    lifelines: {
      fiftyFifty: "50:50",
      audience: "Ask the Audience",
      phone: "Phone a Friend",
    },
    audienceHelp: {
      title: "Ask the Audience",
      description: "Most of the audience thinks the correct answer is:",
    },
    phoneAFriend: {
      title: "Phone a Friend",
      description: "Your friend",
      veryConfident: "is very confident that the answer is",
      quiteConfident: "is quite confident that the answer is",
      notSure: "is not sure, but thinks it might be",
    },
    prizeLevel: "Prize Levels",
    gameOver: "Game Over",
    finalScore: "Your final score",
    congratulations: "Congratulations, Millionaire!",
    playAgain: "Play Again",
    viewLeaderboard: "View Leaderboard",
    enterName: "Your name",
    startGame: "Start Game",
    backToHome: "Back to Home",
    nameRequired: {
      title: "Name required",
      description: "Please enter your name to start",
    },
  },
  leaderboard: {
    title: "Leaderboard",
    description: "Compete for the top spots and show your knowledge",
    tabs: {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    },
    noData: "No data available for this period.",
    points: "points",
  },
  auth: {
    login: "Login with Wikidata",
    logout: "Logout",
    comingSoon: "Coming Soon",
  },
}

// Traducciones en francés
export const fr: Translations = {
  general: {
    appName: "WikiMillionaire",
    play: "Jouer Maintenant",
    leaderboard: "Classement",
    about: "À propos",
    privacy: "Confidentialité",
    terms: "Conditions",
    loading: "Chargement...",
    error: "Erreur de chargement. Veuillez réessayer.",
    credits: "Jeu créé par Daniel Yepez Garces",
  },
  home: {
    tagline: 'Testez vos connaissances avec notre jeu de quiz style "Qui veut gagner des millions ?"',
    description: "en utilisant des données réelles de Wikidata.",
    features: {
      wikidata: {
        title: "Questions Wikidata",
        description: "Questions générées à partir de la base de connaissances Wikidata.",
      },
      dailyContest: {
        title: "Concours Quotidien",
        description: "Nouvelles questions chaque jour pour rivaliser avec d'autres joueurs.",
      },
      leaderboard: {
        title: "Classements",
        description: "Concourez pour les premières places dans les classements quotidiens, hebdomadaires et mensuels.",
      },
    },
  },
  game: {
    level: "Niveau",
    prize: "Prix",
    timeRemaining: "Temps restant",
    lifelines: {
      fiftyFifty: "50:50",
      audience: "L'avis du Public",
      phone: "Appel à un Ami",
    },
    audienceHelp: {
      title: "L'avis du Public",
      description: "La majorité du public pense que la bonne réponse est :",
    },
    phoneAFriend: {
      title: "Appel à un Ami",
      description: "Votre ami",
      veryConfident: "est très confiant que la réponse est",
      quiteConfident: "est assez confiant que la réponse est",
      notSure: "n'est pas sûr, mais pense que ça pourrait être",
    },
    prizeLevel: "Niveaux de Prix",
    gameOver: "Partie Terminée",
    finalScore: "Votre score final",
    congratulations: "Félicitations, Millionnaire !",
    playAgain: "Rejouer",
    viewLeaderboard: "Voir le Classement",
    enterName: "Votre nom",
    startGame: "Commencer le Jeu",
    backToHome: "Retour à l'Accueil",
    nameRequired: {
      title: "Nom requis",
      description: "Veuillez entrer votre nom pour commencer",
    },
  },
  leaderboard: {
    title: "Classement",
    description: "Concourez pour les premières places et montrez vos connaissances",
    tabs: {
      daily: "Quotidien",
      weekly: "Hebdomadaire",
      monthly: "Mensuel",
    },
    noData: "Aucune donnée disponible pour cette période.",
    points: "points",
  },
  auth: {
    login: "Se connecter avec Wikidata",
    logout: "Se déconnecter",
    comingSoon: "Bientôt Disponible",
  },
}

// Traducciones en alemán
export const de: Translations = {
  general: {
    appName: "WikiMillionaire",
    play: "Jetzt Spielen",
    leaderboard: "Bestenliste",
    about: "Über",
    privacy: "Datenschutz",
    terms: "Bedingungen",
    loading: "Wird geladen...",
    error: "Fehler beim Laden. Bitte versuchen Sie es erneut.",
    credits: "Spiel erstellt von Daniel Yepez Garces",
  },
  home: {
    tagline: 'Testen Sie Ihr Wissen mit unserem Quiz-Spiel im Stil von "Wer wird Millionär?"',
    description: "mit echten Daten aus Wikidata.",
    features: {
      wikidata: {
        title: "Wikidata-Fragen",
        description: "Fragen aus der Wikidata-Wissensdatenbank generiert.",
      },
      dailyContest: {
        title: "Täglicher Wettbewerb",
        description: "Neue Fragen jeden Tag, um mit anderen Spielern zu konkurrieren.",
      },
      leaderboard: {
        title: "Bestenlisten",
        description: "Kämpfen Sie um die Spitzenplätze in täglichen, wöchentlichen und monatlichen Ranglisten.",
      },
    },
  },
  game: {
    level: "Stufe",
    prize: "Preis",
    timeRemaining: "Verbleibende Zeit",
    lifelines: {
      fiftyFifty: "50:50",
      audience: "Publikumsfrage",
      phone: "Telefonjoker",
    },
    audienceHelp: {
      title: "Publikumsfrage",
      description: "Die Mehrheit des Publikums denkt, dass die richtige Antwort ist:",
    },
    phoneAFriend: {
      title: "Telefonjoker",
      description: "Dein Freund",
      veryConfident: "ist sehr zuversichtlich, dass die Antwort ist",
      quiteConfident: "ist ziemlich zuversichtlich, dass die Antwort ist",
      notSure: "ist nicht sicher, denkt aber, es könnte sein",
    },
    prizeLevel: "Preisstufen",
    gameOver: "Spiel Beendet",
    finalScore: "Deine Endpunktzahl",
    congratulations: "Herzlichen Glückwunsch, Millionär!",
    playAgain: "Nochmal Spielen",
    viewLeaderboard: "Bestenliste Anzeigen",
    enterName: "Dein Name",
    startGame: "Spiel Starten",
    backToHome: "Zurück zur Startseite",
    nameRequired: {
      title: "Name erforderlich",
      description: "Bitte gib deinen Namen ein, um zu beginnen",
    },
  },
  leaderboard: {
    title: "Bestenliste",
    description: "Kämpfe um die Spitzenplätze und zeige dein Wissen",
    tabs: {
      daily: "Täglich",
      weekly: "Wöchentlich",
      monthly: "Monatlich",
    },
    noData: "Keine Daten für diesen Zeitraum verfügbar.",
    points: "Punkte",
  },
  auth: {
    login: "Mit Wikidata anmelden",
    logout: "Abmelden",
    comingSoon: "Demnächst Verfügbar",
  },
}

// Traducciones en portugués
export const pt: Translations = {
  general: {
    appName: "WikiMillionaire",
    play: "Jogar Agora",
    leaderboard: "Classificação",
    about: "Sobre",
    privacy: "Privacidade",
    terms: "Termos",
    loading: "Carregando...",
    error: "Erro ao carregar. Tente novamente.",
    credits: "Jogo criado por Daniel Yepez Garces",
  },
  home: {
    tagline: 'Teste seus conhecimentos com nosso jogo de perguntas estilo "Quem Quer Ser um Milionário?"',
    description: "usando dados reais do Wikidata.",
    features: {
      wikidata: {
        title: "Perguntas do Wikidata",
        description: "Perguntas geradas a partir da base de conhecimento do Wikidata.",
      },
      dailyContest: {
        title: "Concurso Diário",
        description: "Novas perguntas todos os dias para competir com outros jogadores.",
      },
      leaderboard: {
        title: "Tabelas de Classificação",
        description: "Compita pelos primeiros lugares nas classificações diárias, semanais e mensais.",
      },
    },
  },
  game: {
    level: "Nível",
    prize: "Prêmio",
    timeRemaining: "Tempo restante",
    lifelines: {
      fiftyFifty: "50:50",
      audience: "Ajuda da Plateia",
      phone: "Ligar para um Amigo",
    },
    audienceHelp: {
      title: "Ajuda da Plateia",
      description: "A maioria da plateia acha que a resposta correta é:",
    },
    phoneAFriend: {
      title: "Ligar para um Amigo",
      description: "Seu amigo",
      veryConfident: "está muito confiante de que a resposta é",
      quiteConfident: "está bastante confiante de que a resposta é",
      notSure: "não tem certeza, mas acha que pode ser",
    },
    prizeLevel: "Níveis de Prêmio",
    gameOver: "Fim de Jogo",
    finalScore: "Sua pontuação final",
    congratulations: "Parabéns, Milionário!",
    playAgain: "Jogar Novamente",
    viewLeaderboard: "Ver Classificação",
    enterName: "Seu nome",
    startGame: "Iniciar Jogo",
    backToHome: "Voltar ao Início",
    nameRequired: {
      title: "Nome necessário",
      description: "Por favor, insira seu nome para começar",
    },
  },
  leaderboard: {
    title: "Classificação",
    description: "Compita pelos primeiros lugares e mostre seu conhecimento",
    tabs: {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal",
    },
    noData: "Não há dados disponíveis para este período.",
    points: "pontos",
  },
  auth: {
    login: "Entrar com Wikidata",
    logout: "Sair",
    comingSoon: "Em Breve",
  },
}

// Función para obtener las traducciones según el idioma
export function getTranslations(locale: Locale): Translations {
  switch (locale) {
    case "es":
      return es
    case "en":
      return en
    case "fr":
      return fr
    case "de":
      return de
    case "pt":
      return pt
    default:
      return es
  }
}

// Función para obtener el nombre del idioma
export function getLanguageName(locale: Locale): string {
  switch (locale) {
    case "es":
      return "Español"
    case "en":
      return "English"
    case "fr":
      return "Français"
    case "de":
      return "Deutsch"
    case "pt":
      return "Português"
    default:
      return "Español"
  }
}

// Lista de idiomas disponibles
export const availableLocales: Locale[] = ["es", "en", "fr", "de", "pt"]
