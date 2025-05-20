import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { SessionHandler } from "@/components/session-handler"
import { AuthDebug } from "@/components/auth-debug"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "WikiMillionaire - Juego de Preguntas con Wikidata",
  description: "Un juego de preguntas estilo '¿Quién quiere ser millonario?' usando datos de Wikidata",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SessionHandler />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
