// /api/auth/login.ts
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  try {
    // Verificar si ya estamos en un proceso de redirección para evitar bucles
    const { searchParams } = new URL(request.url)
    const isRedirect = searchParams.get("isRedirect") === "true"

    if (isRedirect) {
      console.error("Detectado posible bucle de redirección")
      return NextResponse.json({ error: "Posible bucle de redirección detectado" }, { status: 400 })
    }

    // Generar state y code verifier aleatorios
    const state = crypto.randomBytes(16).toString("hex")
    const codeVerifier = crypto.randomBytes(64).toString("hex")

    // Calcular code challenge (SHA256 base64url)
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")

    const clientId = process.env.WIKIMEDIA_CLIENT_ID
    const redirectUri = process.env.WIKIMEDIA_REDIRECT_URI || "https://wikimillionaire.vercel.app/auth/callback"

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
    }

    // Leer parámetro returnTo para redirigir después del login
    const returnTo = searchParams.get("returnTo") || "/"

    // Guardar state, codeVerifier y returnTo en cookie segura
    const cookieValue = JSON.stringify({ state, codeVerifier, returnTo })

    // Construir URL de autorización OAuth2
    const authUrl =
      `https://meta.wikimedia.org/w/rest.php/oauth2/authorize?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&code_challenge=${encodeURIComponent(codeChallenge)}` +
      `&code_challenge_method=S256`

    // console.log("URL de autorización:", authUrl)
    // console.log("Estableciendo cookie wikimedia_auth_state con valor:", cookieValue.substring(0, 20) + "...")

    // Responder con redirección y cookie
    const response = NextResponse.redirect(authUrl)

    // Configurar la cookie con opciones más permisivas
    response.cookies.set("wikimedia_auth_state", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 30, // 30 minutos
      path: "/",
      sameSite: "lax" as const,
    })

    return response
  } catch (error: any) {
    console.error("Error iniciando autenticación:", error)
    return NextResponse.json({ error: "Error iniciando autenticación" }, { status: 500 })
  }
}
