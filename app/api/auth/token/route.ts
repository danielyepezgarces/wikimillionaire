import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier } = await request.json()

    if (!code || !codeVerifier) {
      console.error("[Token] Missing required parameters:", { code: !!code, codeVerifier: !!codeVerifier })
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    console.log("[Token] Processing token request with code:", code.substring(0, 10) + "...")
    console.log("[Token] CodeVerifier present:", !!codeVerifier)

    const clientId = process.env.WIKIMEDIA_CLIENT_ID
    const clientSecret = process.env.WIKIMEDIA_CLIENT_SECRET
    const redirectUri = process.env.WIKIMEDIA_REDIRECT_URI || "https://wikimillionaire.vercel.app/auth/callback"

    if (!clientId || !clientSecret) {
      console.error("[Token] Missing environment variables for authentication")
      return NextResponse.json({ error: "Faltan variables de entorno para la autenticación" }, { status: 500 })
    }

    console.log("[Token] Using client_id:", clientId)
    console.log("[Token] Using redirect_uri:", redirectUri)

    // Use meta.wikimedia.org for consistency with the authorization endpoint
    const tokenUrl = "https://meta.wikimedia.org/w/rest.php/oauth2/access_token"

    const params = new URLSearchParams()
    params.append("grant_type", "authorization_code")
    params.append("code", code)
    params.append("redirect_uri", redirectUri)
    params.append("client_id", clientId)
    params.append("client_secret", clientSecret)
    params.append("code_verifier", codeVerifier)

    console.log("[Token] Making request to:", tokenUrl)

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

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Token] Full error when obtaining token from Wikimedia:", errorText)

      // Intentar parsear el error como JSON
      try {
        const errorJson = JSON.parse(errorText)
        console.error("[Token] Error JSON:", errorJson)

        // Manejar errores específicos
        if (errorJson.error === "invalid_grant" || errorJson.hint?.includes("revoked")) {
          return NextResponse.json(
            {
              error:
                "El código de autorización ha expirado o ya fue usado. Por favor, intenta iniciar sesión nuevamente.",
            },
            { status: 400 },
          )
        }

        if (errorJson.error === "invalid_request") {
          return NextResponse.json(
            {
              error: "Solicitud inválida. Por favor, intenta iniciar sesión nuevamente.",
            },
            { status: 400 },
          )
        }

        if (errorJson.error === "invalid_client") {
          return NextResponse.json(
            {
              error: "Error de autenticación del cliente. Por favor, verifica las credenciales de la aplicación.",
            },
            { status: 401 },
          )
        }
      } catch (e) {
        // No es JSON, continuar con el manejo normal
      }

      return NextResponse.json({ error: `Error al obtener el token: ${errorText}` }, { status: response.status })
    }

    const tokenData = await response.json()
    console.log("[Token] Token obtained successfully")

    return NextResponse.json(tokenData)
  } catch (error: any) {
    console.error("[Token] Error in token endpoint:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
