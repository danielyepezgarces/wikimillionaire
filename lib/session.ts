import { cookies } from "next/headers"
import { encrypt, decrypt } from "./crypto"
import { getGravatarUrl } from "./gravatar"

// Tipo para la sesión del usuario
export type UserSession = {
  id: string // UUID desde Supabase
  username: string
  wikimedia_id: string
  email?: string | null
  avatar_url?: string | null
  created_at: string
  last_login: string
}

// Función para crear una sesión
export async function createSession(userData: {
  id: string // UUID desde Supabase
  username: string
  wikimedia_id: string
  email?: string | null
}): Promise<UserSession> {
  const { id, username, wikimedia_id, email } = userData
  const now = new Date().toISOString()

  const session: UserSession = {
    id,
    username,
    wikimedia_id,
    email: email || null,
    avatar_url: email ? getGravatarUrl(email) : null,
    created_at: now,
    last_login: now,
  }

  const encryptedSession = await encrypt(JSON.stringify(session))

  const cookieStore = cookies()
  cookieStore.set("session", encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
    sameSite: "lax",
  })

  return session
}

// Función para obtener la sesión actual
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) return null

  try {
    const decryptedSession = await decrypt(sessionCookie.value)
    return JSON.parse(decryptedSession)
  } catch (error) {
    console.error("Error al desencriptar la sesión:", error)
    return null
  }
}

// Función para actualizar la sesión
export async function updateSession(updates: Partial<UserSession>): Promise<UserSession | null> {
  const session = await getSession()
  if (!session) return null

  const updatedSession: UserSession = {
    ...session,
    ...updates,
    last_login: new Date().toISOString(),
  }

  const encryptedSession = await encrypt(JSON.stringify(updatedSession))

  const cookieStore = cookies()
  cookieStore.set("session", encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  })

  return updatedSession
}

// Función para eliminar la sesión
export function deleteSession() {
  const cookieStore = cookies()
  cookieStore.delete("session")
}
