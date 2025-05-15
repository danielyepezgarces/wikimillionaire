import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    if (errorParam) {
      return NextResponse.json({ error: `Error de autenticación: ${errorParam}` }, { status: 400 });
    }

    if (!code || !state) {
      return NextResponse.json({ error: "No se recibieron los parámetros necesarios" }, { status: 400 });
    }

    const cookie = request.cookies.get("wikimedia_auth_state");
    if (!cookie) {
      return NextResponse.json({ error: "No se encontró el estado de autenticación" }, { status: 400 });
    }

    let authState;
    try {
      authState = JSON.parse(cookie.value);
    } catch {
      return NextResponse.json({ error: "Error al procesar el estado de autenticación" }, { status: 400 });
    }

    if (state !== authState.state) {
      return NextResponse.json({ error: "Estado de autenticación inválido" }, { status: 400 });
    }

    // Ahora intercambia el código por token con Wikimedia

    const tokenResponse = await fetch("https://meta.wikimedia.org/w/rest.php/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.WIKIMEDIA_REDIRECT_URI || "https://tu-dominio.com/api/auth/callback",
        client_id: process.env.WIKIMEDIA_CLIENT_ID || "",
        code_verifier: authState.codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.json({ error: errorData.error || "Error al obtener el token" }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();

    // Opcional: aquí podrías hacer otra petición para obtener info del usuario con tokenData.access_token

    // Eliminar cookie porque ya no se necesita
    const response = NextResponse.json({ message: "Autenticación exitosa", tokenData });
    response.cookies.delete("wikimedia_auth_state", { path: "/" });

    return response;
  } catch (err: any) {
    console.error("Error en callback:", err);
    return NextResponse.json({ error: "Error interno en callback" }, { status: 500 });
  }
}
