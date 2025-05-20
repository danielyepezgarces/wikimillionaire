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

// Hook personalizado
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})

  const SESSION_EXPIRY = 24 * 60 * 60 * 1000

  const getUserFromLocalStorage = (): User | null => {
    if (typeof window === "undefined") return null

    try {
      const userJson = localStorage.getItem("wikimillionaire_user")
      if (!userJson) return null

      const lastUpdateStr = localStorage.getItem("wikimillionaire_last_update")
      if (lastUpdateStr) {
        const lastUpdate = Number.parseInt(lastUpdateStr, 10)
        const now = Date.now()
        if (now - lastUpdate > SESSION_EXPIRY) {
          console.log("Sesión expirada por tiempo (24 horas)")
          localStorage.removeItem("wikimillionaire_user")
          localStorage.removeItem("wikimillionaire_last_update")
          return null
        }
      }

      const parsedUser = JSON.parse(userJson)
      if (!parsedUser || typeof parsedUser !== "object") {
        console.error("Formato de usuario inválido en localStorage")
        return null
      }

      const validatedUser: User = {
        id: typeof parsedUser.id === "string" ? parsedUser.id : "", // ← no se genera un id genérico
        username: typeof parsedUser.username === "string" ? parsedUser.username : "Usuario",
        wikimedia_id: typeof parsedUser.wikimedia_id === "string" ? parsedUser.wikimedia_id : "",
        email: parsedUser.email || null,
        avatar_url: parsedUser.avatar_url || null,
        created_at: typeof parsedUser.created_at === "string" ? parsedUser.created_at : new Date().toISOString(),
        last_login: typeof parsedUser.last_login === "string" ? parsedUser.last_login : new Date().toISOString(),
      }

      if (!validatedUser.id) {
        console.error("ID inválido o faltante en localStorage")
        return null
      }

      return validatedUser
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
        localStorage.removeItem("wikimillionaire_user")
        localStorage.removeItem("wikimillionaire_last_update")
      }
    } catch (error) {
      console.error("Error al guardar usuario en localStorage:", error)
    }
  }

  const manualLogin = (userData: any) => {
    try {
      if (!userData.id) throw new Error("El ID del usuario (Supabase UUID) es obligatorio")

      const user: User = {
        id: userData.id,
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
        console.log("Usuario obtenido de localStorage:", localUser)
        setUser(localUser)
        setDebugInfo((prev: any) => ({ ...prev, userData: localUser, source: "localStorage" }))
      } else {
        console.log("No hay usuario en localStorage")
        setUser(null)
        setDebugInfo((prev: any) => ({ ...prev, userData: null, source: "none" }))
      }
    } catch (err) {
      console.error("Error al verificar la sesión:", err)
      setError("Error al verificar la sesión")
      setUser(null)
    }
  }

  useEffect(() => {
    console.log("AuthProvider: Inicializando...")
    checkSession()
  }, [])

  const refreshUser = async () => {
    await checkSession()
  }

  const getAuthUrl = async (): Promise<string> => {
    try {
      const state = crypto.randomUUID()
      const codeVerifier = crypto.randomUUID() + crypto.randomUUID()

      localStorage.setItem("wikimillionaire_oauth_state", state)
      localStorage.setItem("wikimillionaire_oauth_code_verifier", codeVerifier)
      localStorage.setItem("wikimillionaire_oauth_timestamp", Date.now().toString())

      const encoder = new TextEncoder()
      const data = encoder.encode(codeVerifier)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashBase64 = btoa(String.fromCharCode(...hashArray))
      const codeChallenge = hashBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

      const clientId = "cd1155b5217d823cec353e1e7b5576a1"
      const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback")

      return `https://www.wikidata.org/w/rest.php/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`
    } catch (error) {
      console.error("Error al generar URL de autenticación:", error)
      throw error
    }
  }

  const login = async (code: string, codeVerifier: string) => {
    try {
      setLoading(true)
      setError(null)

      const tokenResponse = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, codeVerifier }),
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        throw new Error(errorData.error || "Error al obtener el token")
      }

      const tokenData = await tokenResponse.json()
      console.log("Token obtenido correctamente")
      setDebugInfo((prev: any) => ({ ...prev, tokenData }))

      const userInfoResponse = await fetch("/api/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: tokenData.access_token }),
      })

      if (!userInfoResponse.ok) {
        const errorData = await userInfoResponse.json()
        throw new Error(errorData.error || "Error al obtener información del usuario")
      }

      const userData: User = await userInfoResponse.json()
      console.log("Datos de usuario obtenidos:", userData)

      if (!userData.id) throw new Error("Falta el ID de Supabase en los datos del usuario")

      setDebugInfo((prev: any) => ({ ...prev, userData }))
      setUser(userData)
      saveUserToLocalStorage(userData)

      window.location.href = "/"
    } catch (err) {
      console.error("Error al iniciar sesión:", err)
      setDebugInfo((prev: any) => ({ ...prev, loginError: err }))
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      localStorage.removeItem("wikimillionaire_user")
      localStorage.removeItem("wikimillionaire_last_update")
      localStorage.removeItem("wikimillionaire_oauth_state")
      localStorage.removeItem("wikimillionaire_oauth_code_verifier")
      localStorage.removeItem("wikimillionaire_oauth_timestamp")
      setUser(null)
      window.location.href = "/"
    } catch (err) {
      console.error("Error al cerrar sesión:", err)
      setDebugInfo((prev: any) => ({ ...prev, logoutError: err }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, getAuthUrl, refreshUser, debugInfo, manualLogin }}
    >
      {children}
    </AuthContext.Provider>
  )
}
