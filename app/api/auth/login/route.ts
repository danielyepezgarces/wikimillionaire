import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  try {
    // Generar state para seguridad CSRF
    const state = crypto.randomBytes(16).toString("hex")

    // Generar code_verifier para PKCE
    const codeVerifier = crypto.randomBytes(64).toString("hex")

    // Generar code_challenge
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")

    // Guardar state y code_verifier en una cookie segura
    const cookieValue = JSON.stringify({ state, codeVerifier })
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // 10 minutos
      path: "/",
      sameSite: "lax" as const,
    }

    // Construir URL de autorización
    const clientId = process.env.WIKIMEDIA_CLIENT_ID
    const redirectUri = process.env.WIKIMEDIA_REDIRECT_URI || "https://wikimillionaire.vercel.app/auth/callback"

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
    }

    const authUrl =
      `https://meta.wikimedia.org/w/rest.php/oauth2/authorize?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&code_challenge=${encodeURIComponent(codeChallenge)}` +
      `&code_challenge_method=S256`

    // Redirigir al usuario a la URL de autorización
    const response = NextResponse.redirect(authUrl)
    response.cookies.set("wikimedia_auth_state", cookieValue, cookieOptions)

    return response
  } catch (error: any) {
    console.error("Error iniciando autenticación:", error)
    return NextResponse.json({ error: "Error iniciando autenticación" }, { status: 500 })
  }
}
