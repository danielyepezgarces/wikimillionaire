import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { state, codeVerifier, returnTo } = await request.json()

    if (!state || !codeVerifier) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    // Devolver los datos para que el cliente los almacene en localStorage
    return NextResponse.json({ state, codeVerifier, returnTo })
  } catch (error: any) {
    console.error("Error al almacenar estado:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
