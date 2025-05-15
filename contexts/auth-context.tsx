"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { getGravatarUrl } from "@/lib/gravatar"

// Tipo para el usuario
export type User = {
  id: string
  username: string
  wikimedia_id: string | null
  avatar_url: string | null
  email: string | null
}

// Tipo para el contexto de autenticación
type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  login: (code: string, codeVerifier: string) => Promise<void>
  logout: () => Promise<void>
  getAuthUrl: () => Promise<string>
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

  // Inicializar y verificar la sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true)
        const supabase = createSupabaseClient()

        // Verificar si hay una sesión activa
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData?.session) {
          // Obtener los datos del usuario
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", sessionData.session.user.id)
            .single()

          if (userError) throw userError

          if (userData) {
            // Si el usuario tiene email pero no avatar_url, usar Gravatar
            if (userData.email && !userData.avatar_url) {
              userData.avatar_url = getGravatarUrl(userData.email)
            }

            setUser(userData as User)
          }
        }
      } catch (err) {
        console.error("Error al verificar la sesión:", err)
        setError("Error al verificar la sesión")
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  // Función para obtener la URL de autenticación
  const getAuthUrl = async (): Promise<string> => {
    try {
      // Esta función ahora simplemente devuelve la URL del endpoint del servidor
      return "/api/auth/login"
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
      setUser(userData as User)
    } catch (err) {
      console.error("Error al iniciar sesión:", err)
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión
  const logout = async () => {
    try {
      setLoading(true)
      const supabase = createSupabaseClient()

      await supabase.auth.signOut()
      setUser(null)
    } catch (err) {
      console.error("Error al cerrar sesión:", err)
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
