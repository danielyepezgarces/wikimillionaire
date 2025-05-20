"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

export type User = {
  id: string
  username: string
  wikimedia_id: string
  email: string | null
  avatar_url: string | null
  created_at: string
  last_login: string
}

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
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastCheck, setLastCheck] = useState(0)

  const getUserFromLocalStorage = (): User | null => {
    if (typeof window === "undefined") return null
    try {
      const userJson = localStorage.getItem("wikimillionaire_user")
      return userJson ? JSON.parse(userJson) : null
    } catch (e) {
      console.error("Error leyendo localStorage:", e)
      return null
    }
  }

  const saveUserToLocalStorage = (user: User | null) => {
    if (typeof window === "undefined") return
    if (user) {
      localStorage.setItem("wikimillionaire_user", JSON.stringify(user))
    } else {
      localStorage.removeItem("wikimillionaire_user")
    }
  }

  const manualLogin = (userData: any) => {
    const user: User = {
      id: userData.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      username: userData.username || "usuario_test",
      wikimedia_id: userData.wikimedia_id || "test_id",
      email: userData.email || null,
      avatar_url: userData.avatar_url || null,
      created_at: userData.created_at || new Date().toISOString(),
      last_login: new Date().toISOString(),
    }
    setUser(user)
    saveUserToLocalStorage(user)
    syncUserWithServer(user)
  }

  const syncUserWithServer = async (userData: User) => {
    try {
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user: userData }),
      })
    } catch (e) {
      console.error("Error sincronizando con el servidor:", e)
    }
  }

  const checkSession = async (force = false) => {
    const now = Date.now()
    if (!force && now - lastCheck < 30000 && isInitialized) return

    try {
      setLoading(true)
      setLastCheck(now)

      const localUser = getUserFromLocalStorage()
      if (localUser && !force) {
        setUser(localUser)
        setDebugInfo((prev: any) => ({ ...prev, userData: localUser, source: "localStorage" }))
        setLoading(false)
        setIsInitialized(true)
        return
      }

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
        credentials: "include",
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        saveUserToLocalStorage(userData)
        setDebugInfo((prev: any) => ({ ...prev, userData, source: "api" }))
      } else if (response.status === 401) {
        if (localUser) {
          await syncUserWithServer(localUser)
        } else {
          setUser(null)
        }
      } else {
        console.error("Error verificando sesión:", response.status)
      }
    } catch (e) {
      console.error("Error general verificando sesión:", e)
      if (getUserFromLocalStorage()) {
        setUser(getUserFromLocalStorage())
      }
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  const refreshUser = async () => {
    await checkSession(true)
  }

  const getAuthUrl = async (): Promise<string> => {
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
    const codeChallenge = hashBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

    const clientId = "cd1155b5217d823cec353e1e7b5576a1"
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`)

    return `https://www.wikidata.org/w/rest.php/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`
  }

  const login = async (code: string, codeVerifier: string) => {
    try {
      setLoading(true)
      setError(null)

      const tokenRes = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, codeVerifier }),
      })

      if (!tokenRes.ok) {
        const err = await tokenRes.json()
        throw new Error(err.error || "Error obteniendo token")
      }

      const { access_token } = await tokenRes.json()
      setDebugInfo((prev: any) => ({ ...prev, token: access_token }))

      const userRes = await fetch("/api/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accessToken: access_token }),
      })

      if (!userRes.ok) {
        const err = await userRes.json()
        throw new Error(err.error || "Error obteniendo usuario")
      }

      const userData = await userRes.json()
      setUser(userData)
      saveUserToLocalStorage(userData)
      setDebugInfo((prev: any) => ({ ...prev, userData }))
      window.location.href = "/"
    } catch (e) {
      console.error("Error en login:", e)
      setError("Error al iniciar sesión")
      setDebugInfo((prev: any) => ({ ...prev, loginError: e }))
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      saveUserToLocalStorage(null)
      window.location.href = "/"
    } catch (e) {
      console.error("Error cerrando sesión:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        getAuthUrl,
        refreshUser,
        debugInfo,
        manualLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
