import { NextResponse } from "next/server"
import { getUserFromCookie } from "@/lib/cookie-auth"

export async function GET() {
  try {
    console.log("Endpoint /api/auth/me llamado")

    const user = await getUserFromCookie()
    console.log("Usuario obtenido de cookie:", user ? "Existe" : "No existe")

    if (!user) {
      console.log("No hay usuario en cookie, devolviendo 401")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    console.log("Devolviendo usuario al cliente")
    return NextResponse.json(user)
  } catch (error: any) {
    console.error("Error al obtener el usuario actual:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
