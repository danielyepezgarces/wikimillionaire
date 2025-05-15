import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error("OAuth Error:", error, error_description);
    return res.status(400).send(`Error de autenticación: ${error_description || error}`);
  }

  if (!code || !state) {
    return res.status(400).send("Falta el código o el estado en la respuesta.");
  }

  try {
    // Aquí haces el intercambio de 'code' por el access_token
    const tokenResponse = await fetch("https://meta.wikimedia.org/w/rest.php/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code.toString(),
        redirect_uri: process.env.WIKIMEDIA_REDIRECT_URI || "http://localhost:3000/api/auth/callback",
        client_id: process.env.WIKIMEDIA_CLIENT_ID || "",
        client_secret: process.env.WIKIMEDIA_CLIENT_SECRET || "",
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Error al obtener token:", errText);
      return res.status(500).send("Error al obtener token de acceso.");
    }

    const tokenData = await tokenResponse.json();

    // Guardar token en cookie segura o en sesión según tu arquitectura
    // Por ejemplo:
    res.setHeader(
      "Set-Cookie",
      `access_token=${tokenData.access_token}; HttpOnly; Path=/; Secure; SameSite=Lax; Max-Age=${tokenData.expires_in}`
    );

    // Redirigir al frontend para continuar el flujo
    return res.redirect("/");
  } catch (err) {
    console.error("Error en callback OAuth:", err);
    return res.status(500).send("Error interno del servidor durante autenticación.");
  }
}
