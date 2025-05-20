"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, Award } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { LanguageSelector } from "@/components/language-selector"
import { WikimediaLoginButton } from "@/components/wikimedia-login-button"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const router = useRouter()
  const { locale, translations: t, changeLocale } = useLocale()
  const { user, loading, refreshUser } = useAuth()
  const [isClient, setIsClient] = useState(false)

  // Verificar si estamos en el cliente y si hay un usuario en localStorage
  useEffect(() => {
    setIsClient(true)

    // Intentar refrescar el usuario al cargar la página
    refreshUser()

    // Verificar si hay un usuario en localStorage
    const checkLocalStorage = () => {
      try {
        const storedUser = localStorage.getItem("wikimillionaire_user")
        if (storedUser && !user) {
          console.log("Usuario encontrado en localStorage pero no en contexto, refrescando...")
          refreshUser()
        }
      } catch (error) {
        console.error("Error al verificar localStorage:", error)
      }
    }

    checkLocalStorage()
  }, [refreshUser, user])

  // Mostrar un estado de carga hasta que sepamos si estamos en el cliente
  if (!isClient || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
        <div className="w-full max-w-md rounded-lg border border-purple-700 bg-purple-900/70 p-6 text-white">
          <h1 className="mb-4 text-xl font-bold">Cargando perfil...</h1>
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    )
  }

  // Verificar si hay un usuario en localStorage aunque no esté en el contexto
  let localUser = null
  try {
    const storedUser = localStorage.getItem("wikimillionaire_user")
    if (storedUser && !user) {
      localUser = JSON.parse(storedUser)
      console.log("Usuario encontrado en localStorage:", localUser)
    }
  } catch (error) {
    console.error("Error al leer localStorage:", error)
  }

  // Usar el usuario del contexto o el de localStorage
  const currentUser = user || localUser

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
        <div className="w-full max-w-md rounded-lg border border-purple-700 bg-purple-900/70 p-6 text-white">
          <h1 className="mb-4 text-xl font-bold text-red-400">Acceso denegado</h1>
          <p className="text-gray-300">Debes iniciar sesión para ver esta página.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Button onClick={() => router.push("/")} className="bg-yellow-500 text-black hover:bg-yellow-600">
              Volver al inicio
            </Button>
            <Button
              onClick={() => (window.location.href = "/api/auth/login")}
              variant="outline"
              className="border-purple-700 text-white hover:bg-purple-800/50"
            >
              Iniciar sesión
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-gray-300 hover:text-white">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-yellow-400">Wiki</span>Millionaire
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector currentLocale={locale} onLocaleChange={changeLocale} />
            <WikimediaLoginButton t={t} />
          </div>
        </div>

        <Card className="border-purple-700 bg-purple-900/70 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <User className="h-6 w-6 text-yellow-400" />
              Perfil de Usuario
            </CardTitle>
            <CardDescription className="text-gray-300">Información de tu cuenta de WikiMillionaire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-yellow-500">
                {currentUser.avatar_url ? (
                  <Image
                    src={currentUser.avatar_url || "/placeholder.svg"}
                    alt={currentUser.username}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-purple-800 text-3xl font-bold text-white">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-yellow-400">{currentUser.username}</h2>
                {currentUser.email && <p className="text-gray-300">{currentUser.email}</p>}
                <p className="text-sm text-gray-400">
                  Miembro desde {new Date(currentUser.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-purple-700 bg-purple-800/30 p-4">
              <h3 className="mb-3 text-lg font-semibold text-yellow-400">Estadísticas</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center">
                  <p className="text-sm text-gray-300">Partidas jugadas</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center">
                  <p className="text-sm text-gray-300">Puntuación máxima</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center">
                  <p className="text-sm text-gray-300">Posición en ranking</p>
                  <p className="text-2xl font-bold text-white">-</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-purple-700 bg-purple-800/30 p-4">
              <h3 className="mb-3 text-lg font-semibold text-yellow-400">Logros</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex flex-col items-center gap-2 rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center opacity-50">
                  <Award className="h-8 w-8 text-yellow-400" />
                  <p className="text-sm text-gray-300">Primer juego</p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center opacity-50">
                  <Award className="h-8 w-8 text-yellow-400" />
                  <p className="text-sm text-gray-300">Llegar a 10,000</p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center opacity-50">
                  <Award className="h-8 w-8 text-yellow-400" />
                  <p className="text-sm text-gray-300">Millonario</p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center opacity-50">
                  <Award className="h-8 w-8 text-yellow-400" />
                  <p className="text-sm text-gray-300">Top 10</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button asChild className="bg-yellow-500 text-black hover:bg-yellow-600">
              <Link href="/play">{t.general.play}</Link>
            </Button>
            <Button asChild variant="outline" className="border-purple-700 text-white hover:bg-purple-800/50">
              <Link href="/leaderboard">
                <Award className="mr-2 h-4 w-4" />
                {t.leaderboard.title}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <footer className="mt-auto border-t border-purple-700 bg-purple-900/50 py-4">
        <div className="container mx-auto">
          <p className="text-center text-sm text-gray-300">© 2025 WikiMillionaire. {t.general.credits}</p>
        </div>
      </footer>
    </div>
  )
}
