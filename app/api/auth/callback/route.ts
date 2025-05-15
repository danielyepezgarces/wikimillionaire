import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  const cookie = request.cookies.get("wikimedia_auth_state")?.value
  if (!cookie) return NextResponse.redirect("/?error=missing_state")

  const { codeVerifier } = JSON.parse(cookie)
  const clientId = process.env.WIKIMEDIA_CLIENT_ID!
  const clientSecret = process.env.WIKIMEDIA_CLIENT_SECRET!
  const redirectUri = process.env.WIKIMEDIA_REDIRECT_URI!

  try {
    // 🔐 Intercambiar el code por un token
    const tokenRes = await fetch("https://meta.wikimedia.org/w/rest.php/oauth2/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: code!,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) throw new Error("Token response not ok")

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // 👤 Obtener el perfil del usuario
    const profileRes = await fetch("https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!profileRes.ok) {
      console.error("Perfil no se pudo obtener:", await profileRes.text())
      throw new Error("Error al obtener perfil")
    }

    const profile = await profileRes.json()

    // Aquí puedes guardar la sesión, redirigir, etc.
    const response = NextResponse.redirect("/")
    response.cookies.set("wikimedia_session", JSON.stringify({ user: profile }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch (error) {
    console.error("Error en el callback:", error)
    return NextResponse.redirect("/?error=profile_fetch_failed")
  }
}

