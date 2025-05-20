import { neon, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Configurar Neon para usar fetch nativo
neonConfig.fetchConnectionCache = true

// Crear cliente SQL usando la URL de conexión
const sql = neon(process.env.DATABASE_URL!)

// Crear cliente Drizzle
const db = drizzle(sql)

// Función para ejecutar consultas SQL directas
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    // Convertir los parámetros a formato de marcador de posición $1, $2, etc.
    const paramPlaceholders = params?.map((_, i) => `$${i + 1}`).join(", ") || ""

    // Ejecutar la consulta
    const result = await sql(text, params || [])

    const duration = Date.now() - start

    return result
  } catch (error) {
    console.error("Error al ejecutar consulta", { text, error })
    throw error
  }
}

// Función para obtener un usuario por ID
export async function getUserById(id: string) {
  const result = await query("SELECT * FROM users WHERE id = $1", [id])
  return result[0] || null
}

// Función para obtener un usuario por wikimedia_id
export async function getUserByWikimediaId(wikimediaId: string) {
  const result = await query("SELECT * FROM users WHERE wikimedia_id = $1", [wikimediaId])
  return result[0] || null
}

// Función para crear un usuario
export async function createUser(userData: {
  username: string
  wikimedia_id: string
  email?: string | null
  avatar_url?: string | null
}) {
  const { username, wikimedia_id, email, avatar_url } = userData

  const result = await query(
    "INSERT INTO users (username, wikimedia_id, email, avatar_url, last_login) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
    [username, wikimedia_id, email || null, avatar_url || null],
  )

  return result[0]
}

// Función para actualizar un usuario
export async function updateUser(
  id: string,
  userData: {
    username?: string
    email?: string | null
    avatar_url?: string | null
    last_login?: Date
  },
) {
  const updates = []
  const values = []
  let counter = 1

  // Construir la consulta dinámicamente
  for (const [key, value] of Object.entries(userData)) {
    if (value !== undefined) {
      updates.push(`${key} = $${counter}`)
      values.push(value)
      counter++
    }
  }

  if (updates.length === 0) return null

  values.push(id)

  const result = await query(
    `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${counter} RETURNING *`,
    values,
  )

  return result[0]
}

// Función para inicializar la base de datos
export async function initializeDatabase() {
  try {
    // Crear tabla de usuarios si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        wikimedia_id VARCHAR(255) UNIQUE,
        email VARCHAR(255),
        avatar_url TEXT,
        last_login TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Crear tabla de sesiones si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
    throw error
  }
}
