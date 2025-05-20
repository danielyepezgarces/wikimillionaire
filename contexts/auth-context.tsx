"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Tipo para el usuario
export type User = {
  id: string
  username: string
  wikimedia_id: string
  email: string | null
  avatar_url: string | null
  created_at: string
  last_login: string
}

// Tipo para el contexto de autenticación
type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  login: (code: string, codeVerifier: string) => Promise<void>
  logout: () => Promise<void>
  getAuthUrl: () => Promise<string>
  refreshUser: () => Promise<void>
  debugInfo: any
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

// Proveedor del contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Función para verificar la sesión
  const checkSession = async () => {
    try {
      setLoading(true)
      console.log("Verificando sesión...")

      // Obtener el usuario actual
      const response = await fetch("/api/auth/me")

      if (!response.ok) {
        if (response.status === 401) {
          // No autenticado
          setUser(null)
          return
        }

        throw new Error("Error al obtener el usuario actual")
      }

      const userData = await response.json()
      setUser(userData)
      setDebugInfo((prev: any) => ({ ...prev, userData }))
    } catch (err) {
      console.error("Error al verificar la sesión:", err)
      setError("Error al verificar la sesión")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Inicializar y verificar la sesión al cargar
  useEffect(() => {
    console.log("AuthProvider: Inicializando...")
    checkSession()
  }, [])

  // Función para refrescar los datos del usuario
  const refreshUser = async () => {
    await checkSession()
  }

  // Función para obtener la URL de autenticación
  const getAuthUrl = async (): Promise<string> => {
    try {
      // Esta función ahora simplemente devuelve la URL del endpoint del servidor
      return "/api/auth/wikimedia"
    } catch (error) {
      console.error("Error al obtener la URL de autenticación:", error)
      throw error
    }
  }

  // Función para iniciar sesión
  const login = async (code: string, codeVerifier: string) => {
    try {
      setLoading(true)
      setError(null)

      // 1. Intercambiar el código por un token
      const tokenResponse = await fetch("/api/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          codeVerifier,
        }),
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        throw new Error(errorData.error || "Error al obtener el token")
      }

      const tokenData = await tokenResponse.json()
      console.log("Token obtenido correctamente")
      setDebugInfo((prev: any) => ({ ...prev, tokenData }))

      // 2. Obtener información del usuario
      const userInfoResponse = await fetch("/api/auth/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: tokenData.access_token,
        }),
      })

      if (!userInfoResponse.ok) {
        const errorData = await userInfoResponse.json()
        throw new Error(errorData.error || "Error al obtener información del usuario")
      }

      const userData = await userInfoResponse.json()
      console.log("Datos de usuario obtenidos después de login:", userData)
      setDebugInfo((prev: any) => ({ ...prev, userData }))
      setUser(userData as User)

      // Refrescar la página para asegurar que todo se actualice correctamente
      window.location.href = "/"
    } catch (err) {
      console.error("Error al iniciar sesión:", err)
      setDebugInfo((prev: any) => ({ ...prev, loginError: err }))
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión
  const logout = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Error al cerrar sesión")
      }

      setUser(null)

      // Recargar la página para asegurar que todo se actualice correctamente
      window.location.href = "/"
    } catch (err) {
      console.error("Error al cerrar sesión:", err)
      setDebugInfo((prev: any) => ({ ...prev, logoutError: err }))
      setError("Error al cerrar sesión")
    } finally {
      setLoading(false)
    }
  }

  // Valor del contexto
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    getAuthUrl,
    refreshUser,
    debugInfo,
  }

  console.log("AuthProvider: Estado actual:", { user, loading, error })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
