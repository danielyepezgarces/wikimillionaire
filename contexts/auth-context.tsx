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
  manualLogin: (userData: any) => void
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
  const [lastCheck, setLastCheck] = useState(0)

  // Constantes para configuración
  const SESSION_CHECK_INTERVAL = 60 * 60 * 12000 // 1 hora entre verificaciones
  const SESSION_EXPIRY = 168 * 60 * 60 * 1000 // 24 horas de duración de sesión

  // Función para verificar si hay un usuario en localStorage (fallback)
  const getUserFromLocalStorage = (): User | null => {
    if (typeof window === "undefined") return null

    try {
      const userJson = localStorage.getItem("wikimillionaire_user")
      if (!userJson) return null

      // Verificar si hay un timestamp de última actualización
      const lastUpdateStr = localStorage.getItem("wikimillionaire_last_update")
      if (lastUpdateStr) {
        const lastUpdate = Number.parseInt(lastUpdateStr, 10)
        const now = Date.now()

        // Si han pasado más de 24 horas desde la última actualización, considerar la sesión expirada
        if (now - lastUpdate > SESSION_EXPIRY) {
          console.log("Sesión expirada por tiempo (24 horas)")
          localStorage.removeItem("wikimillionaire_user")
          localStorage.removeItem("wikimillionaire_last_update")
          return null
        }
      }

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
      localStorage.setItem("wikimillionaire_last_update", Date.now().toString())
    } else {
      localStorage.removeItem("wikimillionaire_user")
      localStorage.removeItem("wikimillionaire_last_update")
    }
  }

  // Función para login manual (para depuración)
  const manualLogin = (userData: any) => {
    const user = {
      id: userData.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      username: userData.username || "usuario_test",
      wikimedia_id: userData.wikimedia_id || "test_id",
      email: userData.email || null,
      avatar_url: userData.avatar_url || null,
      created_at: userData.created_at || new Date().toISOString(),
      last_login: new Date().toISOString(),
    }

    setUser(user)
    saveUserToLocalStorage(user)
    setDebugInfo((prev: any) => ({ ...prev, manualUser: user }))

    // Sincronizar con el servidor (una sola vez)
    syncUserWithServer(user)
  }

  // Función para sincronizar usuario con el servidor
  const syncUserWithServer = async (userData: User) => {
    try {
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: userData }),
        credentials: "include",
      })

      if (response.ok) {
      } else {
        console.error("Error al sincronizar usuario con el servidor:", response.status)
      }
    } catch (error) {
      console.error("Error al sincronizar usuario con el servidor:", error)
    }
  }

  // Modificar la función checkSession para evitar llamadas frecuentes
  const checkSession = async (force = false) => {
    // Evitar verificaciones frecuentes (máximo una vez cada hora)
    const now = Date.now()
    if (!force && now - lastCheck < SESSION_CHECK_INTERVAL && isInitialized) {
      return
    }

    try {
      setLoading(true)
      setLastCheck(now)
      console.log("Verificando sesión...")

      // Obtener usuario de localStorage primero
      const localUser = getUserFromLocalStorage()

      // Si hay un usuario en localStorage y no estamos forzando la verificación, usarlo directamente
      if (localUser && !force) {
        console.log("Usuario obtenido de localStorage:", localUser)
        setUser(localUser)
        setDebugInfo((prev: any) => ({ ...prev, userData: localUser, source: "localStorage" }))
        setLoading(false)
        setIsInitialized(true)
        return
      }

      // Solo si estamos forzando la verificación o no hay usuario en localStorage, llamar a la API
      try {
        // Incluir los datos de localStorage en el header si existen
        const headers: Record<string, string> = {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        }

        if (localUser) {
          headers["X-LocalStorage-User"] = JSON.stringify(localUser)
        }

        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers,
          credentials: "include", // Importante para incluir cookies
        })

        console.log("Respuesta de /api/auth/me:", response.status)

        if (response.ok) {
          const userData = await response.json()
          console.log("Usuario obtenido de la API:", userData)
          setUser(userData)
          saveUserToLocalStorage(userData) // Guardar en localStorage como fallback
          setDebugInfo((prev: any) => ({ ...prev, userData, source: "api" }))
          return
        } else if (response.status === 401) {
          console.log("No autenticado según la API")

          // Si la API dice que no estamos autenticados pero tenemos un usuario en localStorage,
          // intentar sincronizar una vez más
          if (localUser) {
            await syncUserWithServer(localUser)
          } else {
            // Si no hay usuario en localStorage ni en la API, el usuario no está autenticado
            setUser(null)
          }
        } else {
          console.error("Error al verificar sesión:", response.status)
        }
      } catch (apiError) {
        console.error("Error al llamar a la API:", apiError)

        // En caso de error, usar el usuario de localStorage si existe
        if (localUser) {
          setUser(localUser)
          setDebugInfo((prev: any) => ({ ...prev, userData: localUser, source: "localStorage (fallback)" }))
          return
        }
      }

      // Si llegamos aquí y no hemos retornado, no hay usuario autenticado
      if (!user) {
        console.log("Usuario no autenticado")
        setUser(null)
        setDebugInfo((prev: any) => ({ ...prev, userData: null, source: "none" }))
      }
    } catch (err) {
      console.error("Error al verificar la sesión:", err)
      setError("Error al verificar la sesión")

      // En caso de error general, mantener el usuario actual
      // No cambiar a null para evitar cerrar sesión por errores temporales
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  // Inicializar y verificar la sesión al cargar
  useEffect(() => {
    checkSession()

    // No configurar ningún intervalo para verificaciones periódicas
    // Solo verificaremos la sesión una vez al cargar la página
  }, [])

  // Función para refrescar los datos del usuario
  const refreshUser = async () => {
    await checkSession(true) // Forzar verificación
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
      const clientId = "your-client-id" // Reemplazar con tu client ID real
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
        credentials: "include", // Importante para incluir cookies
      })

      if (!userInfoResponse.ok) {
        const errorData = await userInfoResponse.json()
        throw new Error(errorData.error || "Error al obtener información del usuario")
      }

      const userData = await userInfoResponse.json()
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
        credentials: "include", // Importante para incluir cookies
      })

      // Limpiar localStorage
      localStorage.removeItem("wikimillionaire_user")
      localStorage.removeItem("wikimillionaire_last_update")
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
    manualLogin,
  }

  console.log("AuthProvider: Estado actual:", { user, loading, error, isInitialized })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
