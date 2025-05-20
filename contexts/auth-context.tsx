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
  const [isInitialized, setIsInitialized] = useState(false)

  // Función para verificar si hay un usuario en localStorage (fallback)
  const getUserFromLocalStorage = (): User | null => {
    if (typeof window === "undefined") return null

    try {
      const userJson = localStorage.getItem("wikimillionaire_user")
      if (!userJson) return null

      return JSON.parse(userJson)
    } catch (error) {
      console.error("Error al leer usuario de localStorage:", error)
      return null
    }
  }

  // Función para guardar usuario en localStorage (fallback)
  const saveUserToLocalStorage = (user: User | null) => {
    if (typeof window === "undefined") return

    if (user) {
      localStorage.setItem("wikimillionaire_user", JSON.stringify(user))
    } else {
      localStorage.removeItem("wikimillionaire_user")
    }
  }

  // Modificar la función checkSession para incluir un timeout y mejor manejo de errores
  const checkSession = async () => {
    try {
      setLoading(true)
      console.log("Verificando sesión...")

      // Primero intentar obtener el usuario de la cookie a través del API
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (response.ok) {
          const userData = await response.json()
          console.log("Usuario obtenido de la API:", userData)
          setUser(userData)
          saveUserToLocalStorage(userData) // Guardar en localStorage como fallback
          setDebugInfo((prev: any) => ({ ...prev, userData, source: "api" }))
          return
        } else if (response.status !== 401) {
          console.error("Error al verificar sesión:", response.status)
        }
      } catch (apiError) {
        console.error("Error al llamar a la API:", apiError)
      }

      // Si no hay usuario en la API, intentar obtenerlo de localStorage
      const localUser = getUserFromLocalStorage()
      if (localUser) {
        console.log("Usuario obtenido de localStorage:", localUser)
        setUser(localUser)
        setDebugInfo((prev: any) => ({ ...prev, userData: localUser, source: "localStorage" }))
        return
      }

      // Si no hay usuario ni en la API ni en localStorage, el usuario no está autenticado
      console.log("Usuario no autenticado")
      setUser(null)
      setDebugInfo((prev: any) => ({ ...prev, userData: null, source: "none" }))
    } catch (err) {
      console.error("Error al verificar la sesión:", err)
      setError("Error al verificar la sesión")
      setUser(null)
    } finally {
      setLoading(false)
      setIsInitialized(true)
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
      // Generar un nuevo estado y codeVerifier
      const state = crypto.randomUUID()
      const codeVerifier = crypto.randomUUID() + crypto.randomUUID()

      // Guardar en localStorage para recuperarlo después
      localStorage.setItem("wikimillionaire_oauth_state", state)
      localStorage.setItem("wikimillionaire_oauth_code_verifier", codeVerifier)
      localStorage.setItem("wikimillionaire_oauth_timestamp", Date.now().toString())

      // Calcular code challenge (SHA-256)
      const encoder = new TextEncoder()
      const data = encoder.encode(codeVerifier)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashBase64 = btoa(String.fromCharCode(...hashArray))
      const codeChallenge = hashBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

      // Construir la URL de autorización
      const clientId = process.env.WIKIMEDIA_CLIENT_ID
      const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback")

      const authUrl =
        `https://www.wikidata.org/w/rest.php/oauth2/authorize?` +
        `client_id=${clientId}` +
        `&response_type=code` +
        `&redirect_uri=${redirectUri}` +
        `&state=${state}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256`

      return authUrl
    } catch (error) {
      console.error("Error al generar URL de autenticación:", error)
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
      saveUserToLocalStorage(userData) // Guardar en localStorage como fallback

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

      // Llamar al endpoint de logout
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      // Limpiar localStorage
      localStorage.removeItem("wikimillionaire_user")
      localStorage.removeItem("wikimillionaire_oauth_state")
      localStorage.removeItem("wikimillionaire_oauth_code_verifier")
      localStorage.removeItem("wikimillionaire_oauth_timestamp")

      // Limpiar todas las cookies relacionadas
      document.cookie = "wikimillionaire_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "wikimedia_auth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

      // Actualizar el estado
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
    loading: loading && !isInitialized, // Solo mostrar loading si no está inicializado
    error,
    login,
    logout,
    getAuthUrl,
    refreshUser,
    debugInfo,
  }

  console.log("AuthProvider: Estado actual:", { user, loading, error, isInitialized })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
