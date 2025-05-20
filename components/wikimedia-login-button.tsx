"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Translations } from "@/lib/i18n"
import { useAuth } from "@/contexts/auth-context"

interface WikimediaLoginButtonProps {
  t: Translations
}

export function WikimediaLoginButton({ t }: WikimediaLoginButtonProps) {
  const router = useRouter()
  const { user, loading, refreshUser, logout, getAuthUrl } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Asegurarse de que el componente está montado para evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
    // Intentar refrescar el usuario al montar el componente
    try {
      refreshUser()
    } catch (error) {
      console.error("Error al refrescar usuario:", error)
    }
  }, [refreshUser])

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true)

      // Obtener la URL de autenticación
      const authUrl = await getAuthUrl()

      // Redirigir al usuario
      window.location.href = authUrl
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      setIsLoggingOut(false)
    }
  }

  // No renderizar nada hasta que el componente esté montado
  if (!mounted) {
    return null
  }

  console.log("WikimediaLoginButton: Estado actual:", { user, loading })

  // Mostrar un indicador de carga mientras se verifica la sesión
  if (loading) {
    return (
      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-purple-700 text-white" disabled>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
        <span className="sr-only">Cargando...</span>
      </Button>
    )
  }

  // Si el usuario está autenticado, mostrar botón de logout
  if (user) {
    console.log("WikimediaLoginButton: Usuario autenticado:", user)
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-white hidden md:inline-block">{user.username ? user.username : "Usuario"}</span>
        <Button
          variant="outline"
          size="sm"
          className="text-white border-purple-700 hover:bg-purple-800 hover:text-white"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          <span>{t.auth.logout}</span>
        </Button>
      </div>
    )
  }

  // Si el usuario no está autenticado, mostrar botón de login
  console.log("WikimediaLoginButton: Usuario no autenticado")
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-white border-purple-700 hover:bg-purple-800 hover:text-white"
      onClick={handleLogin}
      disabled={isLoggingIn}
    >
      {isLoggingIn ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
      ) : (
        <LogIn className="h-4 w-4 mr-2" />
      )}
      <span>{t.auth.login}</span>
    </Button>
  )
}
