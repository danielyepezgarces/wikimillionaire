import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/crypto"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const userCookie = cookieStore.get("wikimillionaire_user")
    const localStorageUser = request.headers.get("X-LocalStorage-User")

    // Si se recibió un header con el usuario desde localStorage
    if (localStorageUser) {
      try {
        const userData = JSON.parse(localStorageUser)

        const response = NextResponse.json(userData)
        response.headers.append(
          "Set-Cookie",
          `wikimillionaire_user=${encodeURIComponent(
            JSON.stringify(userData)
          )}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; ${
            process.env.NODE_ENV === "production" ? "Secure;" : ""
          } SameSite=Lax`
        )

        return response
      } catch (error) {
        console.error("Error al procesar datos de localStorage:", error)
        return NextResponse.json(
          { error: "Datos de usuario malformados" },
          { status: 400 }
        )
      }
    }

    if (!userCookie) {
      const sessionCookie = cookieStore.get("session")
      if (sessionCookie) {
        try {
          const sessionData = await decrypt(sessionCookie.value)
          const sessionJson = JSON.parse(sessionData)

          if (sessionJson?.user) {
            return NextResponse.json(sessionJson.user)
          }
        } catch (error) {
          console.error("Error al procesar la cookie 'session':", error)
        }
      }

      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    try {
      let userData

      try {
        userData = JSON.parse(userCookie.value)
      } catch {
        const decryptedUser = await decrypt(userCookie.value)
        userData = JSON.parse(decryptedUser)
      }

      if (!userData) {
        return NextResponse.json({ error: "Datos de usuario inválidos" }, { status: 401 })
      }

      return NextResponse.json(userData)
    } catch (error) {
      console.error("Error al procesar la cookie:", error)

      const response = NextResponse.json(
        { error: "Error al procesar la sesión" },
        { status: 500 }
      )
      response.headers.append(
        "Set-Cookie",
        "wikimillionaire_user=; Path=/; Max-Age=0"
      )

      return response
    }
  } catch (error: any) {
    console.error("Error general en /api/auth/me:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
