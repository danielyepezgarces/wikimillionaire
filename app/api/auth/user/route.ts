import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getGravatarUrl } from "@/lib/gravatar"

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Falta el token de acceso" }, { status: 400 })
    }

    console.log("Token recibido:", accessToken.substring(0, 10) + "...")

    // Obtener información del usuario desde Wikimedia
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
    console.log("Información del usuario obtenida:", userInfo)

    const supabase = createServerSupabaseClient()

    // Crear un email único basado en el ID de Wikimedia
    const email = `${userInfo.sub}@wikimedia.org`
    const password = process.env.SUPABASE_USER_PASSWORD || "password123"

    // 1. Primero, intentar iniciar sesión si el usuario ya existe
    let authUser
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.log("Usuario no existe, creando nuevo usuario en Auth:", email)

      // 2. Si no existe, crear el usuario en Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            wikimedia_id: userInfo.sub,
            username: userInfo.username,
          },
        },
      })

      if (signUpError) {
        console.error("Error al registrar usuario en Auth:", signUpError)
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
      }

      authUser = signUpData.user
      console.log("Usuario creado en Auth:", authUser?.id)
    } else {
      authUser = signInData.user
      console.log("Usuario existente en Auth:", authUser?.id)
    }

    if (!authUser) {
      return NextResponse.json({ error: "No se pudo obtener el usuario autenticado" }, { status: 500 })
    }

    // 3. Buscar si el usuario ya existe en la tabla users
    const { data: existingUser } = await supabase.from("users").select("*").eq("wikimedia_id", userInfo.sub).single()

    let userData

    if (existingUser) {
      console.log("Usuario existente en tabla users:", existingUser.id)

      // 4. Actualizar usuario existente
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          auth_id: authUser.id, // Asegurarse de que auth_id esté actualizado
        })
        .eq("id", existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error al actualizar usuario:", updateError)
        return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
      }

      userData = updatedUser
    } else {
      console.log("Creando nuevo usuario en tabla users")

      // 5. Crear nuevo usuario en la tabla users
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          username: userInfo.username,
          wikimedia_id: userInfo.sub,
          email: userInfo.email || null,
          avatar_url: userInfo.email ? getGravatarUrl(userInfo.email) : null,
          last_login: new Date().toISOString(),
          auth_id: authUser.id, // Vincular con el usuario de Auth
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error al insertar usuario:", insertError)
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
      }

      userData = newUser
    }

    // 6. Establecer una cookie de sesión
    const { data: session } = await supabase.auth.getSession()
    console.log("Sesión establecida:", session?.session?.user.id)

    // 7. Devolver los datos del usuario
    return NextResponse.json({
      ...userData,
      session: session?.session,
    })
  } catch (error: any) {
    console.error("Error en el endpoint de usuario:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
