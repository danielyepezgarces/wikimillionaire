import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")

    if (!code || !state) {
      return NextResponse.json({ error: "Código o estado faltante" }, { status: 400 })
    }

    const cookieStore = cookies()
    const authCookie = cookieStore.get("wikimedia_auth_state")

    if (!authCookie) {
      return NextResponse.json({ error: "No se encontró la cookie de autenticación" }, { status: 400 })
    }

    const { state: storedState, codeVerifier, returnTo } = JSON.parse(authCookie.value)

    if (state !== storedState) {
      return NextResponse.json({ error: "El estado no coincide" }, { status: 400 })
    }

    const clientId = process.env.WIKIMEDIA_CLIENT_ID
    const clientSecret = process.env.WIKIMEDIA_CLIENT_SECRET
    const redirectUri = process.env.WIKIMEDIA_REDIRECT_URI || "https://wikimillionaire.vercel.app/auth/callback"

    const tokenResponse = await fetch("https://meta.wikimedia.org/w/rest.php/oauth2/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenResponse.ok) {
      console.error("Error al obtener el token:", await tokenResponse.text())
      return NextResponse.json({ error: "Error al obtener el token" }, { status: 500 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Puedes obtener datos del usuario si los necesitas
    const userInfoRes = await fetch("https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userInfoRes.ok) {
      console.error("Error al obtener perfil:", await userInfoRes.text())
      return NextResponse.json({ error: "Error al obtener perfil del usuario" }, { status: 500 })
    }

    const user = await userInfoRes.json()

    // Aquí puedes guardar la sesión con el usuario si usas algún sistema de sesiones
    const response = NextResponse.redirect(returnTo || "/")

    // Guarda los datos básicos del usuario (token o ID) en cookie si quieres
    response.cookies.set("wikimedia_user", JSON.stringify(user), {
      httpOnly: false, // Puedes cambiar esto si quieres ocultarlo del cliente
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    })

    // Limpia la cookie temporal de estado
    response.cookies.delete("wikimedia_auth_state")

    return response
  } catch (error: any) {
    console.error("Error en el callback:", error)
    return NextResponse.json({ error: "Error en el callback de autenticación" }, { status: 500 })
  }
}
