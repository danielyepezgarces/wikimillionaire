"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogIn, LogOut, User, Settings } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import type { Translations } from "@/lib/i18n"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"

interface WikimediaLoginButtonProps {
  t: Translations
}

export function WikimediaLoginButton({ t }: WikimediaLoginButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true)
      // Redirigir al endpoint de redirección
      window.location.href = `/api/auth/wikimedia?returnTo=${encodeURIComponent(pathname)}`
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
      // Recargar la página para asegurar que todo se actualice correctamente
      window.location.href = "/"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-purple-700 overflow-hidden p-0">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url || "/placeholder.svg"}
                alt={user.username}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-purple-800 text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="sr-only">{user.username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-purple-900 border-purple-700 text-white">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              {user.email ? (
                <p className="text-xs leading-none text-gray-400">{user.email}</p>
              ) : (
                <p className="text-xs leading-none text-gray-400">Usuario de Wikimedia</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-purple-700" />
          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-purple-800 hover:text-white"
            onClick={() => router.push("/profile")}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-purple-800 hover:text-white"
            onClick={() => router.push("/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-purple-700" />
          <DropdownMenuItem
            className="cursor-pointer text-white hover:bg-purple-800 hover:text-white"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            <span>{t.auth.logout}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
