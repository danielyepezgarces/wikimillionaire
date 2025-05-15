import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getGravatarUrl } from "@/lib/gravatar"

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Falta el token de acceso" }, { status: 400 })
    }

    // Obtener información del usuario
    const userInfoUrl = "https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile"

    const userInfoResponse = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      console.error("Error al obtener información del usuario:", errorText)
      return NextResponse.json(
        { error: `Error al obtener información del usuario: ${errorText}` },
        { status: userInfoResponse.status },
      )
    }

    const userInfo = await userInfoResponse.json()

    // Crear o actualizar usuario en Supabase
    const supabase = createServerSupabaseClient()

    // Buscar si el usuario ya existe
    const { data: existingUser } = await supabase.from("users").select("*").eq("wikimedia_id", userInfo.sub).single()

    let userData

    if (existingUser) {
      // Actualizar usuario existente
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()
        .single()

      if (updateError) throw updateError
      userData = updatedUser
    } else {
      // Crear nuevo usuario
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          username: userInfo.username,
          wikimedia_id: userInfo.sub,
          email: userInfo.email || null,
          avatar_url: userInfo.email ? getGravatarUrl(userInfo.email) : null,
          last_login: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) throw insertError
      userData = newUser
    }

    // Crear sesión para el usuario
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: `${userInfo.sub}@wikimedia.org`, // Email ficticio basado en el ID de Wikimedia
      password: process.env.SUPABASE_USER_PASSWORD || "password123", // Contraseña predefinida
    })

    if (signInError) {
      // Si el usuario no existe en auth, crearlo
      const { error: signUpError } = await supabase.auth.signUp({
        email: `${userInfo.sub}@wikimedia.org`,
        password: process.env.SUPABASE_USER_PASSWORD || "password123",
        options: {
          data: {
            wikimedia_id: userInfo.sub,
            username: userInfo.username,
          },
        },
      })

      if (signUpError) {
        console.error("Error al registrar usuario:", signUpError)
        // Intentar iniciar sesión de nuevo
        const { error: retrySignInError } = await supabase.auth.signInWithPassword({
          email: `${userInfo.sub}@wikimedia.org`,
          password: process.env.SUPABASE_USER_PASSWORD || "password123",
        })

        if (retrySignInError) {
          console.error("Error al iniciar sesión después del registro:", retrySignInError)
        }
      }
    }

    return NextResponse.json(userData)
  } catch (error: any) {
    console.error("Error en el endpoint de usuario:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
