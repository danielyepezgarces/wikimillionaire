import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  try {
    console.log("Iniciando proceso de autenticación con Wikimedia")

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
      console.error("Falta configuración: clientId o redirectUri")
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
    }

    // Leer parámetro returnTo para redirigir después del login
    const { searchParams } = new URL(request.url)
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

    console.log("URL de autorización Wikimedia:", authUrl.substring(0, 100) + "...")
    console.log("Estableciendo cookie wikimedia_auth_state con valor:", cookieValue.substring(0, 50) + "...")

    // Crear una página HTML que almacene el estado en localStorage y luego redirija
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirigiendo a Wikimedia...</title>
        <script>
          // Almacenar el estado en localStorage como fallback
          localStorage.setItem('wikimedia_auth_state', '${cookieValue.replace(/'/g, "\\'")}');
          
          // Redirigir a Wikimedia
          window.location.href = "${authUrl}";
        </script>
      </head>
      <body>
        <p>Redirigiendo a Wikimedia...</p>
      </body>
      </html>
    `

    // Responder con la página HTML
    const response = new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    })

    // Configurar la cookie con opciones más permisivas
    response.cookies.set("wikimedia_auth_state", cookieValue, {
      httpOnly: false, // Permitir acceso desde JavaScript
      secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
      maxAge: 60 * 60, // 1 hora
      path: "/", // Disponible en todo el sitio
      sameSite: "lax" as const, // Más permisivo que "strict"
    })

    return response
  } catch (error: any) {
    console.error("Error iniciando autenticación directa:", error)
    return NextResponse.json({ error: "Error iniciando autenticación" }, { status: 500 })
  }
}
