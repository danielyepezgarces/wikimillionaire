import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier } = await request.json();

    if (!code || !codeVerifier) {
      return NextResponse.json({ error: "Faltan parámetros code o codeVerifier" }, { status: 400 });
    }

    const clientId = process.env.WIKIMEDIA_CLIENT_ID;
    const clientSecret = process.env.WIKIMEDIA_CLIENT_SECRET; // Si tu app usa client_secret
    const redirectUri = process.env.WIKIMEDIA_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 });
    }

    // Construir body para el token request
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("client_id", clientId);
    params.append("code_verifier", codeVerifier);

    // Si tu OAuth requiere client_secret (varía según proveedor)
    if (clientSecret) {
      params.append("client_secret", clientSecret);
    }

    const tokenResponse = await fetch("https://meta.wikimedia.org/w/rest.php/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Error al obtener token OAuth:", tokenData);
      return NextResponse.json({ error: tokenData.error_description || tokenData.error || "Error al obtener el token" }, { status: 400 });
    }

    return NextResponse.json(tokenData);
  } catch (error: any) {
    console.error("Error en /api/auth/token:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
