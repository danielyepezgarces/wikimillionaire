import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    // Agregar un log para depuración
    console.log("Endpoint /api/auth/me llamado")

    const session = await getSession()
    console.log("Sesión obtenida:", session ? "Existe" : "No existe")

    if (!session) {
      console.log("No hay sesión activa, devolviendo 401")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    console.log("Devolviendo sesión al cliente")
    return NextResponse.json(session)
  } catch (error: any) {
    console.error("Error al obtener el usuario actual:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
