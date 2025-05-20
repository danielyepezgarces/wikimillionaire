"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User, Settings } from "lucide-react"
import type { Translations } from "@/lib/i18n"
import { useAuth } from "@/contexts/auth-context"

interface WikimediaLoginButtonProps {
  t: Translations
}

export function WikimediaLoginButton({ t }: WikimediaLoginButtonProps) {
  const { user, loading, refreshUser, logout, getAuthUrl } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setMounted(true)
    try {
      refreshUser()
    } catch (error) {
      // Error silencioso
    }
  }, [refreshUser])

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
      const authUrl = await getAuthUrl()
      if (isClient) {
        window.location.href = authUrl
      }
    } catch (error) {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      if (isClient) {
        window.location.href = "/"
      }
    } catch (error) {
      setIsLoggingOut(false)
    }
  }

  const handleNavigation = (path: string) => {
    if (isClient) {
      window.location.href = path
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-purple-700 text-white" disabled>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
        <span className="sr-only">Cargando...</span>
      </Button>
    )
  }

  if (user) {
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
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-purple-800"
                onClick={() => handleNavigation("/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </button>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-purple-800"
                onClick={() => handleNavigation("/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </button>
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