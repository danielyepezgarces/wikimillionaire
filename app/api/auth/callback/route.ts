import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      return NextResponse.json({ error: "Faltan parámetros code o state" }, { status: 400 })
    }

    // Leer la cookie con el state guardado y validar
    const cookieState = request.cookies.get("wikimedia_auth_state")

    if (!cookieState) {
      return NextResponse.json({ error: "No se encontró cookie de estado" }, { status: 400 })
    }

    let parsedCookie
    try {
      parsedCookie = JSON.parse(cookieState.value)
    } catch {
      return NextResponse.json({ error: "Cookie de estado inválida" }, { status: 400 })
    }

    if (parsedCookie.state !== state) {
      return NextResponse.json({ error: "El estado no coincide" }, { status: 400 })
    }


    // Intercambio del código por el token
    const clientSecret = process.env.WIKIMEDIA_CLIENT_SECRET
    const isConfidentialClient = !!clientSecret

    const tokenParams: Record<string, string> = {
      client_id: process.env.WIKIMEDIA_CLIENT_ID || "",
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.WIKIMEDIA_REDIRECT_URI || "https://wikimillionaire.vercel.app/auth/callback",
    }

    // For confidential clients: use client_secret (no PKCE)
    // For public clients: use PKCE code_verifier (no client_secret)
    if (isConfidentialClient) {
      tokenParams.client_secret = clientSecret
    } else {
      tokenParams.code_verifier = parsedCookie.codeVerifier
    }

    const tokenResponse = await fetch("https://meta.wikimedia.org/w/rest.php/oauth2/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(tokenParams),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Error al obtener token:", errorText)
      return NextResponse.json({ error: `Error obteniendo token: ${errorText}` }, { status: tokenResponse.status })
    }

    const tokenData = await tokenResponse.json()

    // Retornamos el token y returnTo para que el cliente sepa qué hacer
    return NextResponse.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      returnTo: parsedCookie.returnTo || "/",
    })
  } catch (error: any) {
    console.error("Error en callback:", error)
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
