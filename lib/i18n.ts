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
      all: string
    }
    noData: string
    points: string
    resetInfo: string
    resetsIn: string
    position: string
    player: string
    score: string
    games: string
    totalScore: string
    tooltip: string
  }
  auth: {
    login: string
    logout: string
    comingSoon: string
  }
  profile: {
    title: string
    welcome: string
    welcomesubtitle: string
    joinedAt: string
    lastLogin: string
    stats: {
      title: string
      gamesPlayed: string
      highScore: string
      totalScore: string
      averageScore: string
      ranking: string
      lastGame: string
      millionaireProgress: string
    }
    achievements: {
      title: string
      locked: string
      unlocked: string
      progress: string
      types: {
        score: {
          title: string
          description: string
        }
        games: {
          title: string
          description: string
        }
        ranking: {
          title: string
          description: string
        }
        streak: {
          title: string
          description: string
        }
      }
      list: {
        firstGame: {
          title: string
          description: string
        }
        tenGames: {
          title: string
          description: string
        }
        fiftyGames: {
          title: string
          description: string
        }
        hundredGames: {
          title: string
          description: string
        }
        score1k: {
          title: string
          description: string
        }
        score10k: {
          title: string
          description: string
        }
        score100k: {
          title: string
          description: string
        }
        score1m: {
          title: string
          description: string
        }
        topDaily: {
          title: string
          description: string
        }
        topWeekly: {
          title: string
          description: string
        }
        topMonthly: {
          title: string
          description: string
        }
        topAllTime: {
          title: string
          description: string
        }
      }
    }
    history: {
      title: string
      date: string
      score: string
      level: string
      noData: string
    }
    settings: {
      title: string
      language: string
      sound: string
      on: string
      off: string
      theme: string
      light: string
      dark: string
      save: string
      saved: string
    }
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
      all: "Todos",
    },
    noData: "No hay datos disponibles para este período.",
    points: "puntos",
    resetInfo: "Próximo reinicio",
    resetsIn: "Reinicio en",
    position: "Posición",
    player: "Jugador",
    score: "Puntuación",
    games: "Partidas",
    totalScore: "Puntuación total",
    tooltip: "Suma total de puntos en este período",
  },
  auth: {
    login: "Iniciar sesión con Wikidata",
    logout: "Cerrar sesión",
    comingSoon: "Próximamente",
  },
  profile: {
    title: "Perfil de Usuario",
    welcome: "Bienvenido, {username}",
    welcomesubtitle: "Información de tu cuenta de WikiMillionaire",
    joinedAt: "Registrado desde",
    lastLogin: "Último acceso",
    stats: {
      title: "Estadísticas",
      gamesPlayed: "Partidas jugadas",
      highScore: "Puntuación máxima",
      totalScore: "Puntuación total",
      averageScore: "Puntuación media",
      ranking: "Posición en el ranking",
      lastGame: "Última partida",
      millionaireProgress: "Progreso hacia el millón",
    },
    achievements: {
      title: "Logros",
      locked: "Bloqueado",
      unlocked: "Desbloqueado",
      progress: "Progreso: {current}/{total}",
      types: {
        score: {
          title: "Puntuación",
          description: "Logros basados en tu puntuación",
        },
        games: {
          title: "Partidas",
          description: "Logros basados en el número de partidas jugadas",
        },
        ranking: {
          title: "Ranking",
          description: "Logros basados en tu posición en el ranking",
        },
        streak: {
          title: "Racha",
          description: "Logros basados en tu racha de juego",
        },
      },
      list: {
        firstGame: {
          title: "Primera Partida",
          description: "Juega tu primera partida",
        },
        tenGames: {
          title: "Jugador Dedicado",
          description: "Juega 10 partidas",
        },
        fiftyGames: {
          title: "Jugador Experimentado",
          description: "Juega 50 partidas",
        },
        hundredGames: {
          title: "Maestro del Juego",
          description: "Juega 100 partidas",
        },
        score1k: {
          title: "Primer Milestone",
          description: "Alcanza 1,000 puntos en una partida",
        },
        score10k: {
          title: "Experto en Conocimiento",
          description: "Alcanza 10,000 puntos en una partida",
        },
        score100k: {
          title: "Sabio de Wikidata",
          description: "Alcanza 100,000 puntos en una partida",
        },
        score1m: {
          title: "Millonario",
          description: "Alcanza 1,000,000 puntos en una partida",
        },
        topDaily: {
          title: "Estrella del Día",
          description: "Alcanza el top 10 en el ranking diario",
        },
        topWeekly: {
          title: "Estrella de la Semana",
          description: "Alcanza el top 10 en el ranking semanal",
        },
        topMonthly: {
          title: "Estrella del Mes",
          description: "Alcanza el top 10 en el ranking mensual",
        },
        topAllTime: {
          title: "Leyenda",
          description: "Alcanza el top 10 en el ranking de todos los tiempos",
        },
      },
    },
    history: {
      title: "Historial de Partidas",
      date: "Fecha",
      score: "Puntuación",
      level: "Nivel",
      noData: "No hay partidas registradas",
    },
    settings: {
      title: "Configuración",
      language: "Idioma",
      sound: "Sonido",
      on: "Activado",
      off: "Desactivado",
      theme: "Tema",
      light: "Claro",
      dark: "Oscuro",
      save: "Guardar",
      saved: "¡Guardado!",
    },
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
      all: "All Time",
    },
    noData: "No data available for this period.",
    points: "points",
    resetInfo: "Next reset",
    resetsIn: "Resets in",
    position: "Position",
    player: "Player",
    score: "Score",
    games: "Games",
    totalScore: "Total score",
    tooltip: "Total sum of points in this period",
  },
  auth: {
    login: "Login with Wikidata",
    logout: "Logout",
    comingSoon: "Coming Soon",
  },
  profile: {
    title: "User Profile",
    welcome: "Welcome, {username}",
    welcomesubtitle: "Information about your WikiMillionaire account",
    joinedAt: "Joined on",
    lastLogin: "Last login",
    stats: {
      title: "Statistics",
      gamesPlayed: "Games played",
      highScore: "High score",
      totalScore: "Total score",
      averageScore: "Average score",
      ranking: "Ranking position",
      lastGame: "Last game",
      millionaireProgress: "Progress to million",
    },
    achievements: {
      title: "Achievements",
      locked: "Locked",
      unlocked: "Unlocked",
      progress: "Progress: {current}/{total}",
      types: {
        score: {
          title: "Score",
          description: "Achievements based on your score",
        },
        games: {
          title: "Games",
          description: "Achievements based on number of games played",
        },
        ranking: {
          title: "Ranking",
          description: "Achievements based on your ranking position",
        },
        streak: {
          title: "Streak",
          description: "Achievements based on your playing streak",
        },
      },
      list: {
        firstGame: {
          title: "First Game",
          description: "Play your first game",
        },
        tenGames: {
          title: "Dedicated Player",
          description: "Play 10 games",
        },
        fiftyGames: {
          title: "Experienced Player",
          description: "Play 50 games",
        },
        hundredGames: {
          title: "Game Master",
          description: "Play 100 games",
        },
        score1k: {
          title: "First Milestone",
          description: "Reach 1,000 points in a game",
        },
        score10k: {
          title: "Knowledge Expert",
          description: "Reach 10,000 points in a game",
        },
        score100k: {
          title: "Wikidata Sage",
          description: "Reach 100,000 points in a game",
        },
        score1m: {
          title: "Millionaire",
          description: "Reach 1,000,000 points in a game",
        },
        topDaily: {
          title: "Daily Star",
          description: "Reach top 10 in daily ranking",
        },
        topWeekly: {
          title: "Weekly Star",
          description: "Reach top 10 in weekly ranking",
        },
        topMonthly: {
          title: "Monthly Star",
          description: "Reach top 10 in monthly ranking",
        },
        topAllTime: {
          title: "Legend",
          description: "Reach top 10 in all-time ranking",
        },
      },
    },
    history: {
      title: "Game History",
      date: "Date",
      score: "Score",
      level: "Level",
      noData: "No games recorded",
    },
    settings: {
      title: "Settings",
      language: "Language",
      sound: "Sound",
      on: "On",
      off: "Off",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      save: "Save",
      saved: "Saved!",
    },
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
      all: "Tous les Temps",
    },
    noData: "Aucune donnée disponible pour cette période.",
    points: "points",
    resetInfo: "Prochain réinitialisation",
    resetsIn: "Réinitialisation dans",
    position: "Position",
    player: "Joueur",
    score: "Score",
    games: "Parties",
    totalScore: "Score total",
    tooltip: "Somme totale de points dans cette période",
  },
  auth: {
    login: "Se connecter avec Wikidata",
    logout: "Se déconnecter",
    comingSoon: "Bientôt Disponible",
  },
  profile: {
    title: "Profil Utilisateur",
    welcome: "Bienvenue, {username}",
    welcomesubtitle: "Informations sur votre compte WikiMillionaire",
    joinedAt: "Inscrit le",
    lastLogin: "Dernière connexion",
    stats: {
      title: "Statistiques",
      gamesPlayed: "Parties jouées",
      highScore: "Meilleur score",
      totalScore: "Score total",
      averageScore: "Score moyen",
      ranking: "Position dans le classement",
      lastGame: "Dernière partie",
      millionaireProgress: "Progression vers le million",
    },
    achievements: {
      title: "Réalisations",
      locked: "Verrouillé",
      unlocked: "Déverrouillé",
      progress: "Progression : {current}/{total}",
      types: {
        score: {
          title: "Score",
          description: "Réalisations basées sur votre score",
        },
        games: {
          title: "Parties",
          description: "Réalisations basées sur le nombre de parties jouées",
        },
        ranking: {
          title: "Classement",
          description: "Réalisations basées sur votre position dans le classement",
        },
        streak: {
          title: "Série",
          description: "Réalisations basées sur votre série de jeu",
        },
      },
      list: {
        firstGame: {
          title: "Première Partie",
          description: "Jouez votre première partie",
        },
        tenGames: {
          title: "Joueur Dévoué",
          description: "Jouez 10 parties",
        },
        fiftyGames: {
          title: "Joueur Expérimenté",
          description: "Jouez 50 parties",
        },
        hundredGames: {
          title: "Maître du Jeu",
          description: "Jouez 100 parties",
        },
        score1k: {
          title: "Premier Jalon",
          description: "Atteignez 1 000 points dans une partie",
        },
        score10k: {
          title: "Expert en Connaissances",
          description: "Atteignez 10 000 points dans une partie",
        },
        score100k: {
          title: "Sage de Wikidata",
          description: "Atteignez 100 000 points dans une partie",
        },
        score1m: {
          title: "Millionnaire",
          description: "Atteignez 1 000 000 points dans une partie",
        },
        topDaily: {
          title: "Étoile du Jour",
          description: "Atteignez le top 10 du classement quotidien",
        },
        topWeekly: {
          title: "Étoile de la Semaine",
          description: "Atteignez le top 10 du classement hebdomadaire",
        },
        topMonthly: {
          title: "Étoile du Mois",
          description: "Atteignez le top 10 du classement mensuel",
        },
        topAllTime: {
          title: "Légende",
          description: "Atteignez le top 10 du classement de tous les temps",
        },
      },
    },
    history: {
      title: "Historique des Parties",
      date: "Date",
      score: "Score",
      level: "Niveau",
      noData: "Aucune partie enregistrée",
    },
    settings: {
      title: "Paramètres",
      language: "Langue",
      sound: "Son",
      on: "Activé",
      off: "Désactivé",
      theme: "Thème",
      light: "Clair",
      dark: "Sombre",
      save: "Enregistrer",
      saved: "Enregistré !",
    },
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
      all: "Gesamtzeit",
    },
    noData: "Keine Daten für diesen Zeitraum verfügbar.",
    points: "Punkte",
    resetInfo: "Nächster Reset",
    resetsIn: "Resets in",
    position: "Position",
    player: "Spieler",
    score: "Score",
    games: "Spiele",
    totalScore: "Gesamtpunktzahl",
    tooltip: "Gesamtsumme der Punkte in diesem Zeitraum",
  },
  auth: {
    login: "Mit Wikidata anmelden",
    logout: "Abmelden",
    comingSoon: "Demnächst Verfügbar",
  },
  profile: {
    title: "Benutzerprofil",
    welcome: "Willkommen, {username}",
    welcomesubtitle: "Informationen zu deinem WikiMillionaire-Konto",
    joinedAt: "Beigetreten am",
    lastLogin: "Letzte Anmeldung",
    stats: {
      title: "Statistiken",
      gamesPlayed: "Gespielte Spiele",
      highScore: "Höchstpunktzahl",
      totalScore: "Gesamtpunktzahl",
      averageScore: "Durchschnittliche Punktzahl",
      ranking: "Ranglistenposition",
      lastGame: "Letztes Spiel",
      millionaireProgress: "Fortschritt zur Million",
    },
    achievements: {
      title: "Erfolge",
      locked: "Gesperrt",
      unlocked: "Freigeschaltet",
      progress: "Fortschritt: {current}/{total}",
      types: {
        score: {
          title: "Punktzahl",
          description: "Erfolge basierend auf deiner Punktzahl",
        },
        games: {
          title: "Spiele",
          description: "Erfolge basierend auf der Anzahl gespielter Spiele",
        },
        ranking: {
          title: "Rangliste",
          description: "Erfolge basierend auf deiner Position in der Rangliste",
        },
        streak: {
          title: "Serie",
          description: "Erfolge basierend auf deiner Spielserie",
        },
      },
      list: {
        firstGame: {
          title: "Erstes Spiel",
          description: "Spiele dein erstes Spiel",
        },
        tenGames: {
          title: "Engagierter Spieler",
          description: "Spiele 10 Spiele",
        },
        fiftyGames: {
          title: "Erfahrener Spieler",
          description: "Spiele 50 Spiele",
        },
        hundredGames: {
          title: "Spielmeister",
          description: "Spiele 100 Spiele",
        },
        score1k: {
          title: "Erster Meilenstein",
          description: "Erreiche 1.000 Punkte in einem Spiel",
        },
        score10k: {
          title: "Wissensexperte",
          description: "Erreiche 10.000 Punkte in einem Spiel",
        },
        score100k: {
          title: "Wikidata-Weiser",
          description: "Erreiche 100.000 Punkte in einem Spiel",
        },
        score1m: {
          title: "Millionär",
          description: "Erreiche 1.000.000 Punkte in einem Spiel",
        },
        topDaily: {
          title: "Tagesstern",
          description: "Erreiche die Top 10 in der täglichen Rangliste",
        },
        topWeekly: {
          title: "Wochenstern",
          description: "Erreiche die Top 10 in der wöchentlichen Rangliste",
        },
        topMonthly: {
          title: "Monatsstern",
          description: "Erreiche die Top 10 in der monatlichen Rangliste",
        },
        topAllTime: {
          title: "Legende",
          description: "Erreiche die Top 10 in der Gesamtrangliste",
        },
      },
    },
    history: {
      title: "Spielverlauf",
      date: "Datum",
      score: "Punktzahl",
      level: "Stufe",
      noData: "Keine Spiele aufgezeichnet",
    },
    settings: {
      title: "Einstellungen",
      language: "Sprache",
      sound: "Ton",
      on: "Ein",
      off: "Aus",
      theme: "Thema",
      light: "Hell",
      dark: "Dunkel",
      save: "Speichern",
      saved: "Gespeichert!",
    },
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
      all: "Todos os Tempos",
    },
    noData: "Não há dados disponíveis para este período.",
    points: "pontos",
    resetInfo: "Próximo reset",
    resetsIn: "Resets em",
    position: "Posição",
    player: "Jogador",
    score: "Score",
    games: "Jogos",
    totalScore: "Pontuação total",
    tooltip: "Soma total de pontos neste período",
  },
  auth: {
    login: "Entrar com Wikidata",
    logout: "Sair",
    comingSoon: "Em Breve",
  },
  profile: {
    title: "Perfil do Usuário",
    welcome: "Bem-vindo, {username}",
    welcomesubtitle: "Informações sobre sua conta do WikiMillionaire",
    joinedAt: "Entrou em",
    lastLogin: "Último login",
    stats: {
      title: "Estatísticas",
      gamesPlayed: "Jogos jogados",
      highScore: "Pontuação máxima",
      totalScore: "Pontuação total",
      averageScore: "Pontuação média",
      ranking: "Posição no ranking",
      lastGame: "Último jogo",
      millionaireProgress: "Progresso para o milhão",
    },
    achievements: {
      title: "Conquistas",
      locked: "Bloqueado",
      unlocked: "Desbloqueado",
      progress: "Progresso: {current}/{total}",
      types: {
        score: {
          title: "Pontuação",
          description: "Conquistas baseadas na sua pontuação",
        },
        games: {
          title: "Jogos",
          description: "Conquistas baseadas no número de jogos jogados",
        },
        ranking: {
          title: "Ranking",
          description: "Conquistas baseadas na sua posição no ranking",
        },
        streak: {
          title: "Sequência",
          description: "Conquistas baseadas na sua sequência de jogo",
        },
      },
      list: {
        firstGame: {
          title: "Primeiro Jogo",
          description: "Jogue seu primeiro jogo",
        },
        tenGames: {
          title: "Jogador Dedicado",
          description: "Jogue 10 jogos",
        },
        fiftyGames: {
          title: "Jogador Experiente",
          description: "Jogue 50 jogos",
        },
        hundredGames: {
          title: "Mestre do Jogo",
          description: "Jogue 100 jogos",
        },
        score1k: {
          title: "Primeiro Marco",
          description: "Alcance 1.000 pontos em um jogo",
        },
        score10k: {
          title: "Especialista em Conhecimento",
          description: "Alcance 10.000 pontos em um jogo",
        },
        score100k: {
          title: "Sábio do Wikidata",
          description: "Alcance 100.000 pontos em um jogo",
        },
        score1m: {
          title: "Milionário",
          description: "Alcance 1.000.000 pontos em um jogo",
        },
        topDaily: {
          title: "Estrela do Dia",
          description: "Alcance o top 10 no ranking diário",
        },
        topWeekly: {
          title: "Estrela da Semana",
          description: "Alcance o top 10 no ranking semanal",
        },
        topMonthly: {
          title: "Estrela do Mês",
          description: "Alcance o top 10 no ranking mensal",
        },
        topAllTime: {
          title: "Lenda",
          description: "Alcance o top 10 no ranking de todos os tempos",
        },
      },
    },
    history: {
      title: "Histórico de Jogos",
      date: "Data",
      score: "Pontuação",
      level: "Nível",
      noData: "Nenhum jogo registrado",
    },
    settings: {
      title: "Configurações",
      language: "Idioma",
      sound: "Som",
      on: "Ligado",
      off: "Desligado",
      theme: "Tema",
      light: "Claro",
      dark: "Escuro",
      save: "Salvar",
      saved: "Salvo!",
    },
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
