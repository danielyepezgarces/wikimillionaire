import { NextResponse } from "next/server"
import { encrypt } from "@/lib/crypto"

export async function POST(request: Request) {
  try {
    const { user } = await request.json()

    if (!user) {
      return NextResponse.json({ error: "Datos de usuario no proporcionados" }, { status: 400 })
    }

    console.log("Sincronizando usuario desde cliente:", user)

    // Crear la respuesta
    const response = NextResponse.json({ success: true })

    // Establecer la cookie con los datos del usuario (sin encriptar para simplificar)
    response.cookies.set("wikimillionaire_user", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
      sameSite: "lax",
    })

    // También guardar en una cookie de sesión para mayor compatibilidad
    const sessionData = {
      user,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    // Intentar encriptar, pero si falla, guardar como JSON
    try {
      const encryptedSession = await encrypt(JSON.stringify(sessionData))
      response.cookies.set("session", encryptedSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
        sameSite: "lax",
      })
    } catch (error) {
      console.error("Error al encriptar sesión:", error)
      // Guardar sin encriptar como fallback
      response.cookies.set("session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
        sameSite: "lax",
      })
    }

    return response
  } catch (error: any) {
    console.error("Error al sincronizar usuario:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
