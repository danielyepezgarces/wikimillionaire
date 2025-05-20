import { NextResponse } from "next/server"
import { getUserStats } from "@/lib/scores"

export async function GET(request: Request) {
  try {
    // Obtener el ID de usuario de la URL
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Se requiere el ID de usuario" }, { status: 400 })
    }

    // Obtener las estadísticas del usuario
    const stats = await getUserStats(userId)

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("Error al obtener estadísticas:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
