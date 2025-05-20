import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth"

// Rutas que no requieren autenticación
const publicRoutes = ["/", "/auth/callback", "/api/auth/login", "/api/auth/token", "/api/auth/user", "/api/auth/logout"]

export function middleware(request: NextRequest) {
  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith("/api/") ||
      request.nextUrl.pathname.startsWith("/_next/"),
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Verificar si hay un token de autenticación
  const token = request.cookies.get("auth_token")?.value

  if (!token) {
    // Redirigir a la página de inicio si no hay token
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Verificar si el token es válido
  const payload = verifyToken(token)

  if (!payload) {
    // Eliminar la cookie y redirigir a la página de inicio si el token no es válido
    const response = NextResponse.redirect(new URL("/", request.url))
    response.cookies.delete("auth_token")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
