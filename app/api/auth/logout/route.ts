import { NextResponse } from "next/server"
import { deleteUserCookie } from "@/lib/cookie-auth"

export async function POST() {
  try {
    deleteUserCookie()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error al cerrar sesión:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
