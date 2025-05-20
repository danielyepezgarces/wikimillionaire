"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export function AuthDebug() {
  const { user, loading, error, refreshUser, debugInfo } = useAuth()
  const [showDebug, setShowDebug] = useState(false)
  const [showCookies, setShowCookies] = useState(false)
  const [loadingTime, setLoadingTime] = useState(0)

  // Contador para el tiempo de carga
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (loading) {
      interval = setInterval(() => {
        setLoadingTime((prev) => prev + 1)
      }, 1000)
    } else {
      setLoadingTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loading])

  const handleRefreshUser = async () => {
    setLoadingTime(0)
    await refreshUser()
  }

  const handleShowCookies = () => {
    setShowCookies(!showCookies)
  }

  const handleFixAuthId = async () => {
    try {
      const response = await fetch("/api/auth/fix-auth-id", {
        method: "POST",
      })
      const data = await response.json()
      console.log("Respuesta de fix-auth-id:", data)
      await refreshUser()
    } catch (error) {
      console.error("Error al arreglar auth_id:", error)
    }
  }

  const handleForceLogin = async () => {
    try {
      const response = await fetch("/api/auth/force-login", {
        method: "POST",
      })
      const data = await response.json()
      console.log("Respuesta de force-login:", data)
      window.location.reload()
    } catch (error) {
      console.error("Error al forzar login:", error)
    }
  }

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setShowDebug(true)}>
          Debug {loading && `(Cargando: ${loadingTime}s)`}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto bg-gray-900 border border-gray-700 rounded-lg p-4 text-white text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Auth Debug</h3>
        <Button variant="outline" size="sm" onClick={() => setShowDebug(false)}>
          Cerrar
        </Button>
      </div>

      <div className="mb-2">
        <strong>Estado:</strong> {loading ? `Cargando (${loadingTime}s)` : user ? "Autenticado" : "No autenticado"}
      </div>

      {error && (
        <div className="mb-2 text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {user && (
        <div className="mb-2">
          <strong>Usuario:</strong>
          <pre className="bg-gray-800 p-2 rounded mt-1 overflow-auto">{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-2">
        <Button variant="outline" size="sm" onClick={handleRefreshUser}>
          Refrescar Usuario
        </Button>
        <Button variant="outline" size="sm" onClick={handleShowCookies}>
          {showCookies ? "Ocultar Cookies" : "Mostrar Cookies"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleFixAuthId}>
          Arreglar auth_id
        </Button>
        <Button variant="outline" size="sm" onClick={handleForceLogin}>
          Forzar Login
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            localStorage.clear()
            sessionStorage.clear()
            document.cookie.split(";").forEach((c) => {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
            })
            window.location.reload()
          }}
        >
          Limpiar Todo
        </Button>
      </div>

      {showCookies && (
        <div className="mb-2">
          <strong>Cookies:</strong>
          <pre className="bg-gray-800 p-2 rounded mt-1 overflow-auto">{document.cookie || "No hay cookies"}</pre>
        </div>
      )}

      <div className="mb-2">
        <strong>Debug Info:</strong>
        <pre className="bg-gray-800 p-2 rounded mt-1 overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    </div>
  )
}
