import { cookies } from "next/headers"
import { encrypt, decrypt } from "./crypto"
import { getGravatarUrl } from "./gravatar"

// Tipo para el usuario
export type User = {
  id: string // UUID de Supabase
  username: string
  wikimedia_id: string
  email: string | null
  avatar_url: string | null
  created_at: string
  last_login: string
}

// Nombre de la cookie
const USER_COOKIE_NAME = "wikimillionaire_user"

// Función para crear una cookie de usuario
export async function createUserCookie(userData: {
  id: string // UUID de Supabase
  username: string
  wikimedia_id: string
  email?: string | null
}): Promise<User> {
  const { id, username, wikimedia_id, email } = userData
  const now = new Date().toISOString()

  const user: User = {
    id,
    username,
    wikimedia_id,
    email: email || null,
    avatar_url: email ? getGravatarUrl(email) : null,
    created_at,
    last_login: now,
  }

  const encryptedUser = await encrypt(JSON.stringify(user))

  const cookieStore = cookies()
  cookieStore.set(USER_COOKIE_NAME, encryptedUser, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
    sameSite: "lax",
  })

  return user
}

// Función para obtener el usuario de la cookie
export async function getUserFromCookie(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const userCookie = cookieStore.get(USER_COOKIE_NAME)

    if (!userCookie) {
      return null
    }

    const decryptedUser = await decrypt(userCookie.value)
    return JSON.parse(decryptedUser)
  } catch (error) {
    console.error("Error al obtener usuario de cookie:", error)
    return null
  }
}

// Función para actualizar la cookie del usuario
export async function updateUserCookie(updates: Partial<User>): Promise<User | null> {
  try {
    const user = await getUserFromCookie()
    if (!user) return null

    const updatedUser: User = {
      ...user,
      ...updates,
      last_login: new Date().toISOString(),
    }

    const encryptedUser = await encrypt(JSON.stringify(updatedUser))

    const cookieStore = cookies()
    cookieStore.set(USER_COOKIE_NAME, encryptedUser, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
      sameSite: "lax",
    })

    return updatedUser
  } catch (error) {
    console.error("Error al actualizar usuario en cookie:", error)
    return null
  }
}

// Función para eliminar la cookie del usuario
export function deleteUserCookie() {
  const cookieStore = cookies()
  cookieStore.delete(USER_COOKIE_NAME)
}
