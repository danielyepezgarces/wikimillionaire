import crypto from "crypto"

export function getGravatarUrl(email: string, size = 80): string {
  if (!email) {
    // URL de avatar por defecto si no hay email
    return `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=${size}`
  }

  // Normalizar el email y crear el hash MD5
  const normalizedEmail = email.trim().toLowerCase()
  const hash = crypto.createHash("md5").update(normalizedEmail).digest("hex")

  // Construir la URL de Gravatar
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=${size}`
}
