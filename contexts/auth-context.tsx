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
  auth_id?: string | null
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
      const supabase = createSupabaseClient()

      // Verificar si hay una sesión activa
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error al obtener la sesión:", sessionError)
        setDebugInfo((prev: any) => ({ ...prev, sessionError }))
        setUser(null)
        setLoading(false)
        return
      }

      console.log("Sesión obtenida:", sessionData?.session ? "Activa" : "No hay sesión")
      setDebugInfo((prev: any) => ({ ...prev, sessionData }))

      if (!sessionData?.session) {
        // No hay sesión activa
        setUser(null)
        setLoading(false)
        return
      }

      const authUserId = sessionData.session.user.id
      console.log("ID de usuario autenticado:", authUserId)

      // Obtener el email de autenticación
      const authEmail = sessionData.session.user.email
      console.log("Email de autenticación:", authEmail)

      // Obtener el wikimedia_id de los metadatos
      const wikimediaId = sessionData.session.user.user_metadata?.wikimedia_id
      console.log("Wikimedia ID de los metadatos:", wikimediaId)

      // Obtener todos los usuarios para depuración
      const { data: allUsers, error: allUsersError } = await supabase.from("users").select("*")
      console.log("Todos los usuarios:", allUsers)
      setDebugInfo((prev: any) => ({ ...prev, allUsers }))

      if (allUsersError) {
        console.error("Error al obtener todos los usuarios:", allUsersError)
        setDebugInfo((prev: any) => ({ ...prev, allUsersError }))
      }

      // Estrategia 1: Buscar por auth_id
      const { data: userByAuthId, error: authIdError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUserId)
        .single()

      if (!authIdError && userByAuthId) {
        console.log("Usuario encontrado por auth_id:", userByAuthId)
        setDebugInfo((prev: any) => ({ ...prev, userByAuthId }))
        setUser(userByAuthId as User)
        setLoading(false)
        return
      }

      console.log("No se encontró usuario por auth_id, buscando por wikimedia_id")
      setDebugInfo((prev: any) => ({ ...prev, authIdError }))

      // Estrategia 2: Buscar por wikimedia_id
      if (wikimediaId) {
        const { data: userByWikimediaId, error: wikimediaError } = await supabase
          .from("users")
          .select("*")
          .eq("wikimedia_id", wikimediaId)
          .single()

        if (!wikimediaError && userByWikimediaId) {
          console.log("Usuario encontrado por wikimedia_id:", userByWikimediaId)
          setDebugInfo((prev: any) => ({ ...prev, userByWikimediaId }))

          // Actualizar el auth_id si no está establecido
          if (!userByWikimediaId.auth_id) {
            const { error: updateError } = await supabase
              .from("users")
              .update({ auth_id: authUserId })
              .eq("id", userByWikimediaId.id)

            if (updateError) {
              console.error("Error al actualizar auth_id:", updateError)
              setDebugInfo((prev: any) => ({ ...prev, updateError }))
            } else {
              console.log("auth_id actualizado correctamente")
              userByWikimediaId.auth_id = authUserId
            }
          }

          setUser(userByWikimediaId as User)
          setLoading(false)
          return
        }

        console.log("No se encontró usuario por wikimedia_id:", wikimediaError)
        setDebugInfo((prev: any) => ({ ...prev, wikimediaError }))
      }

      // Estrategia 3: Buscar por email
      const realEmail = sessionData.session.user.user_metadata?.real_email
      console.log("Email real de los metadatos:", realEmail)

      if (realEmail) {
        const { data: userByEmail, error: emailError } = await supabase
          .from("users")
          .select("*")
          .eq("email", realEmail)
          .single()

        if (!emailError && userByEmail) {
          console.log("Usuario encontrado por email real:", userByEmail)
          setDebugInfo((prev: any) => ({ ...prev, userByEmail }))

          // Actualizar el auth_id si no está establecido
          if (!userByEmail.auth_id) {
            const { error: updateError } = await supabase
              .from("users")
              .update({ auth_id: authUserId })
              .eq("id", userByEmail.id)

            if (updateError) {
              console.error("Error al actualizar auth_id:", updateError)
              setDebugInfo((prev: any) => ({ ...prev, updateError }))
            } else {
              console.log("auth_id actualizado correctamente")
              userByEmail.auth_id = authUserId
            }
          }

          setUser(userByEmail as User)
          setLoading(false)
          return
        }

        console.log("No se encontró usuario por email real:", emailError)
        setDebugInfo((prev: any) => ({ ...prev, emailError }))
      }

      // Estrategia 4: Crear un nuevo usuario si no se encuentra por ningún método
      console.log("No se encontró usuario por ningún método, creando uno nuevo")

      // Obtener información de los metadatos
      const username = sessionData.session.user.user_metadata?.username || "Usuario"
      console.log("Creando usuario con:", {
        username,
        wikimediaId,
        email: realEmail,
        authId: authUserId,
      })

      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          username: username,
          wikimedia_id: wikimediaId,
          email: realEmail,
          avatar_url: realEmail ? getGravatarUrl(realEmail) : null,
          last_login: new Date().toISOString(),
          auth_id: authUserId,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error al crear usuario:", insertError)
        setDebugInfo((prev: any) => ({ ...prev, insertError }))
        setUser(null)
      } else {
        console.log("Usuario creado:", newUser)
        setDebugInfo((prev: any) => ({ ...prev, newUser }))
        setUser(newUser as User)
      }
    } catch (err) {
      console.error("Error al verificar la sesión:", err)
      setDebugInfo((prev: any) => ({ ...prev, sessionCheckError: err }))
      setError("Error al verificar la sesión")
      // Si hay un error con la sesión, limpiar el estado
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Inicializar y verificar la sesión al cargar
  useEffect(() => {
    console.log("AuthProvider: Inicializando...")
    checkSession()

    // Configurar un listener para cambios en la sesión
    const supabase = createSupabaseClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Evento de autenticación:", event)
      setDebugInfo((prev: any) => ({ ...prev, authEvent: event, session }))

      if (event === "SIGNED_IN") {
        console.log("Usuario ha iniciado sesión, actualizando estado")
        checkSession()
      } else if (event === "SIGNED_OUT") {
        console.log("Usuario ha cerrado sesión, limpiando estado")
        setUser(null)
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Token refrescado, actualizando estado")
        checkSession()
      } else if (event === "USER_UPDATED") {
        console.log("Usuario actualizado, actualizando estado")
        checkSession()
      }
    })

    return () => {
      // Limpiar el listener al desmontar
      subscription.unsubscribe()
    }
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
      const supabase = createSupabaseClient()

      await supabase.auth.signOut()
      setUser(null)

      // Limpiar cookies de autenticación
      document.cookie = "wikimedia_auth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

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
