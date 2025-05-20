import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Leer parámetro returnTo para redirigir después del login
    const { searchParams } = new URL(request.url)
    const returnTo = searchParams.get("returnTo") || "/"

    // Redirigir al endpoint de Wikimedia
    return NextResponse.redirect(`/api/auth/wikimedia?returnTo=${encodeURIComponent(returnTo)}`)
  } catch (error: any) {
    console.error("Error en redirección:", error)
    return NextResponse.json({ error: "Error en redirección" }, { status: 500 })
  }
}
