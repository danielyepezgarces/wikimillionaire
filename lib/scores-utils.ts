// Client-safe utilities for scores functionality
// This file contains code that can be safely used in client components

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
  userId?: string
  username: string
  avatarUrl: string | null
  score: number
  gamesPlayed: number
  lastPlayed: string
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
