import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getGravatarUrl } from "@/lib/gravatar"

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Falta el token de acceso" }, { status: 400 })
    }

    console.log("Token recibido:", accessToken)

    // Obtener información del usuario desde Wikimedia
    const userInfoUrl = "https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile"
    const userInfoResponse = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    console.log("Código de respuesta:", userInfoResponse.status)
    console.log("Headers:", userInfoResponse.headers)

    const rawText = await userInfoResponse.text()

    if (!userInfoResponse.ok) {
      console.error("Error en respuesta:", rawText)
      return NextResponse.json(
        { error: `Error al obtener información del usuario: ${rawText}` },
        { status: userInfoResponse.status },
      )
    }

    if (!rawText) {
      console.error("Respuesta vacía de Wikimedia")
      return NextResponse.json(
        { error: "Respuesta vacía de Wikimedia. Verifica el accessToken." },
        { status: 502 }
      )
    }

    const contentType = userInfoResponse.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      console.error("Respuesta no es JSON:", rawText)
      return NextResponse.json(
        { error: `Respuesta inesperada desde Wikimedia: ${rawText}` },
        { status: 502 }
      )
    }

    let userInfo
    try {
      userInfo = JSON.parse(rawText)
    } catch (parseError) {
      console.error("Error al parsear JSON:", parseError, "Contenido:", rawText)
      return NextResponse.json(
        { error: "Error al interpretar la respuesta de Wikimedia como JSON" },
        { status: 502 }
      )
    }

    console.log("Información del usuario:", userInfo)

    const supabase = createServerSupabaseClient()

    // Buscar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("wikimedia_id", userInfo.sub)
      .single()

    let userData

    if (existingUser) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", existingUser.id)
        .select()
        .single()

      if (updateError) throw updateError
      userData = updatedUser
    } else {
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

    const email = `${userInfo.sub}@wikimedia.org`
    const password = process.env.SUPABASE_USER_PASSWORD || "password123"

    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({
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
        console.error("Error al registrar usuario:", signUpError)

        const { error: retrySignInError } = await supabase.auth.signInWithPassword({
          email,
          password,
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
