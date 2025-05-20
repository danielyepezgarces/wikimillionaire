import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier } = await request.json()

    if (!code || !codeVerifier) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    const clientId = process.env.WIKIMEDIA_CLIENT_ID
    const clientSecret = process.env.WIKIMEDIA_CLIENT_SECRET
    const redirectUri = process.env.WIKIMEDIA_REDIRECT_URI || "https://wikimillionaire.vercel.app/auth/callback"

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Faltan variables de entorno para la autenticación" }, { status: 500 })
    }

    const tokenUrl = "https://www.wikidata.org/w/rest.php/oauth2/access_token"

    const params = new URLSearchParams()
    params.append("grant_type", "authorization_code")
    params.append("code", code)
    params.append("redirect_uri", redirectUri)
    params.append("client_id", clientId)
    params.append("client_secret", clientSecret)
    params.append("code_verifier", codeVerifier)

    console.log("Enviando solicitud de token a Wikidata con parámetros:", {
      grant_type: "authorization_code",
      code: code.substring(0, 10) + "...", // Truncado por seguridad
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret.substring(0, 5) + "...", // Truncado por seguridad
      code_verifier: codeVerifier.substring(0, 10) + "...", // Truncado por seguridad
    })

    // Intentar obtener el token con un timeout
    let timeoutId: NodeJS.Timeout | null = null
    const timeoutPromise = new Promise<Response>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Timeout al obtener el token"))
      }, 10000) // 10 segundos de timeout
    })

    const fetchPromise = fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "WikiMillionaire/1.0 (https://wikimillionaire.vercel.app/)",
        Accept: "application/json",
      },
      body: params.toString(),
    })

    // Usar Promise.race para implementar el timeout
    const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response

    // Limpiar el timeout si la promesa se resuelve antes
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    console.log("Respuesta del servidor de token de Wikidata:", response.status, response.statusText)
    console.log("Headers de respuesta:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error completo al obtener token de Wikidata:", errorText)

      // Intentar parsear el error como JSON
      try {
        const errorJson = JSON.parse(errorText)
        console.error("Error JSON:", errorJson)

        // Manejar errores específicos
        if (errorJson.error === "invalid_grant") {
          return NextResponse.json(
            {
              error:
                "El código de autorización ha expirado o es inválido. Por favor, intenta iniciar sesión nuevamente.",
            },
            { status: 400 },
          )
        }
      } catch (e) {
        // No es JSON, continuar con el manejo normal
      }

      return NextResponse.json({ error: `Error al obtener el token: ${errorText}` }, { status: response.status })
    }

    const tokenData = await response.json()
    console.log("Token obtenido correctamente de Wikidata:", {
      access_token: tokenData.access_token ? tokenData.access_token.substring(0, 10) + "..." : "no token",
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
    })

    return NextResponse.json(tokenData)
  } catch (error: any) {
    console.error("Error en el endpoint de token:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
