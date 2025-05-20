"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Translations } from "@/lib/i18n"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

interface WikimediaLoginButtonProps {
  t: Translations
}

export function WikimediaLoginButton({ t }: WikimediaLoginButtonProps) {
  const router = useRouter()
  const { user, loading, refreshUser, logout, getAuthUrl } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Asegurarse de que el componente está montado para evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
    // Intentar refrescar el usuario al montar el componente
    try {
      refreshUser()
    } catch (error) {
      // Error silencioso
    }
  }, [refreshUser])

  // Cerrar el menú cuando se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true)

      // Obtener la URL de autenticación
      const authUrl = await getAuthUrl()

      // Redirigir al usuario
      window.location.href = authUrl
    } catch (error) {
      // Error silencioso
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      // El logout ya redirige a la página principal
    } catch (error) {
      // Error silencioso
      setIsLoggingOut(false)
    }
  }

  const navigateToProfile = () => {
    setIsMenuOpen(false)
    window.location.href = "/profile"
  }

  const navigateToSettings = () => {
    setIsMenuOpen(false)
    window.location.href = "/settings"
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // No renderizar nada hasta que el componente esté montado
  if (!mounted) {
    return null
  }

  // Mostrar un indicador de carga mientras se verifica la sesión
  if (loading) {
    return (
      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-purple-700 text-white" disabled>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
        <span className="sr-only">Cargando...</span>
      </Button>
    )
  }

  if (user) {
    // Extraer el nombre de usuario de forma segura
    const username = user?.username || "Usuario"
    const firstLetter = username.charAt(0).toUpperCase()

    return (
      <div className="relative" ref={menuRef}>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-purple-700 overflow-hidden p-0"
          onClick={toggleMenu}
        >
          <div className="flex h-full w-full items-center justify-center bg-purple-800 text-white">{firstLetter}</div>
          <span className="sr-only">{username}</span>
        </Button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-purple-900 border border-purple-700 text-white z-10">
            <div className="py-2 px-4">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{username}</p>
                {user.email ? (
                  <p className="text-xs leading-none text-gray-400">{user.email}</p>
                ) : (
                  <p className="text-xs leading-none text-gray-400">Usuario de Wikidata</p>
                )}
              </div>
            </div>
            <div className="border-t border-purple-700"></div>
            <div className="py-1">
              <Link
                href="/profile"
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-purple-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-purple-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </Link>
            </div>
            <div className="border-t border-purple-700"></div>
            <div className="py-1">
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-purple-800"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                <span>{t.auth.logout}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-full border-purple-700 text-white hover:bg-purple-800/50 hover:text-white"
      onClick={handleLogin}
      disabled={isLoggingIn}
    >
      {isLoggingIn ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      <span className="sr-only">{t.auth.login}</span>
    </Button>
  )
}
