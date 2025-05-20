"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export function AuthDebug() {
  const { user, loading, error, refreshUser, debugInfo } = useAuth()
  const [showDebug, setShowDebug] = useState(false)
  const [showCookies, setShowCookies] = useState(false)
  const [showLocalStorage, setShowLocalStorage] = useState(false)
  const [loadingTime, setLoadingTime] = useState(0)
  const [wikimediaId, setWikimediaId] = useState("")
  const [username, setUsername] = useState("")

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

  const handleShowLocalStorage = () => {
    setShowLocalStorage(!showLocalStorage)
  }

  const handleCreateManualUser = async () => {
    try {
      if (!wikimediaId) {
        alert("Por favor, ingresa un Wikimedia ID")
        return
      }

      // Crear un usuario manualmente en localStorage
      const user = {
        id: `user_${Date.now()}`,
        username: username || "Usuario",
        wikimedia_id: wikimediaId,
        email: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      }

      localStorage.setItem("wikimillionaire_user", JSON.stringify(user))
      alert("Usuario creado manualmente en localStorage. Recargando página...")
      window.location.reload()
    } catch (error) {
      console.error("Error al crear usuario manualmente:", error)
      alert(`Error al crear usuario: ${error}`)
    }
  }

  const handleClearAll = () => {
    // Limpiar localStorage
    localStorage.removeItem("wikimillionaire_user")
    localStorage.removeItem("wikimillionaire_oauth_state")
    localStorage.removeItem("wikimillionaire_oauth_code_verifier")
    localStorage.removeItem("wikimillionaire_oauth_timestamp")

    // Limpiar todas las cookies relacionadas
    document.cookie = "wikimillionaire_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "wikimedia_auth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    alert("Se han limpiado todas las cookies y localStorage. Recargando página...")
    window.location.reload()
  }

  const getLocalStorageItems = () => {
    if (typeof window === "undefined") return {}

    const items: Record<string, any> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          const value = localStorage.getItem(key)
          items[key] = value
        } catch (e) {
          items[key] = "Error al leer valor"
        }
      }
    }
    return items
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
        <Button variant="outline" size="sm" onClick={handleShowLocalStorage}>
          {showLocalStorage ? "Ocultar LocalStorage" : "Mostrar LocalStorage"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleClearAll}>
          Limpiar Todo
        </Button>
      </div>

      {showCookies && (
        <div className="mb-2">
          <strong>Cookies:</strong>
          <pre className="bg-gray-800 p-2 rounded mt-1 overflow-auto">{document.cookie || "No hay cookies"}</pre>
        </div>
      )}

      {showLocalStorage && (
        <div className="mb-2">
          <strong>LocalStorage:</strong>
          <pre className="bg-gray-800 p-2 rounded mt-1 overflow-auto">
            {JSON.stringify(getLocalStorageItems(), null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-2">
        <strong>Debug Info:</strong>
        <pre className="bg-gray-800 p-2 rounded mt-1 overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

      <div className="mb-2">
        <strong>Crear Usuario Manual:</strong>
        <div className="mt-1 space-y-2">
          <input
            type="text"
            placeholder="Wikimedia ID"
            value={wikimediaId}
            onChange={(e) => setWikimediaId(e.target.value)}
            className="w-full p-1 bg-gray-800 border border-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Nombre de usuario (opcional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-1 bg-gray-800 border border-gray-700 rounded"
          />
          <Button variant="outline" size="sm" onClick={handleCreateManualUser}>
            Crear Usuario
          </Button>
        </div>
      </div>
    </div>
  )
}
