import { createSupabaseClient } from "@/lib/supabase"

// Función para guardar una puntuación
export async function saveScore(userId: string, score: number) {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from("scores")
      .insert({
        user_id: userId,
        score: score,
      })
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error al guardar puntuación:", error)
    throw error
  }
}

// Función para obtener la tabla de clasificación
export async function getLeaderboard() {
  try {
    const supabase = createSupabaseClient()

    // Obtener la fecha actual
    const now = new Date()

    // Calcular fechas para filtros
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Consulta para puntuaciones diarias
    const { data: dailyScores, error: dailyError } = await supabase
      .from("scores")
      .select(`
        id,
        score,
        created_at,
        users (
          id,
          username,
          avatar_url
        )
      `)
      .gte("created_at", today)
      .order("score", { ascending: false })
      .limit(10)

    if (dailyError) throw dailyError

    // Consulta para puntuaciones semanales
    const { data: weeklyScores, error: weeklyError } = await supabase
      .from("scores")
      .select(`
        id,
        score,
        created_at,
        users (
          id,
          username,
          avatar_url
        )
      `)
      .gte("created_at", weekAgo)
      .order("score", { ascending: false })
      .limit(10)

    if (weeklyError) throw weeklyError

    // Consulta para puntuaciones mensuales
    const { data: monthlyScores, error: monthlyError } = await supabase
      .from("scores")
      .select(`
        id,
        score,
        created_at,
        users (
          id,
          username,
          avatar_url
        )
      `)
      .gte("created_at", monthStart)
      .order("score", { ascending: false })
      .limit(10)

    if (monthlyError) throw monthlyError

    // Formatear los resultados
    const formatScores = (scores: any[]) => {
      return scores.map((item) => ({
        id: item.id,
        username: item.users.username,
        score: item.score,
        date: item.created_at,
        avatar_url: item.users.avatar_url,
      }))
    }

    return {
      daily: formatScores(dailyScores || []),
      weekly: formatScores(weeklyScores || []),
      monthly: formatScores(monthlyScores || []),
    }
  } catch (error) {
    console.error("Error al obtener tabla de clasificación:", error)
    throw error
  }
}

// Función para obtener las mejores puntuaciones de un usuario
export async function getUserTopScores(userId: string) {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("score", { ascending: false })
      .limit(5)

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error al obtener puntuaciones del usuario:", error)
    throw error
  }
}
