import { query } from "@/lib/supabase"

// Tipo para las estadísticas del usuario
export type UserStats = {
  gamesPlayed: number
  highestScore: number
  totalScore: number
  averageScore: number
  lastPlayed: string
  rank?: number
  achievements?: Achievement[]
}

// Tipo para los logros
export type Achievement = {
  id: string
  name: string
  description: string
  unlocked: boolean
  unlockedAt?: string
  icon: string
}

// Tipo para la información de reinicio del ranking
export type RankingResetInfo = {
  period: "daily" | "weekly" | "monthly" | "all"
  nextReset: Date
  formattedNextReset: string
}

// Tipo para las entradas del leaderboard
export type LeaderboardEntry = {
  rank: number
  username: string
  avatarUrl: string | null
  score: number
  gamesPlayed: number
  lastPlayed: string
}

// Función para guardar una puntuación
export async function saveScore(username: string, score: number) {
  try {
    // Insertar la puntuación en la base de datos
    const result = await query(
      `INSERT INTO scores (username, score, created_at) 
       VALUES ($1, $2, NOW()) 
       RETURNING id, score, created_at`,
      [username, score],
    )

    // Verificar si se ha desbloqueado algún logro
    await checkAchievements(username, score)

    return result[0]
  } catch (error) {
    console.error("Error al guardar puntuación:", error)
    // Guardar en localStorage como fallback
    if (typeof window !== "undefined") {
      try {
        const user = JSON.parse(localStorage.getItem("wikimillionaire_user") || "{}")
        if (user && user.username) {
          saveScoreToLocalStorage(user.username, score)
        }
      } catch (e) {
        console.error("Error al guardar en localStorage:", e)
      }
    }
    throw error
  }
}

// Función para obtener la tabla de clasificación
export async function getLeaderboard(
  period: "daily" | "weekly" | "monthly" | "all" = "all",
  limit = 10,
): Promise<LeaderboardEntry[]> {
  try {
    // Si estamos en el cliente y no hay conexión a la base de datos, usar localStorage
    if (typeof window !== "undefined") {
      try {
        // Intentar obtener datos de la base de datos
        const entries = await getLeaderboardFromDB(period, limit)
        return entries
      } catch (dbError) {
        console.error("Error al obtener leaderboard de la base de datos:", dbError)
        // Si falla, intentar obtener datos de localStorage
        return getLeaderboardFromLocalStorage(period, limit)
      }
    } else {
      // En el servidor, solo intentar obtener datos de la base de datos
      return await getLeaderboardFromDB(period, limit)
    }
  } catch (error) {
    console.error("Error al obtener tabla de clasificación:", error)
    // Si estamos en el cliente, intentar obtener datos de localStorage como último recurso
    if (typeof window !== "undefined") {
      return getLeaderboardFromLocalStorage(period, limit)
    }
    // Si todo falla, devolver un array vacío
    return []
  }
}

// Función para obtener la tabla de clasificación desde la base de datos
async function getLeaderboardFromDB(
  period: "daily" | "weekly" | "monthly" | "all" = "all",
  limit = 10,
): Promise<LeaderboardEntry[]> {
  let timeFilter = ""
  const now = new Date()

  if (period === "daily") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    timeFilter = `WHERE s.created_at >= '${today}'`
  } else if (period === "weekly") {
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
    timeFilter = `WHERE s.created_at >= '${weekAgo}'`
  } else if (period === "monthly") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    timeFilter = `WHERE s.created_at >= '${monthStart}'`
  }

  // Consulta simplificada usando solo username
  const result = await query(
    `SELECT 
      u.username, 
      u.avatar_url, 
      SUM(s.score) as total_score, 
      COUNT(s.id) as games_played,
      MAX(s.created_at) as last_played
     FROM scores s
     JOIN users u ON s.username = u.username
     ${timeFilter}
     GROUP BY u.username, u.avatar_url
     ORDER BY total_score DESC, games_played DESC
     LIMIT $1`,
    [limit],
  )

  return result.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    avatarUrl: row.avatar_url,
    score: Number.parseInt(row.total_score) || 0,
    gamesPlayed: Number.parseInt(row.games_played) || 0,
    lastPlayed: row.last_played,
  }))
}

// Función para obtener la tabla de clasificación desde localStorage
function getLeaderboardFromLocalStorage(
  period: "daily" | "weekly" | "monthly" | "all" = "all",
  limit = 10,
): LeaderboardEntry[] {
  try {
    const scoresJson = localStorage.getItem("wikimillionaire-scores")
    if (!scoresJson) return []

    const scores = JSON.parse(scoresJson)
    const now = new Date()

    // Filtrar puntuaciones según el período
    let filteredScores = [...scores]
    if (period === "daily") {
      filteredScores = scores.filter((score: any) => {
        const scoreDate = new Date(score.date)
        return scoreDate.toDateString() === now.toDateString()
      })
    } else if (period === "weekly") {
      filteredScores = scores.filter((score: any) => {
        const scoreDate = new Date(score.date)
        const dayDiff = Math.floor((now.getTime() - scoreDate.getTime()) / (1000 * 60 * 60 * 24))
        return dayDiff < 7
      })
    } else if (period === "monthly") {
      filteredScores = scores.filter((score: any) => {
        const scoreDate = new Date(score.date)
        return scoreDate.getMonth() === now.getMonth() && scoreDate.getFullYear() === now.getFullYear()
      })
    }

    // Agrupar puntuaciones por usuario y sumarlas
    const userScores: Record<
      string,
      { username: string; totalScore: number; gamesPlayed: number; lastPlayed: string }
    > = {}

    filteredScores.forEach((score: any) => {
      const username = score.username
      if (!userScores[username]) {
        userScores[username] = {
          username,
          totalScore: 0,
          gamesPlayed: 0,
          lastPlayed: score.date,
        }
      }

      userScores[username].totalScore += score.score
      userScores[username].gamesPlayed += 1

      // Actualizar última partida si es más reciente
      const currentDate = new Date(userScores[username].lastPlayed)
      const scoreDate = new Date(score.date)
      if (scoreDate > currentDate) {
        userScores[username].lastPlayed = score.date
      }
    })

    // Convertir a array y ordenar
    const leaderboard = Object.values(userScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        username: entry.username,
        avatarUrl: null,
        score: entry.totalScore,
        gamesPlayed: entry.gamesPlayed,
        lastPlayed: entry.lastPlayed,
      }))

    return leaderboard
  } catch (error) {
    console.error("Error al obtener leaderboard de localStorage:", error)
    return []
  }
}

// Función para obtener información sobre cuándo se reinicia cada ranking
export function getRankingResetInfo(): RankingResetInfo[] {
  const now = new Date()

  // Calcular próximo reinicio diario (mañana a las 00:00)
  const dailyReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  // Calcular próximo reinicio semanal (próximo lunes a las 00:00)
  const daysUntilMonday = (7 - now.getDay()) % 7 || 7 // Si hoy es lunes (0), entonces 7 días
  const weeklyReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday)

  // Calcular próximo reinicio mensual (primer día del próximo mes)
  const monthlyReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  // Formatear las fechas
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return [
    {
      period: "daily",
      nextReset: dailyReset,
      formattedNextReset: formatDate(dailyReset),
    },
    {
      period: "weekly",
      nextReset: weeklyReset,
      formattedNextReset: formatDate(weeklyReset),
    },
    {
      period: "monthly",
      nextReset: monthlyReset,
      formattedNextReset: formatDate(monthlyReset),
    },
    {
      period: "all",
      nextReset: new Date(9999, 11, 31), // Nunca se reinicia
      formattedNextReset: "Nunca",
    },
  ]
}

// Función para obtener las estadísticas de un usuario
export async function getUserStats(username: string): Promise<UserStats> {
  try {
    // Obtener estadísticas básicas
    const statsResult = await query(
      `SELECT 
        COUNT(id) as games_played,
        MAX(score) as highest_score,
        SUM(score) as total_score,
        AVG(score) as average_score,
        MAX(created_at) as last_played
       FROM scores
       WHERE username = $1`,
      [username],
    )

    // Obtener posición en el ranking
    const rankResult = await query(
      `SELECT COUNT(*) as rank
       FROM (
         SELECT username, SUM(score) as total_score
         FROM scores
         GROUP BY username
         HAVING SUM(score) > (
           SELECT SUM(score) FROM scores WHERE username = $1
         )
       ) as better_scores`,
      [username],
    )

    // Obtener logros
    const achievements = await getUserAchievements(username)

    // Formatear los resultados
    const stats = statsResult[0]
    return {
      gamesPlayed: Number.parseInt(stats.games_played) || 0,
      highestScore: Number.parseInt(stats.highest_score) || 0,
      totalScore: Number.parseInt(stats.total_score) || 0,
      averageScore: Math.round(Number.parseFloat(stats.average_score) || 0),
      lastPlayed: stats.last_played || new Date().toISOString(),
      rank: Number.parseInt(rankResult[0].rank) + 1,
      achievements,
    }
  } catch (error) {
    console.error("Error al obtener estadísticas del usuario:", error)
    // Devolver estadísticas vacías en caso de error
    return {
      gamesPlayed: 0,
      highestScore: 0,
      totalScore: 0,
      averageScore: 0,
      lastPlayed: new Date().toISOString(),
      rank: 0,
      achievements: [],
    }
  }
}

// Función para obtener los logros de un usuario
async function getUserAchievements(username: string): Promise<Achievement[]> {
  try {
    // Verificar si existe la tabla de logros
    const tableExists = await query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_name = 'achievements'
       ) as exists`,
      [],
    )

    // Si no existe la tabla, crearla
    if (!tableExists[0].exists) {
      await query(
        `CREATE TABLE achievements (
           id SERIAL PRIMARY KEY,
           username VARCHAR(255) NOT NULL,
           achievement_id VARCHAR(50) NOT NULL,
           unlocked_at TIMESTAMP DEFAULT NOW()
         )`,
        [],
      )
    }

    // Obtener los logros desbloqueados por el usuario
    const unlockedAchievements = await query(
      `SELECT achievement_id, unlocked_at
       FROM achievements
       WHERE username = $1`,
      [username],
    )

    // Definir todos los logros disponibles
    const allAchievements: Achievement[] = [
      {
        id: "first_game",
        name: "Primer juego",
        description: "Jugar tu primera partida",
        unlocked: false,
        icon: "play",
      },
      {
        id: "score_10000",
        name: "Llegar a 10,000",
        description: "Conseguir una puntuación de 10,000 o más",
        unlocked: false,
        icon: "trophy",
      },
      {
        id: "score_100000",
        name: "Llegar a 100,000",
        description: "Conseguir una puntuación de 100,000 o más",
        unlocked: false,
        icon: "award",
      },
      {
        id: "millionaire",
        name: "Millonario",
        description: "Conseguir una puntuación de 1,000,000",
        unlocked: false,
        icon: "diamond",
      },
      {
        id: "games_10",
        name: "10 partidas",
        description: "Jugar 10 partidas",
        unlocked: false,
        icon: "gamepad",
      },
      {
        id: "top_10",
        name: "Top 10",
        description: "Entrar en el top 10 del ranking",
        unlocked: false,
        icon: "medal",
      },
    ]

    // Marcar los logros desbloqueados
    const unlockedMap = new Map(unlockedAchievements.map((a) => [a.achievement_id, a.unlocked_at]))

    return allAchievements.map((achievement) => ({
      ...achievement,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id),
    }))
  } catch (error) {
    console.error("Error al obtener logros del usuario:", error)
    return []
  }
}

// Función para verificar y desbloquear logros
async function checkAchievements(username: string, score: number) {
  try {
    // Obtener estadísticas actuales
    const stats = await getUserStats(username)

    // Verificar logros basados en puntuación
    if (score >= 1000000) {
      await unlockAchievement(username, "millionaire")
    } else if (score >= 100000) {
      await unlockAchievement(username, "score_100000")
    } else if (score >= 10000) {
      await unlockAchievement(username, "score_10000")
    }

    // Verificar logro de primer juego
    if (stats.gamesPlayed === 0) {
      await unlockAchievement(username, "first_game")
    }

    // Verificar logro de 10 partidas
    if (stats.gamesPlayed === 9) {
      await unlockAchievement(username, "games_10")
    }

    // Verificar logro de top 10
    if (stats.rank > 10) {
      const leaderboard = await getLeaderboard("all", 10)
      const wouldBeInTop10 = leaderboard.length < 10 || score > leaderboard[leaderboard.length - 1].score

      if (wouldBeInTop10) {
        await unlockAchievement(username, "top_10")
      }
    }
  } catch (error) {
    console.error("Error al verificar logros:", error)
  }
}

// Función para desbloquear un logro
async function unlockAchievement(username: string, achievementId: string) {
  try {
    // Verificar si el logro ya está desbloqueado
    const existing = await query(
      `SELECT id FROM achievements WHERE username = $1 AND achievement_id = $2`,
      [username, achievementId]
    )

    // Si no está desbloqueado, desbloquearlo
    if (existing.length === 0) {
      await query(
        `INSERT INTO achievements (username, achievement_id, unlocked_at)
         VALUES ($1, $2, NOW())`,
        [username, achievementId],
      )
    }
  } catch (error) {
    console.error(`Error al desbloquear logro ${achievementId}:`, error)
  }
}

// Función para guardar puntuación en localStorage (fallback)
export function saveScoreToLocalStorage(username: string, score: number) {
  try {
    const scoresJson = localStorage.getItem("wikimillionaire-scores")
    const scores = scoresJson ? JSON.parse(scoresJson) : []

    scores.push({
      username,
      score,
      date: new Date().toISOString(),
    })

    localStorage.setItem("wikimillionaire-scores", JSON.stringify(scores))
  } catch (error) {
    console.error("Error saving score to localStorage:", error)
  }
}

// Función para obtener puntuaciones de localStorage (fallback)
export function getScoresFromLocalStorage() {
  try {
    const scoresJson = localStorage.getItem("wikimillionaire-scores")
    return scoresJson ? JSON.parse(scoresJson) : []
  } catch (error) {
    console.error("Error getting scores from localStorage:", error)
    return []
  }
}