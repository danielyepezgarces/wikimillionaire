"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"

export function SessionHandler() {
  const { user, loading, refreshUser } = useAuth()
  const pathname = usePathname()
  const [lastChecked, setLastChecked] = useState<number>(Date.now())

  // Ignorar rutas de autenticación para evitar bucles
  const isAuthRoute = pathname.includes("/auth/callback") || pathname.includes("/api/auth")

  useEffect(() => {
    // No verificar en rutas de autenticación
    if (isAuthRoute) {
      return
    }

    // Verificar la sesión cuando el componente se monta
    const checkSession = async () => {
      try {
        console.log("Verificando sesión...")
        const supabase = createSupabaseClient()
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error al verificar la sesión:", error)
          return
        }

        // Si no hay sesión y el usuario estaba autenticado, limpiar el estado
        if (!data.session && !loading && user) {
          console.log("Sesión expirada, limpiando estado")

          // Limpiar cookies de autenticación
          document.cookie = "wikimedia_auth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

          // Recargar la página para actualizar el estado
          window.location.reload()
        }

        setLastChecked(Date.now())
      } catch (err) {
        console.error("Error al verificar la sesión:", err)
      }
    }

    // Solo verificar después de que la carga inicial haya terminado
    if (!loading) {
      checkSession()
    }

    // Verificar la sesión periódicamente, pero con menos frecuencia
    const intervalId = setInterval(() => {
      // Solo verificar si ha pasado al menos 5 minutos desde la última verificación
      if (!isAuthRoute && !loading && Date.now() - lastChecked > 5 * 60 * 1000) {
        checkSession()
      }
    }, 60 * 1000) // Verificar cada minuto

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
        Date.now() - lastChecked > 5 * 60 * 1000
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
