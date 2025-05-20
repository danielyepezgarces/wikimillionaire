"use client"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"

export function SessionHandler() {
  const { user, loading, refreshUser } = useAuth()
  const pathname = usePathname()

  // Ignorar rutas de autenticación para evitar bucles
  const isAuthRoute = pathname.includes("/auth/callback") || pathname.includes("/api/auth")

  // Este componente ahora no hace nada
  return null
}
