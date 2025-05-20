import { initializeDatabase } from "@/lib/db"

async function main() {
  try {
    await initializeDatabase()
    console.log("Base de datos inicializada correctamente")
    process.exit(0)
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
    process.exit(1)
  }
}

main()
