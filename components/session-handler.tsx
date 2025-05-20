"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"

export function SessionHandler() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [lastChecked, setLastChecked] = useState<number>(Date.now())
  const isRedirecting = useRef(false)

  // Ignorar rutas de autenticación para evitar bucles
  const isAuthRoute = pathname.includes("/auth/callback") || pathname.includes("/api/auth")

  useEffect(() => {
    // No verificar en rutas de autenticación
    if (isAuthRoute) {
      return
    }

    // Verificar la sesión cuando el componente se monta
    const checkSession = async () => {
      // Si ya estamos redirigiendo, no hacer nada
      if (isRedirecting.current) {
        return
      }

      const supabase = createSupabaseClient()
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error al verificar la sesión:", error)
        return
      }

      // Si no hay sesión y el usuario estaba autenticado, redirigir al login
      if (!data.session && !loading && user) {
        console.log("Sesión expirada, redirigiendo al login")
        isRedirecting.current = true

        // Usar un timeout para evitar múltiples redirecciones
        setTimeout(() => {
          window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(pathname)}`
        }, 100)
      }

      setLastChecked(Date.now())
    }

    // Solo verificar después de que la carga inicial haya terminado
    if (!loading) {
      checkSession()
    }

    // Verificar la sesión periódicamente, pero con menos frecuencia
    const intervalId = setInterval(
      () => {
        // Solo verificar si ha pasado al menos 10 minutos desde la última verificación
        if (!isAuthRoute && !loading && Date.now() - lastChecked > 10 * 60 * 1000) {
          checkSession()
        }
      },
      5 * 60 * 1000,
    ) // Verificar cada 5 minutos

    return () => clearInterval(intervalId)
  }, [user, loading, pathname, lastChecked, isAuthRoute])

  // Escuchar eventos de visibilidad para verificar la sesión cuando el usuario regresa a la página
  useEffect(() => {
    // No verificar en rutas de autenticación
    if (isAuthRoute) {
      return
    }

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        !isAuthRoute &&
        !loading &&
        !isRedirecting.current &&
        Date.now() - lastChecked > 10 * 60 * 1000
      ) {
        refreshUser()
        setLastChecked(Date.now())
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshUser, lastChecked, loading, isAuthRoute])

  // Este componente no renderiza nada
  return null
}
