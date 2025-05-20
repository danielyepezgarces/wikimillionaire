import { createSupabaseClient, query } from "@/lib/supabase"

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

// Función para guardar una puntuación
export async function saveScore(userId: string, score: number) {
  try {
    const supabase = createSupabaseClient()

    // Insertar la puntuación en la base de datos
    const result = await query(
      `INSERT INTO scores (user_id, score, created_at) 
       VALUES ($1, $2, NOW()) 
       RETURNING id, score, created_at`,
      [userId, score],
    )

    // Verificar si se ha desbloqueado algún logro
    await checkAchievements(userId, score)

    return result[0]
  } catch (error) {
    console.error("Error al guardar puntuación:", error)
    throw error
  }
}

// Función para obtener la tabla de clasificación
export async function getLeaderboard(period: "daily" | "weekly" | "monthly" | "all" = "all", limit = 10) {
  try {
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

    const result = await query(
      `SELECT 
        u.id as user_id, 
        u.username, 
        u.avatar_url, 
        MAX(s.score) as highest_score, 
        COUNT(s.id) as games_played,
        MAX(s.created_at) as last_played
       FROM scores s
       JOIN users u ON s.user_id = u.id
       ${timeFilter}
       GROUP BY u.id, u.username, u.avatar_url
       ORDER BY highest_score DESC, games_played DESC
       LIMIT $1`,
      [limit],
    )

    return result.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      username: row.username,
      avatarUrl: row.avatar_url,
      highestScore: row.highest_score,
      gamesPlayed: row.games_played,
      lastPlayed: row.last_played,
    }))
  } catch (error) {
    console.error("Error al obtener tabla de clasificación:", error)
    throw error
  }
}

// Función para obtener las estadísticas de un usuario
export async function getUserStats(userId: string): Promise<UserStats> {
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
       WHERE user_id = $1`,
      [userId],
    )

    // Obtener posición en el ranking
    const rankResult = await query(
      `SELECT COUNT(*) as rank
       FROM (
         SELECT user_id, MAX(score) as max_score
         FROM scores
         GROUP BY user_id
         HAVING MAX(score) > (
           SELECT MAX(score) FROM scores WHERE user_id = $1
         )
       ) as better_scores`,
      [userId],
    )

    // Obtener logros
    const achievements = await getUserAchievements(userId)

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
async function getUserAchievements(userId: string): Promise<Achievement[]> {
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
           user_id INTEGER REFERENCES users(id),
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
       WHERE user_id = $1`,
      [userId],
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
async function checkAchievements(userId: string, score: number) {
  try {
    // Obtener estadísticas actuales
    const stats = await getUserStats(userId)

    // Verificar logros basados en puntuación
    if (score >= 1000000) {
      await unlockAchievement(userId, "millionaire")
    } else if (score >= 100000) {
      await unlockAchievement(userId, "score_100000")
    } else if (score >= 10000) {
      await unlockAchievement(userId, "score_10000")
    }

    // Verificar logro de primer juego
    if (stats.gamesPlayed === 0) {
      await unlockAchievement(userId, "first_game")
    }

    // Verificar logro de 10 partidas
    if (stats.gamesPlayed === 9) {
      // Esta será la décima partida
      await unlockAchievement(userId, "games_10")
    }

    // Verificar logro de top 10
    if (stats.rank > 10) {
      const leaderboard = await getLeaderboard("all", 10)
      const wouldBeInTop10 = leaderboard.length < 10 || score > leaderboard[leaderboard.length - 1].highestScore

      if (wouldBeInTop10) {
        await unlockAchievement(userId, "top_10")
      }
    }
  } catch (error) {
    console.error("Error al verificar logros:", error)
  }
}

// Función para desbloquear un logro
async function unlockAchievement(userId: string, achievementId: string) {
  try {
    // Verificar si el logro ya está desbloqueado
    const existing = await query(`SELECT id FROM achievements WHERE user_id = $1 AND achievement_id = $2`, [
      userId,
      achievementId,
    ])

    // Si no está desbloqueado, desbloquearlo
    if (existing.length === 0) {
      await query(
        `INSERT INTO achievements (user_id, achievement_id, unlocked_at)
         VALUES ($1, $2, NOW())`,
        [userId, achievementId],
      )

      console.log(`Logro "${achievementId}" desbloqueado para el usuario ${userId}`)
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
