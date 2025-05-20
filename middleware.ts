import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

  // Verificar si hay un token de autenticación en cookies
  const authToken = request.cookies.get("auth_token")?.value
  const userCookie = request.cookies.get("wikimillionaire_user")?.value
  const sessionCookie = request.cookies.get("session")?.value

  // Verificar si hay datos de usuario en localStorage (a través de un header personalizado)
  const localStorageUser = request.headers.get("X-LocalStorage-User")

  // Si hay cualquier forma de autenticación, permitir el acceso
  if (authToken || userCookie || sessionCookie || localStorageUser) {
    return NextResponse.next()
  }

  // Si no hay ninguna forma de autenticación, redirigir a la página de inicio
  return NextResponse.redirect(new URL("/", request.url))
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
