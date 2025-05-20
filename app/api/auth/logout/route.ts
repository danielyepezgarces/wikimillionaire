import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    console.log("Cerrando sesión...")
    const supabase = createSupabaseClient()

    // Cerrar sesión en Supabase
    await supabase.auth.signOut()

    // Crear una respuesta con una cookie que expire la cookie de estado
    const response = NextResponse.redirect(new URL("/", request.url))

    // Eliminar la cookie de estado
    response.cookies.set("wikimedia_auth_state", "", {
      expires: new Date(0),
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    return NextResponse.redirect(new URL("/", request.url))
  }
}
