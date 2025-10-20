"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useSession, signIn, signOut } from "next-auth/react"

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
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
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
  const { data: session, status } = useSession()

  // Convert next-auth session to our User type
  const user: User | null = session?.user
    ? {
        id: session.user.id || "",
        username: session.user.name || "",
        wikimedia_id: session.user.wikimedia_id || "",
        email: session.user.email || null,
        avatar_url: session.user.image || null,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      }
    : null

  const loading = status === "loading"

  // Función para iniciar sesión
  const login = async () => {
    await signIn("wikimedia", { callbackUrl: "/" })
  }

  // Función para cerrar sesión
  const logout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  // Función para refrescar los datos del usuario
  const refreshUser = async () => {
    // Next-auth handles this automatically
  }

  // Valor del contexto
  const value = {
    user,
    loading,
    error: null,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
