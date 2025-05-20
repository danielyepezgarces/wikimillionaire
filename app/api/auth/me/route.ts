import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/crypto"

export async function GET(request: Request) {
  try {

    // Obtener todas las cookies para depuración
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    // Buscar la cookie del usuario
    const userCookie = cookieStore.get("wikimillionaire_user")

    // Verificar si hay un header con datos de localStorage
    const localStorageUser = request.headers.get("X-LocalStorage-User")

    if (localStorageUser) {
      try {
        const userData = JSON.parse(localStorageUser)

        // Guardar estos datos en una cookie para futuras solicitudes
        const response = NextResponse.json(userData)

        // No podemos usar encrypt aquí porque es una operación asíncrona
        // y no podemos hacer await en este contexto
        // En su lugar, guardamos los datos sin encriptar pero en httpOnly
        response.cookies.set("wikimillionaire_user", JSON.stringify(userData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 7 días
          path: "/",
          sameSite: "lax",
        })

        return response
      } catch (error) {
        console.error("Error al procesar datos de localStorage:", error)
      }
    }

    if (!userCookie) {

      // Verificar si hay otras cookies relacionadas
      const sessionCookie = cookieStore.get("session")
      if (sessionCookie) {
        console.log("Se encontró cookie 'session', intentando usarla")
        try {
          const sessionData = await decrypt(sessionCookie.value)
          const sessionJson = JSON.parse(sessionData)

          if (sessionJson && sessionJson.user) {
            console.log("Se encontró usuario en la cookie 'session'")
            return NextResponse.json(sessionJson.user)
          }
        } catch (error) {
          console.error("Error al procesar la cookie 'session':", error)
        }
      }

      // Si llegamos aquí, no hay usuario autenticado
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    try {
      // Intentar desencriptar la cookie
      let userData

      // Verificar si la cookie está encriptada o es JSON plano
      try {
        userData = JSON.parse(userCookie.value)
      } catch {
        // Si no es JSON plano, intentar desencriptar
        const decryptedUser = await decrypt(userCookie.value)
        userData = JSON.parse(decryptedUser)
      }


      if (!userData) {
        return NextResponse.json({ error: "Datos de usuario inválidos" }, { status: 401 })
      }

      return NextResponse.json(userData)
    } catch (error) {
      console.error("Error al procesar la cookie:", error)

      // Si hay un error al procesar, eliminar la cookie corrupta
      const response = NextResponse.json({ error: "Error al procesar la sesión" }, { status: 500 })
      response.cookies.delete("wikimillionaire_user")

      return response
    }
  } catch (error: any) {
    console.error("Error general en /api/auth/me:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
