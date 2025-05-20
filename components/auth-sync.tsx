"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function AuthSync() {
  const pathname = usePathname()

  useEffect(() => {
    // Función para sincronizar los datos de autenticación
    const syncAuthData = async () => {
      try {
        // Verificar si hay un usuario en localStorage
        const userJson = localStorage.getItem("wikimillionaire_user")
        if (!userJson) return

        // Intentar sincronizar con el servidor
        await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-LocalStorage-User": userJson, // Enviar también como header
          },
          body: JSON.stringify({ user: JSON.parse(userJson) }),
          credentials: "include",
        })

        // console.log("Datos de autenticación sincronizados con el servidor")
      } catch (error) {
        console.error("Error al sincronizar datos de autenticación:", error)
      }
    }

    // Sincronizar al cargar la página y cuando cambie la ruta
    syncAuthData()
  }, [pathname])

  return null // Este componente no renderiza nada
}
