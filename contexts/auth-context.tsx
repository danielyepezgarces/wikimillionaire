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

  // Constantes para configuración
  const SESSION_EXPIRY = 24 * 60 * 60 * 1000 // 24 horas de duración de sesión

  // Función para verificar si hay un usuario en localStorage
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
          localStorage.removeItem("wikimillionaire_user")
          localStorage.removeItem("wikimillionaire_last_update")
          return null
        }
      }

      // Validar que el objeto de usuario tenga la estructura correcta
      const parsedUser = JSON.parse(userJson)
      if (!parsedUser || typeof parsedUser !== "object") {
        console.error("Formato de usuario inválido en localStorage")
        return null
      }

      // Crear un objeto de usuario con valores predeterminados para todas las propiedades
      const validatedUser: User = {
        id: typeof parsedUser.id === "string" ? parsedUser.id : `user_${Date.now()}`,
        username: typeof parsedUser.username === "string" ? parsedUser.username : "Usuario",
        wikimedia_id: typeof parsedUser.wikimedia_id === "string" ? parsedUser.wikimedia_id : "",
        email: parsedUser.email || null,
        avatar_url: parsedUser.avatar_url || null,
        created_at: typeof parsedUser.created_at === "string" ? parsedUser.created_at : new Date().toISOString(),
        last_login: typeof parsedUser.last_login === "string" ? parsedUser.last_login : new Date().toISOString(),
      }

      return validatedUser
    } catch (error) {
      console.error("Error al leer usuario de localStorage:", error)
      // En caso de error, limpiar localStorage para evitar problemas futuros
      localStorage.removeItem("wikimillionaire_user")
      localStorage.removeItem("wikimillionaire_last_update")
      return null
    }
  }

  // Función para guardar usuario en localStorage
  const saveUserToLocalStorage = (user: User | null) => {
    if (typeof window === "undefined") return

    try {
      if (user) {
        localStorage.setItem("wikimillionaire_user", JSON.stringify(user))
        localStorage.setItem("wikimillionaire_last_update", Date.now().toString())
      } else {
        localStorage.removeItem("wikimillionaire_user")
        localStorage.removeItem("wikimillionaire_last_update")
      }
    } catch (error) {
      console.error("Error al guardar usuario en localStorage:", error)
    }
  }

  // Función para login manual (para depuración)
  const manualLogin = (userData: any) => {
    try {
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
    } catch (error) {
      console.error("Error en login manual:", error)
      setError("Error en login manual")
    }
  }

  // Modificar la función checkSession para usar SOLO localStorage
  const checkSession = async () => {
    try {
      setLoading(true)

      // Obtener usuario de localStorage
      const localUser = getUserFromLocalStorage()

      if (localUser) {
        setUser(localUser)
        setDebugInfo((prev: any) => ({ ...prev, userData: localUser, source: "localStorage" }))
      } else {
        setUser(null)
        setDebugInfo((prev: any) => ({ ...prev, userData: null, source: "none" }))
      }
    } catch (err) {
      console.error("Error al verificar la sesión:", err)
      setError("Error al verificar la sesión")
      // En caso de error, asegurarse de que el usuario sea null
      setUser(null)
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  // Inicializar y verificar la sesión al cargar
  useEffect(() => {
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
      const clientId = "cd1155b5217d823cec353e1e7b5576a1" // Reemplazar con tu client ID real
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
      })

      if (!userInfoResponse.ok) {
        const errorData = await userInfoResponse.json()
        throw new Error(errorData.error || "Error al obtener información del usuario")
      }

      const userData = await userInfoResponse.json()
      setDebugInfo((prev: any) => ({ ...prev, userData }))
      setUser(userData as User)
      saveUserToLocalStorage(userData) // Guardar en localStorage

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

      // Limpiar localStorage
      localStorage.removeItem("wikimillionaire_user")
      localStorage.removeItem("wikimillionaire_last_update")
      localStorage.removeItem("wikimillionaire_oauth_state")
      localStorage.removeItem("wikimillionaire_oauth_code_verifier")
      localStorage.removeItem("wikimillionaire_oauth_timestamp")

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
