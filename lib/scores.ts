import { createSupabaseClient, createServerSupabaseClient } from "./supabase"

// Tipo para las puntuaciones
export type Score = {
  id: string
  username: string
  score: number
  date: string
  avatar_url?: string | null
}

export type Leaderboard = {
  daily: Score[]
  weekly: Score[]
  monthly: Score[]
}

// Función para guardar una puntuación
export async function saveScore(userId: string, score: number): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase.from("scores").insert({
      user_id: userId,
      score,
    })

    if (error) {
      console.error("Error saving score:", error)
      throw new Error("Failed to save score")
    }

    console.log(`Score saved: ${userId} - ${score}`)
  } catch (error) {
    console.error("Error saving score:", error)
    throw new Error("Failed to save score")
  }
}

// Función para obtener las tablas de clasificación
export async function getLeaderboard(): Promise<Leaderboard> {
  try {
    const supabase = createServerSupabaseClient()

    // Obtener la fecha actual
    const now = new Date()

    // Calcular fechas para filtros
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Domingo como inicio de semana
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now)
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Consulta para puntuaciones diarias
    const { data: dailyScores, error: dailyError } = await supabase
      .from("scores")
      .select(`
        id,
        score,
        created_at,
        users!inner (
          id,
          username,
          avatar_url
        )
      `)
      .gte("created_at", startOfDay.toISOString())
      .order("score", { ascending: false })
      .limit(10)

    // Consulta para puntuaciones semanales
    const { data: weeklyScores, error: weeklyError } = await supabase
      .from("scores")
      .select(`
        id,
        score,
        created_at,
        users!inner (
          id,
          username,
          avatar_url
        )
      `)
      .gte("created_at", startOfWeek.toISOString())
      .order("score", { ascending: false })
      .limit(10)

    // Consulta para puntuaciones mensuales
    const { data: monthlyScores, error: monthlyError } = await supabase
      .from("scores")
      .select(`
        id,
        score,
        created_at,
        users!inner (
          id,
          username,
          avatar_url
        )
      `)
      .gte("created_at", startOfMonth.toISOString())
      .order("score", { ascending: false })
      .limit(10)

    if (dailyError || weeklyError || monthlyError) {
      console.error("Error getting leaderboard:", dailyError || weeklyError || monthlyError)
      throw new Error("Failed to get leaderboard")
    }

    // Formatear los resultados
    const formatScores = (scores: any[]): Score[] => {
      return scores.map((item) => ({
        id: item.id,
        username: item.users.username,
        score: item.score,
        date: item.created_at,
        avatar_url: item.users.avatar_url,
      }))
    }

    return {
      daily: dailyScores ? formatScores(dailyScores) : [],
      weekly: weeklyScores ? formatScores(weeklyScores) : [],
      monthly: monthlyScores ? formatScores(monthlyScores) : [],
    }
  } catch (error) {
    console.error("Error getting leaderboard:", error)
    throw new Error("Failed to get leaderboard")
  }
}

// Función para obtener las puntuaciones de un usuario específico
export async function getUserScores(userId: string): Promise<Score[]> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from("scores")
      .select(`
        id,
        score,
        created_at,
        users!inner (
          id,
          username,
          avatar_url
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error getting user scores:", error)
      throw new Error("Failed to get user scores")
    }

    return data
      ? data.map((item) => ({
          id: item.id,
          username: item.users.username,
          score: item.score,
          date: item.created_at,
          avatar_url: item.users.avatar_url,
        }))
      : []
  } catch (error) {
    console.error("Error getting user scores:", error)
    throw new Error("Failed to get user scores")
  }
}
