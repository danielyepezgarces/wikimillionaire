import { randomBytes, createCipheriv, createDecipheriv } from "crypto"

// Clave secreta para encriptación (debe ser de 32 bytes para AES-256)
const SECRET_KEY = process.env.SESSION_SECRET || "your-secret-key-must-be-32-chars-long"
const ALGORITHM = "aes-256-cbc"

// Función para encriptar datos
export async function encrypt(text: string): Promise<string> {
  // Generar un IV aleatorio
  const iv = randomBytes(16)

  // Asegurarse de que la clave tenga 32 bytes
  const key = Buffer.from(SECRET_KEY.padEnd(32).slice(0, 32))

  // Crear cipher
  const cipher = createCipheriv(ALGORITHM, key, iv)

  // Encriptar los datos
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  // Devolver IV + datos encriptados
  return iv.toString("hex") + ":" + encrypted
}

// Función para desencriptar datos
export async function decrypt(encryptedText: string): Promise<string> {
  // Separar IV y datos encriptados
  const [ivHex, encrypted] = encryptedText.split(":")

  // Convertir IV a Buffer
  const iv = Buffer.from(ivHex, "hex")

  // Asegurarse de que la clave tenga 32 bytes
  const key = Buffer.from(SECRET_KEY.padEnd(32).slice(0, 32))

  // Crear decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv)

  // Desencriptar los datos
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
