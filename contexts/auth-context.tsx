"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Configuración de OAuth
const OAUTH_CONFIG = {
  clientId: "cd1155b5217d823cec353e1e7b5576a1",
  authUrl: "https://www.wikidata.org/w/rest.php/oauth2/authorize",
  tokenUrl: "https://www.wikidata.org/w/rest.php/oauth2/access_token",
  userAgent: "WikiMillionaire/1.0 (https://wikimillionaire.com; contacto@wikimillionaire.com)",
  sessionExpiry: 24 * 60 * 60 * 1000, // 24 horas
}

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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Generar code_verifier seguro (RFC 7636)
  const generateCodeVerifier = (): string => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 43) // Longitud mínima recomendada
  }

  // Calcular code_challenge correctamente
  const calculateCodeChallenge = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }

  // Función mejorada para obtener usuario de localStorage
  const getUserFromLocalStorage = (): User | null => {
    if (typeof window === "undefined") return null

    try {
      const userJson = localStorage.getItem("wikimillionaire_user")
      if (!userJson) return null

      const lastUpdate = Number(localStorage.getItem("wikimillionaire_last_update") || 0)
      if (Date.now() - lastUpdate > OAUTH_CONFIG.sessionExpiry) {
        localStorage.removeItem("wikimillionaire_user")
        localStorage.removeItem("wikimillionaire_last_update")
        return null
      }

      const parsedUser = JSON.parse(userJson)
      
      if (!parsedUser?.id || !parsedUser?.username || !parsedUser?.wikimedia_id) {
        throw new Error("Datos de usuario incompletos")
      }

      return {
        id: parsedUser.id,
        username: parsedUser.username,
        wikimedia_id: parsedUser.wikimedia_id,
        email: parsedUser.email || null,
        avatar_url: parsedUser.avatar_url || null,
        created_at: parsedUser.created_at || new Date().toISOString(),
        last_login: parsedUser.last_login || new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error al leer usuario de localStorage:", error)
      localStorage.removeItem("wikimillionaire_user")
      localStorage.removeItem("wikimillionaire_last_update")
      return null
    }
  }

  const saveUserToLocalStorage = (user: User | null) => {
    if (typeof window === "undefined") return

    try {
      if (user) {
        localStorage.setItem("wikimillionaire_user", JSON.stringify(user))
        localStorage.setItem("wikimillionaire_last_update", Date.now().toString())
      } else {
        ["wikimillionaire_user", "wikimillionaire_last_update", 
         "wikimillionaire_oauth_state", "wikimillionaire_oauth_code_verifier",
         "wikimillionaire_oauth_timestamp"].forEach(key => {
          localStorage.removeItem(key)
        })
      }
    } catch (error) {
      console.error("Error al guardar usuario en localStorage:", error)
    }
  }

  const getAuthUrl = async (): Promise<string> => {
    try {
      // 1. Generar parámetros PKCE
      const state = crypto.randomUUID()
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await calculateCodeChallenge(codeVerifier)

      // 2. Configurar URL base
      const authUrl = new URL(OAUTH_CONFIG.authUrl)
      
      // 3. Añadir parámetros requeridos
      authUrl.searchParams.append('client_id', OAUTH_CONFIG.clientId)
      authUrl.searchParams.append('response_type', 'code')
      authUrl.searchParams.append('redirect_uri', `${window.location.origin}/auth/callback`)
      authUrl.searchParams.append('state', state)
      authUrl.searchParams.append('code_challenge', codeChallenge)
      authUrl.searchParams.append('code_challenge_method', 'S256')
      
      // 4. Guardar valores para el callback
      localStorage.setItem("wikimillionaire_oauth_state", state)
      localStorage.setItem("wikimillionaire_oauth_code_verifier", codeVerifier)
      localStorage.setItem("wikimillionaire_oauth_timestamp", Date.now().toString())

      return authUrl.toString()
    } catch (error) {
      console.error("Error en getAuthUrl:", error)
      throw new Error("Error al generar URL de autenticación")
    }
  }

  const login = async (code: string, codeVerifier: string) => {
    try {
      setLoading(true)
      setError(null)

      // 1. Intercambiar el código por un token
      const tokenResponse = await fetch("/api/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": OAUTH_CONFIG.userAgent
        },
        body: JSON.stringify({
          code,
          codeVerifier,
          client_id: OAUTH_CONFIG.clientId,
          redirect_uri: `${window.location.origin}/auth/callback`
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
          "User-Agent": OAUTH_CONFIG.userAgent
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
      saveUserToLocalStorage(userData)

      window.location.href = "/"
    } catch (err) {
      console.error("Error al iniciar sesión:", err)
      setDebugInfo((prev: any) => ({ ...prev, loginError: err }))
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      saveUserToLocalStorage(null)
      setUser(null)
      window.location.href = "/"
    } catch (err) {
      console.error("Error al cerrar sesión:", err)
      setDebugInfo((prev: any) => ({ ...prev, logoutError: err }))
      setError("Error al cerrar sesión")
    } finally {
      setLoading(false)
    }
  }

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

  const checkSession = async () => {
    try {
      const localUser = getUserFromLocalStorage()
      if (localUser) {
        setUser(localUser)
        setDebugInfo((prev: any) => ({ ...prev, userData: localUser, source: "localStorage" }))
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error("Error al verificar la sesión:", err)
      setError("Error al verificar la sesión")
      setUser(null)
    }
  }

  const refreshUser = async () => {
    await checkSession()
  }

  useEffect(() => {
    checkSession()
  }, [])

  const value = {
    user,
    loading,
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