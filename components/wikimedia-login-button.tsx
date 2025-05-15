"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LogIn, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Translations } from "@/lib/i18n"
import { useAuth } from "@/contexts/auth-context"

interface WikimediaLoginButtonProps {
  t: Translations
}

export function WikimediaLoginButton({ t }: WikimediaLoginButtonProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true)
      // Redirigir al endpoint de inicio de sesión del servidor
      window.location.href = "/api/auth/login"
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      router.refresh()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-purple-700 text-white hover:bg-purple-800/50 hover:text-white"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="sr-only">{t.auth.logout}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-purple-900 border-purple-700 text-white">
            <p>{t.auth.logout}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent className="bg-purple-900 border-purple-700 text-white">
          <p>{t.auth.login}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
