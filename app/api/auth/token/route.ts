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

    const tokenUrl = "https://meta.wikimedia.org/w/rest.php/oauth2/access_token"

    const params = new URLSearchParams()
    params.append("grant_type", "authorization_code")
    params.append("code", code)
    params.append("redirect_uri", redirectUri)
    params.append("client_id", clientId)
    params.append("client_secret", clientSecret)
    params.append("code_verifier", codeVerifier)

    console.log("Enviando solicitud de token con parámetros:", {
      grant_type: "authorization_code",
      code: code.substring(0, 10) + "...", // Truncado por seguridad
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret.substring(0, 5) + "...", // Truncado por seguridad
      code_verifier: codeVerifier.substring(0, 10) + "...", // Truncado por seguridad
    })

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error completo al obtener token:", errorText)
      return NextResponse.json({ error: `Error al obtener el token: ${errorText}` }, { status: response.status })
    }

    const tokenData = await response.json()
    return NextResponse.json(tokenData)
  } catch (error: any) {
    console.error("Error en el endpoint de token:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
