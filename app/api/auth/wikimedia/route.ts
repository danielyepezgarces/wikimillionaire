import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.WIKIMEDIA_CLIENT_ID
    const clientSecret = process.env.WIKIMEDIA_CLIENT_SECRET
    const redirectUri = process.env.WIKIMEDIA_REDIRECT_URI || "https://wikimillionaire.vercel.app/auth/callback"

    if (!clientId || !redirectUri) {
      console.error("[Wikimedia] Missing configuration: clientId or redirectUri")
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
    }

    // Determine client type: confidential (has secret) or public (no secret)
    const isConfidentialClient = !!clientSecret

    console.log("[Wikimedia] Starting OAuth flow with client_id:", clientId)
    console.log("[Wikimedia] Using redirect_uri:", redirectUri)
    console.log("[Wikimedia] Client type:", isConfidentialClient ? "confidential" : "public (PKCE)")

    // Generar state aleatorio para todos los clientes
    const state = crypto.randomBytes(16).toString("hex")

    // Leer parámetro returnTo para redirigir después del login
    const { searchParams } = new URL(request.url)
    const returnTo = searchParams.get("returnTo") || "/"

    let codeVerifier = ""
    let codeChallenge = ""
    let authUrl = ""

    if (isConfidentialClient) {
      // Confidential client: No PKCE, just state
      authUrl =
        `https://meta.wikimedia.org/w/rest.php/oauth2/authorize?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(state)}`
    } else {
      // Public client: Use PKCE
      codeVerifier = crypto.randomBytes(64).toString("hex")
      
      // Calcular code challenge (SHA256 base64url)
      codeChallenge = crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")

      authUrl =
        `https://meta.wikimedia.org/w/rest.php/oauth2/authorize?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(state)}` +
        `&code_challenge=${encodeURIComponent(codeChallenge)}` +
        `&code_challenge_method=S256`
    }

    // Guardar state, codeVerifier (si es público) y returnTo en cookie segura
    const cookieValue = JSON.stringify({ state, codeVerifier, returnTo })

    console.log("[Wikimedia] Redirecting to authorization URL")

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
    console.error("[Wikimedia] Error initiating authentication:", error)
    return NextResponse.json({ error: "Error iniciando autenticación" }, { status: 500 })
  }
}
