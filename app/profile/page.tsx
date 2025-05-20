"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, Award, Trophy, Star, Gamepad, Diamond } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { LanguageSelector } from "@/components/language-selector"
import { WikimediaLoginButton } from "@/components/wikimedia-login-button"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"
import { useEffect, useState } from "react"
import type { UserStats, Achievement } from "@/lib/scores"
import { Progress } from "@/components/ui/progress"

export default function ProfilePage() {
  const { locale, translations: t, changeLocale } = useLocale()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const fetchStats = async () => {
      if (!user) return

      try {
        setLoadingStats(true)
        const response = await fetch(`/api/stats?userId=${user.id}`)

        if (!response.ok) {
          throw new Error("Error al obtener estadísticas")
        }

        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Error al cargar estadísticas:", error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [user])

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case "play":
        return <Gamepad className="h-8 w-8 text-yellow-400" />
      case "trophy":
        return <Trophy className="h-8 w-8 text-yellow-400" />
      case "award":
        return <Award className="h-8 w-8 text-yellow-400" />
      case "diamond":
        return <Diamond className="h-8 w-8 text-yellow-400" />
      case "gamepad":
        return <Gamepad className="h-8 w-8 text-yellow-400" />
      case "medal":
        return <Star className="h-8 w-8 text-yellow-400" />
      default:
        return <Award className="h-8 w-8 text-yellow-400" />
    }
  }

  const handleNavigation = (path: string) => {
    if (isClient) {
      window.location.href = path
    }
  }

  if (loading || loadingStats) {
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

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
        <div className="w-full max-w-md rounded-lg border border-purple-700 bg-purple-900/70 p-6 text-white">
          <h1 className="mb-4 text-xl font-bold text-red-400">Acceso denegado</h1>
          <p className="text-gray-300">Debes iniciar sesión para ver esta página.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Button
              onClick={() => handleNavigation("/")}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              Volver al inicio
            </Button>
            <Button
              onClick={() => handleNavigation("/api/auth/login")}
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
          <button 
            onClick={() => handleNavigation("/")}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
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
              {t.profile.title}
            </CardTitle>
            <CardDescription className="text-gray-300">{t.profile.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-yellow-500">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.username}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-purple-800 text-3xl font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-yellow-400">{user.username}</h2>
                {user.email && <p className="text-gray-300">{user.email}</p>}
                <p className="text-sm text-gray-400">
                  {t.profile.memberSince} {new Date(user.created_at).toLocaleDateString()}
                </p>
                {stats && stats.rank && (
                  <p className="mt-1 inline-flex items-center rounded-full bg-purple-800/50 px-2 py-1 text-sm text-yellow-400">
                    <Trophy className="mr-1 h-4 w-4" /> {t.profile.rank}: #{stats.rank}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-purple-700 bg-purple-800/30 p-4">
              <h3 className="mb-3 text-lg font-semibold text-yellow-400">{t.profile.stats}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center">
                  <p className="text-sm text-gray-300">{t.profile.gamesPlayed}</p>
                  <p className="text-2xl font-bold text-white">{stats?.gamesPlayed || 0}</p>
                </div>
                <div className="rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center">
                  <p className="text-sm text-gray-300">{t.profile.highestScore}</p>
                  <p className="text-2xl font-bold text-white">{stats?.highestScore?.toLocaleString() || 0}</p>
                </div>
                <div className="rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center">
                  <p className="text-sm text-gray-300">{t.profile.rank}</p>
                  <p className="text-2xl font-bold text-white">#{stats?.rank || "-"}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-purple-700 bg-purple-800/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-300">{t.profile.totalScore}</p>
                    <p className="font-bold text-white">{stats?.totalScore?.toLocaleString() || 0}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-purple-700 bg-purple-800/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-300">{t.profile.averageScore}</p>
                    <p className="font-bold text-white">{stats?.averageScore?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-purple-700 bg-purple-800/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300">{t.profile.lastGame}</p>
                  <p className="font-bold text-white">
                    {stats?.lastPlayed ? new Date(stats.lastPlayed).toLocaleDateString() : "-"}
                  </p>
                </div>
              </div>

              {stats?.highestScore && stats.highestScore > 0 && (
                <div className="mt-4">
                  <p className="mb-1 text-sm text-gray-300">{t.profile.progressToMillion}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.highestScore / 1000000) * 100} className="h-2" />
                    <span className="text-xs text-gray-300">{Math.round((stats.highestScore / 1000000) * 100)}%</span>
                  </div>
                </div>
              )}
            </div>

            {stats?.achievements && stats.achievements.length > 0 && (
              <div className="rounded-lg border border-purple-700 bg-purple-800/30 p-4">
                <h3 className="mb-3 text-lg font-semibold text-yellow-400">{t.profile.achievements}</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {stats.achievements.map((achievement: Achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex flex-col items-center gap-2 rounded-lg border border-purple-700 bg-purple-800/50 p-3 text-center ${
                        achievement.unlocked ? "" : "opacity-50"
                      }`}
                    >
                      {getAchievementIcon(achievement.icon)}
                      <p className="text-sm text-gray-300">{achievement.name}</p>
                      {achievement.unlocked ? (
                        <span className="mt-1 rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
                          {t.profile.unlocked}
                        </span>
                      ) : (
                        <span className="mt-1 rounded-full bg-gray-900/50 px-2 py-0.5 text-xs text-gray-400">
                          {t.profile.locked}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button
              onClick={() => handleNavigation("/play")}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              {t.general.play}
            </Button>
            <Button
              onClick={() => handleNavigation("/leaderboard")}
              variant="outline"
              className="border-purple-700 text-white hover:bg-purple-800/50"
            >
              <Award className="mr-2 h-4 w-4" />
              {t.leaderboard.title}
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