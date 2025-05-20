import { sign, verify } from "jsonwebtoken"
import { cookies } from "next/headers"
import { query, getUserById, getUserByWikimediaId, createUser, updateUser } from "./db"
import { getGravatarUrl } from "./gravatar"

// Secreto para firmar los JWT
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_EXPIRY = "7d" // 7 días

// Tipo para el usuario
export type User = {
  id: number
  username: string
  wikimedia_id: string | null
  email: string | null
  avatar_url: string | null
  last_login: Date
  created_at: Date
  updated_at: Date
}

// Función para crear un token JWT
export function createToken(user: User) {
  return sign(
    {
      sub: user.id.toString(),
      username: user.username,
      wikimedia_id: user.wikimedia_id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY },
  )
}

// Función para verificar un token JWT
export function verifyToken(token: string) {
  try {
    return verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Función para obtener el usuario actual desde la cookie
export async function getCurrentUser() {
  const cookieStore = cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload || typeof payload.sub !== "string") return null

  try {
    const user = await getUserById(payload.sub)
    return user
  } catch (error) {
    console.error("Error al obtener el usuario actual:", error)
    return null
  }
}

// Función para crear una sesión
export async function createSession(user: User) {
  const token = createToken(user)

  // Guardar la sesión en la base de datos
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 días

  await query("INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)", [
    user.id,
    token,
    expiresAt.toISOString(),
  ])

  return token
}

// Función para eliminar una sesión
export async function deleteSession(token: string) {
  await query("DELETE FROM sessions WHERE token = $1", [token])
}

// Función para procesar la información del usuario de Wikimedia
export async function processWikimediaUser(userInfo: {
  sub: string
  username: string
  email?: string | null
}) {
  try {
    // Buscar si el usuario ya existe
    let user = await getUserByWikimediaId(userInfo.sub)

    if (user) {
      // Actualizar el usuario existente
      user = await updateUser(user.id.toString(), {
        last_login: new Date(),
        email: userInfo.email || null,
        avatar_url: userInfo.email ? getGravatarUrl(userInfo.email) : null,
      })
    } else {
      // Crear un nuevo usuario
      user = await createUser({
        username: userInfo.username,
        wikimedia_id: userInfo.sub,
        email: userInfo.email || null,
        avatar_url: userInfo.email ? getGravatarUrl(userInfo.email) : null,
      })
    }

    // Crear una sesión para el usuario
    const token = await createSession(user)

    return { user, token }
  } catch (error) {
    console.error("Error al procesar el usuario de Wikimedia:", error)
    throw error
  }
}
