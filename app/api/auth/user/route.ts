import { type NextRequest, NextResponse } from "next/server"
import { createUserCookie } from "@/lib/cookie-auth"

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

          // Crear usuario en cookie
          const user = await createUserCookie({
            username: fallbackUserInfo.username,
            wikimedia_id: fallbackUserInfo.sub,
            email: null,
          })

          return NextResponse.json(user)
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

        // Crear usuario en cookie
        const user = await createUserCookie({
          username: userInfo.username,
          wikimedia_id: userInfo.sub,
          email: userInfo.email,
        })

        return NextResponse.json(user)
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

    // Crear usuario en cookie
    const user = await createUserCookie({
      username: userInfo.username,
      wikimedia_id: userInfo.sub,
      email: userInfo.email || null,
    })

    return NextResponse.json(user)
  } catch (error: any) {
    console.error("Error en el endpoint de usuario:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
