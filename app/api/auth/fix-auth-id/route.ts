import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()

    // Obtener la sesión actual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error al obtener la sesión:", sessionError)
      return NextResponse.json({ error: "Error al obtener la sesión" }, { status: 401 })
    }

    if (!sessionData?.session) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 })
    }

    const authUserId = sessionData.session.user.id

    // Obtener todos los usuarios
    const { data: allUsers, error: allUsersError } = await supabase.from("users").select("*")

    if (allUsersError) {
      console.error("Error al obtener todos los usuarios:", allUsersError)
      return NextResponse.json({ error: "Error al obtener todos los usuarios" }, { status: 500 })
    }


    // Si no hay usuarios, crear uno
    if (!allUsers || allUsers.length === 0) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          username: sessionData.session.user.user_metadata?.username || "Usuario",
          wikimedia_id: sessionData.session.user.user_metadata?.wikimedia_id || null,
          email: sessionData.session.user.user_metadata?.real_email || null,
          auth_id: authUserId,
          last_login: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error al crear usuario:", insertError)
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
      }

      return NextResponse.json({ message: "Usuario creado correctamente", user: newUser })
    }

    // Buscar el usuario más reciente
    const mostRecentUser = allUsers.sort(
      (a, b) => new Date(b.last_login || 0).getTime() - new Date(a.last_login || 0).getTime(),
    )[0]

    // Actualizar el auth_id del usuario más reciente
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        auth_id: authUserId,
        last_login: new Date().toISOString(),
      })
      .eq("id", mostRecentUser.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error al actualizar usuario:", updateError)
      return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
    }

    return NextResponse.json({ message: "Usuario actualizado correctamente", user: updatedUser })
  } catch (error: any) {
    console.error("Error al arreglar auth_id:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
