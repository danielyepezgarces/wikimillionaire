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

    console.log("Solicitando información de usuario a:", userInfoUrl)

    const userInfoResponse = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "WikiMillionaire/1.0 (https://wikimillionaire.vercel.app/)",
        Accept: "application/json",
      },
    })

    console.log("Código de respuesta:", userInfoResponse.status)

    const rawText = await userInfoResponse.text()
    console.log("Respuesta cruda:", rawText.substring(0, 200))

    if (!userInfoResponse.ok) {
      console.error("Error en respuesta:", rawText)
      return NextResponse.json(
        { error: `Error al obtener información del usuario: ${rawText}` },
        { status: userInfoResponse.status },
      )
    }

    let userInfo
    try {
      userInfo = JSON.parse(rawText)
    } catch (parseError) {
      console.error("Error al parsear JSON:", parseError, "Contenido:", rawText)
      return NextResponse.json({ error: "Error al interpretar la respuesta de Wikimedia como JSON" }, { status: 502 })
    }

    console.log("Información del usuario obtenida:", userInfo)

    // Verificar que tenemos la información necesaria
    if (!userInfo.sub || !userInfo.username) {
      console.error("Información de usuario incompleta:", userInfo)
      return NextResponse.json(
        { error: "La información de usuario recibida de Wikimedia está incompleta" },
        { status: 400 },
      )
    }

    const supabase = createServerSupabaseClient()

    // Crear un email único basado en el ID de Wikimedia para Supabase Auth
    // Esto es necesario porque Supabase Auth requiere un email
    const authEmail = `${userInfo.sub}@wikimedia.org`
    const password = process.env.SUPABASE_USER_PASSWORD || "password123"

    // Usar el email real del usuario si está disponible
    const userEmail = userInfo.email || null
    console.log("Email del usuario:", userEmail || "No disponible")

    // 1. Primero, intentar iniciar sesión si el usuario ya existe
    let authUser
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    })

    if (signInError) {
      console.log("Usuario no existe en Auth, creando nuevo usuario:", authEmail)

      // 2. Si no existe, crear el usuario en Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: {
            wikimedia_id: userInfo.sub,
            username: userInfo.username,
            real_email: userEmail,
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

      // Actualizar los metadatos del usuario si es necesario
      if (authUser && (authUser.user_metadata?.real_email !== userEmail || !authUser.user_metadata?.real_email)) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            real_email: userEmail,
          },
        })

        if (updateError) {
          console.error("Error al actualizar metadatos del usuario:", updateError)
        } else {
          console.log("Metadatos del usuario actualizados con el email real")
        }
      }
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
          email: userEmail, // Actualizar el email con el valor real o null
          avatar_url: userEmail ? getGravatarUrl(userEmail) : null, // Actualizar avatar si hay email
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
          email: userEmail, // Usar el email real o null
          avatar_url: userEmail ? getGravatarUrl(userEmail) : null, // Solo usar Gravatar si hay email
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
