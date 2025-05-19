"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"

export function SessionHandler() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [lastChecked, setLastChecked] = useState<number>(Date.now())

  useEffect(() => {
    // Verificar la sesión cuando el componente se monta
    const checkSession = async () => {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error al verificar la sesión:", error)
        return
      }

      // Si no hay sesión y el usuario estaba autenticado, redirigir al login
      if (!data.session && !loading && user) {
        console.log("Sesión expirada, redirigiendo al login")
        window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(pathname)}`
      }

      setLastChecked(Date.now())
    }

    checkSession()

    // Verificar la sesión periódicamente
    const intervalId = setInterval(() => {
      // Solo verificar si ha pasado al menos 5 minutos desde la última verificación
      if (Date.now() - lastChecked > 5 * 60 * 1000) {
        checkSession()
      }
    }, 60 * 1000) // Verificar cada minuto si es necesario

    return () => clearInterval(intervalId)
  }, [user, loading, pathname, lastChecked])

  // Escuchar eventos de visibilidad para verificar la sesión cuando el usuario regresa a la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && Date.now() - lastChecked > 5 * 60 * 1000) {
        refreshUser()
        setLastChecked(Date.now())
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshUser, lastChecked])

  // Este componente no renderiza nada
  return null
}
