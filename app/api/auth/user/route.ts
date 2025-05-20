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

    // Obtener información del usuario desde Wikidata
    const userInfoUrl = "https://www.wikidata.org/w/rest.php/oauth2/resource/profile"

    console.log("Solicitando información de usuario a Wikidata:", userInfoUrl)

    // Intentar obtener la información del usuario con un timeout
    let timeoutId: NodeJS.Timeout | null = null
    const timeoutPromise = new Promise<Response>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Timeout al obtener información del usuario"))
      }, 10000) // 10 segundos de timeout
    })

    const fetchPromise = fetch(userInfoUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "WikiMillionaire/1.0 (https://wikimillionaire.vercel.app/)",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    // Usar Promise.race para implementar el timeout
    const userInfoResponse = (await Promise.race([fetchPromise, timeoutPromise])) as Response

    // Limpiar el timeout si la promesa se resuelve antes
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    console.log("Código de respuesta de Wikidata:", userInfoResponse.status)
    console.log("Headers de respuesta:", Object.fromEntries(userInfoResponse.headers.entries()))

    const rawText = await userInfoResponse.text()
    console.log("Respuesta cruda de Wikidata:", rawText.substring(0, 200))

    if (!userInfoResponse.ok) {
      console.error("Error en respuesta de Wikidata:", rawText)

      // Si el error es específicamente sobre wikis incorrectos, intentar con una URL alternativa
      if (rawText.includes("mwoauth-invalid-authorization-wrong-wiki")) {
        console.log("Error específico de wiki incorrecto, intentando con URL alternativa...")

        // Intentar con una URL alternativa
        const alternativeUrl = "https://www.wikidata.org/w/index.php?title=Special:OAuth/identify"
        console.log("Intentando con URL alternativa:", alternativeUrl)

        const alternativeResponse = await fetch(alternativeUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "WikiMillionaire/1.0 (https://wikimillionaire.vercel.app/)",
            Accept: "application/json",
          },
        })

        console.log("Código de respuesta alternativa:", alternativeResponse.status)

        const alternativeText = await alternativeResponse.text()
        console.log("Respuesta alternativa:", alternativeText.substring(0, 200))

        if (!alternativeResponse.ok) {
          // Si ambos métodos fallan, crear un usuario de fallback
          console.log("Ambos métodos fallaron, usando información de usuario de fallback")

          const fallbackUserInfo = {
            sub: "wikidata_user_" + Date.now(), // Generar un ID único
            username: "WikidataUser_" + Math.floor(Math.random() * 10000), // Nombre de usuario genérico
            email: null, // Sin email
          }

          console.log("Usando información de usuario de fallback:", fallbackUserInfo)

          // Continuar con el proceso usando la información de fallback
          return await processUserInfo(fallbackUserInfo)
        }

        // Intentar parsear la respuesta alternativa
        let alternativeInfo
        try {
          alternativeInfo = JSON.parse(alternativeText)
        } catch (parseError) {
          console.error("Error al parsear JSON alternativo:", parseError)

          // Si no se puede parsear, intentar extraer información básica del texto
          const usernameMatch = alternativeText.match(/"username"\s*:\s*"([^"]+)"/)
          const subMatch = alternativeText.match(/"sub"\s*:\s*"([^"]+)"/)

          if (usernameMatch && subMatch) {
            alternativeInfo = {
              username: usernameMatch[1],
              sub: subMatch[1],
              email: null,
            }
          } else {
            // Si no se puede extraer información, usar fallback
            alternativeInfo = {
              sub: "wikidata_user_" + Date.now(),
              username: "WikidataUser_" + Math.floor(Math.random() * 10000),
              email: null,
            }
          }
        }

        // Adaptar la respuesta alternativa al formato esperado
        const userInfo = {
          sub: alternativeInfo.sub || alternativeInfo.username || "unknown",
          username: alternativeInfo.username || "unknown",
          email: alternativeInfo.email || null,
        }

        console.log("Información del usuario obtenida (alternativa):", userInfo)

        // Continuar con el proceso normal
        return await processUserInfo(userInfo)
      }

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
      return NextResponse.json({ error: "Error al interpretar la respuesta de Wikidata como JSON" }, { status: 502 })
    }

    console.log("Información del usuario obtenida de Wikidata:", userInfo)

    return await processUserInfo(userInfo)
  } catch (error: any) {
    console.error("Error en el endpoint de usuario:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }

  // Función para procesar la información del usuario
  async function processUserInfo(userInfo: any) {
    try {
      // Verificar que tenemos la información necesaria
      if (!userInfo.sub || !userInfo.username) {
        console.error("Información de usuario incompleta:", userInfo)
        return NextResponse.json(
          { error: "La información de usuario recibida de Wikidata está incompleta" },
          { status: 400 },
        )
      }

      const supabase = createServerSupabaseClient()

      // IMPORTANTE: Usar siempre el mismo formato de email para la autenticación
      // Usar wikimedia_id@wikimedia.org para mantener consistencia
      const authEmail = `${userInfo.sub}@wikimedia.org`
      const password = process.env.SUPABASE_USER_PASSWORD || "password123"

      // Usar el email real del usuario si está disponible
      const userEmail = userInfo.email || null
      console.log("Email del usuario:", userEmail || "No disponible")
      console.log("Email de autenticación:", authEmail)

      // 1. Primero, intentar iniciar sesión si el usuario ya existe
      let authUser
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      })

      if (signInError) {
        console.log("Usuario no existe en Auth, creando nuevo usuario:", authEmail)
        console.log("Error de inicio de sesión:", signInError.message)

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

          // Intentar un enfoque alternativo si el registro falla
          console.log("Intentando enfoque alternativo para la autenticación...")

          // Intentar iniciar sesión de nuevo, por si acaso el usuario ya existe pero hubo un error
          const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password,
          })

          if (retrySignInError) {
            console.error("Error en el segundo intento de inicio de sesión:", retrySignInError)
            return NextResponse.json(
              {
                error: "No se pudo crear o autenticar al usuario. Por favor, intenta nuevamente.",
              },
              { status: 500 },
            )
          }

          authUser = retrySignInData.user
          console.log("Usuario autenticado en el segundo intento:", authUser?.id)
        } else {
          authUser = signUpData.user
          console.log("Usuario creado en Auth:", authUser?.id)
        }
      } else {
        authUser = signInData.user
        console.log("Usuario existente en Auth:", authUser?.id)

        // Actualizar los metadatos del usuario si es necesario
        if (authUser && (authUser.user_metadata?.real_email !== userEmail || !authUser.user_metadata?.real_email)) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              real_email: userEmail,
              wikimedia_id: userInfo.sub,
              username: userInfo.username,
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
      const { data: existingUser, error: findError } = await supabase
        .from("users")
        .select("*")
        .eq("wikimedia_id", userInfo.sub)
        .single()

      if (findError) {
        console.log("Error al buscar usuario existente:", findError.message)
        console.log("El usuario no existe en la tabla users, creando uno nuevo")
      }

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

          // Intentar un enfoque alternativo si la inserción falla
          console.log("Intentando enfoque alternativo para la creación de usuario...")

          // Verificar si la tabla users existe y tiene las columnas necesarias
          const { data: tableInfo, error: tableError } = await supabase.from("users").select("id").limit(1)

          if (tableError) {
            console.error("Error al verificar la tabla users:", tableError)
            return NextResponse.json(
              {
                error: "Error al verificar la estructura de la base de datos",
              },
              { status: 500 },
            )
          }

          // Intentar insertar con menos campos
          const { data: simpleUser, error: simpleError } = await supabase
            .from("users")
            .insert({
              username: userInfo.username,
              wikimedia_id: userInfo.sub,
              auth_id: authUser.id,
            })
            .select()
            .single()

          if (simpleError) {
            console.error("Error al insertar usuario simplificado:", simpleError)
            return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
          }

          userData = simpleUser
        } else {
          userData = newUser
        }
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
      console.error("Error al procesar información del usuario:", error)
      return NextResponse.json({ error: error.message || "Error al procesar información del usuario" }, { status: 500 })
    }
  }
}
