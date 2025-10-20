import * as mysql from "mysql2/promise"

// Create database connection configuration
function getDbConfig() {
  // If DATABASE_URL is provided, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // Otherwise, construct from individual environment variables
  return {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "wikimillionaire",
  }
}

// Create connection pool for MariaDB
const dbConfig = getDbConfig()
const pool = typeof dbConfig === "string" ? mysql.createPool(dbConfig) : mysql.createPool(dbConfig)

// Function to execute SQL queries
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    // Convert PostgreSQL-style placeholders ($1, $2) to MySQL-style (?)
    let convertedText = text
    if (params && params.length > 0) {
      // Replace $1, $2, etc. with ?
      for (let i = params.length; i >= 1; i--) {
        convertedText = convertedText.replace(new RegExp(`\\$${i}\\b`, "g"), "?")
      }
    }

    const [rows] = await pool.execute(convertedText, params || [])

    const duration = Date.now() - start

    return rows as any[]
  } catch (error) {
    console.error("Error al ejecutar consulta", { text, error })
    throw error
  }
}

// Función para obtener un usuario por ID
export async function getUserById(id: string) {
  const result = await query("SELECT * FROM users WHERE id = ?", [id])
  return result[0] || null
}

// Función para obtener un usuario por wikimedia_id
export async function getUserByWikimediaId(wikimediaId: string) {
  const result = await query("SELECT * FROM users WHERE wikimedia_id = ?", [wikimediaId])
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

  await query(
    "INSERT INTO users (username, wikimedia_id, email, avatar_url, last_login) VALUES (?, ?, ?, ?, NOW())",
    [username, wikimedia_id, email || null, avatar_url || null],
  )

  // Get the inserted user
  const result = await query("SELECT * FROM users WHERE wikimedia_id = ? ORDER BY id DESC LIMIT 1", [
    wikimedia_id,
  ])

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

  // Construir la consulta dinámicamente
  for (const [key, value] of Object.entries(userData)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`)
      values.push(value)
    }
  }

  if (updates.length === 0) return null

  values.push(id)

  await query(`UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`, values)

  // Get the updated user
  const result = await query("SELECT * FROM users WHERE id = ?", [id])

  return result[0]
}

// Función para inicializar la base de datos
export async function initializeDatabase() {
  try {
    // Crear tabla de usuarios si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        wikimedia_id VARCHAR(255) UNIQUE,
        email VARCHAR(255),
        avatar_url TEXT,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Crear tabla de sesiones si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Crear tabla de scores si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        score INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Crear índices para optimizar consultas
    await query(`
      CREATE INDEX IF NOT EXISTS idx_scores_username ON scores(username)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at)
    `)

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
    throw error
  }
}
