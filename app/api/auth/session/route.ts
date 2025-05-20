import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { createSession } from "@/lib/session"

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    // console.log("Sesión actual:", sessionData?.session ? "Activa" : "No hay sesión")

    if (sessionError) {
      console.error("Error al obtener la sesión:", sessionError)
      return NextResponse.json({ error: "Error al obtener la sesión" }, { status: 500 })
    }

    // Si no hay sesión, intentar crear una
    if (!sessionData?.session) {
      const body = await request.json()
      const { wikimediaId, username, email } = body

      if (!wikimediaId) {
        return NextResponse.json({ error: "Se requiere wikimediaId" }, { status: 400 })
      }

      // Crear sesión para el usuario
      const session = await createSession({
        username: username || "Usuario",
        wikimedia_id: wikimediaId,
        email: email || null,
      })

      return NextResponse.json({
        message: "Sesión creada correctamente",
        user: session,
      })
    }

    // Si hay sesión, devolver la información
    return NextResponse.json({
      message: "Sesión activa",
      session: sessionData.session,
    })
  } catch (error: any) {
    console.error("Error al verificar/crear sesión:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
