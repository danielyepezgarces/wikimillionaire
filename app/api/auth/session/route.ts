import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    console.log("Sesión actual:", sessionData?.session ? "Activa" : "No hay sesión")

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

      // Crear un email sintético para Supabase Auth
      const syntheticEmail = `${wikimediaId}@wikidata.org`
      const password = process.env.SUPABASE_USER_PASSWORD || "password123"

      // Verificar si el usuario ya existe en Supabase Auth
      const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserByEmail(syntheticEmail)

      if (getUserError && getUserError.message !== "User not found") {
        console.error("Error al verificar si el usuario existe:", getUserError)
        return NextResponse.json({ error: "Error al verificar si el usuario existe" }, { status: 500 })
      }

      let authUserId

      if (existingUser) {
        console.log("Usuario ya existe en Supabase Auth:", existingUser)
        authUserId = existingUser.id

        // Iniciar sesión con el usuario existente
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password,
        })

        if (signInError) {
          console.error("Error al iniciar sesión con el usuario existente:", signInError)
          return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
        }

        console.log("Sesión creada con usuario existente:", signInData.session ? "Éxito" : "Fallo")
      } else {
        // Crear un nuevo usuario en Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: syntheticEmail,
          password,
          options: {
            data: {
              wikimedia_id: wikimediaId,
              username,
              real_email: email,
            },
          },
        })

        if (signUpError) {
          console.error("Error al crear usuario en Supabase Auth:", signUpError)
          return NextResponse.json({ error: "Error al crear usuario en Supabase Auth" }, { status: 500 })
        }

        console.log("Usuario creado en Supabase Auth:", signUpData.user ? "Éxito" : "Fallo")
        console.log("Sesión creada:", signUpData.session ? "Éxito" : "Fallo")

        if (!signUpData.user) {
          return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
        }

        authUserId = signUpData.user.id
      }

      // Verificar si el usuario existe en la tabla users
      const { data: existingDbUser, error: dbUserError } = await supabase
        .from("users")
        .select("*")
        .eq("wikimedia_id", wikimediaId)
        .single()

      if (dbUserError && dbUserError.code !== "PGRST116") {
        console.error("Error al verificar si el usuario existe en la tabla users:", dbUserError)
      }

      if (existingDbUser) {
        console.log("Usuario ya existe en la tabla users:", existingDbUser)

        // Actualizar el auth_id si es necesario
        if (existingDbUser.auth_id !== authUserId) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ auth_id: authUserId, last_login: new Date().toISOString() })
            .eq("id", existingDbUser.id)

          if (updateError) {
            console.error("Error al actualizar auth_id:", updateError)
          } else {
            console.log("auth_id actualizado correctamente")
          }
        }

        return NextResponse.json({
          message: "Sesión creada correctamente",
          user: existingDbUser,
        })
      } else {
        // Crear un nuevo usuario en la tabla users
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            username: username || "Usuario",
            wikimedia_id: wikimediaId,
            email: email || null,
            avatar_url: email ? `https://www.gravatar.com/avatar/${email}?d=mp` : null,
            auth_id: authUserId,
            last_login: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          console.error("Error al crear usuario en la tabla users:", insertError)
          return NextResponse.json({ error: "Error al crear usuario en la tabla users" }, { status: 500 })
        }

        console.log("Usuario creado en la tabla users:", newUser)
        return NextResponse.json({
          message: "Sesión y usuario creados correctamente",
          user: newUser,
        })
      }
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
