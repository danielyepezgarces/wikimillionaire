"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Medal, Clock, Info } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { LanguageSelector } from "@/components/language-selector"
import { WikimediaLoginButton } from "@/components/wikimedia-login-button"
import { getRankingResetInfo, type RankingResetInfo } from "@/lib/scores-utils"
import Image from "next/image"
import { CountdownTimer } from "@/components/countdown-timer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type LeaderboardEntry = {
  rank: number
  userId: string
  username: string
  avatarUrl: string | null
  score: number
  gamesPlayed: number
  lastPlayed: string
}

export default function LeaderboardPage() {
  const { locale, translations: t, changeLocale } = useLocale()
  const [activeTab, setActiveTab] = useState("daily")
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resetInfo, setResetInfo] = useState<RankingResetInfo[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener datos del leaderboard via API
        const response = await fetch(`/api/scores?period=${activeTab}&limit=10`)
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard")
        }
        const result = await response.json()
        setLeaderboard(result.data || [])

        // Obtener información de reinicio
        const resetData = getRankingResetInfo()
        setResetInfo(resetData)
      } catch (error) {
        console.error("Error al cargar leaderboard:", error)
        setError("Error al cargar la tabla de clasificación. Por favor, inténtalo de nuevo.")
      } finally {
        setLoading(false)
      }
    }

    if (isClient) {
      fetchLeaderboard()
    }
  }, [activeTab, isClient])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const getCurrentResetInfo = () => {
    return resetInfo.find((info) => info.period === activeTab) || resetInfo[0]
  }

  const handleNavigation = (path: string) => {
    if (isClient) {
      window.location.href = path
    }
  }

  if (!isClient) {
    return null // No renderizar nada en el servidor
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => handleNavigation("/")} className="text-gray-300 hover:text-white">
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
              <Trophy className="h-6 w-6 text-yellow-400" />
              {t.leaderboard.title}
            </CardTitle>
            <CardDescription className="text-gray-300">{t.leaderboard.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily" value={activeTab} onValueChange={handleTabChange}>
              <div className="flex items-center justify-between">
                <TabsList className="bg-purple-800/50">
                  <TabsTrigger value="daily" className="data-[state=active]:bg-purple-700">
                    {t.leaderboard.tabs.daily}
                  </TabsTrigger>
                  <TabsTrigger value="weekly" className="data-[state=active]:bg-purple-700">
                    {t.leaderboard.tabs.weekly}
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-purple-700">
                    {t.leaderboard.tabs.monthly}
                  </TabsTrigger>
                  <TabsTrigger value="all" className="data-[state=active]:bg-purple-700">
                    Todos
                  </TabsTrigger>
                </TabsList>

                {resetInfo.length > 0 && activeTab !== "all" && (
                  <div className="flex items-center gap-1 text-sm text-yellow-400">
                    <Clock className="h-4 w-4" />
                    <span>{t.leaderboard.resetsIn}: </span>
                    <CountdownTimer targetDate={getCurrentResetInfo().nextReset} className="font-bold" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="ml-1 h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            El ranking{" "}
                            {activeTab === "daily" ? "diario" : activeTab === "weekly" ? "semanal" : "mensual"} se
                            reiniciará el {getCurrentResetInfo().formattedNextReset}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>

              <TabsContent value="daily" className="mt-4">
                {renderLeaderboardContent()}
              </TabsContent>
              <TabsContent value="weekly" className="mt-4">
                {renderLeaderboardContent()}
              </TabsContent>
              <TabsContent value="monthly" className="mt-4">
                {renderLeaderboardContent()}
              </TabsContent>
              <TabsContent value="all" className="mt-4">
                {renderLeaderboardContent()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-auto border-t border-purple-700 bg-purple-900/50 py-4">
        <div className="container mx-auto">
          <p className="text-center text-sm text-gray-300">
            © 2025 WikiMillionaire. Juego creado por Daniel Yepez Garces
          </p>
        </div>
      </footer>
    </div>
  )

  function renderLeaderboardContent() {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-700 bg-purple-800/30 p-4 text-center">
          <p className="text-red-400">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4 border-purple-700 text-white hover:bg-purple-800/50"
          >
            Intentar de nuevo
          </Button>
        </div>
      )
    }

    if (leaderboard.length === 0) {
      return (
        <div className="rounded-lg border border-purple-700 bg-purple-800/30 p-8 text-center">
          <p className="text-gray-300">{t.leaderboard.noData}</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-purple-700 bg-purple-800/30 p-4">
          <div className="flex items-center justify-between text-sm font-medium text-gray-400">
            <div className="w-16 text-center">{t.leaderboard.position}</div>
            <div className="flex-1">Jugador</div>
            <div className="w-24 text-right">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center justify-end gap-1">
                    <span>Puntuación</span>
                    <Info className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Suma total de puntos en este período</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="w-24 text-right">Partidas</div>
          </div>
        </div>

        {leaderboard.map((entry) => (
          <div
            key={entry.userId}
            className="rounded-lg border border-purple-700 bg-purple-800/30 p-4 transition-colors hover:bg-purple-800/50"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 text-center">
                {entry.rank === 1 ? (
                  <div className="flex justify-center">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                  </div>
                ) : entry.rank === 2 ? (
                  <div className="flex justify-center">
                    <Medal className="h-6 w-6 text-gray-300" />
                  </div>
                ) : entry.rank === 3 ? (
                  <div className="flex justify-center">
                    <Medal className="h-6 w-6 text-amber-700" />
                  </div>
                ) : (
                  <span className="text-lg font-bold">{entry.rank}</span>
                )}
              </div>
              <div className="flex flex-1 items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-purple-700">
                  {entry.avatarUrl ? (
                    <Image
                      src={entry.avatarUrl || "/placeholder.svg"}
                      alt={entry.username}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-purple-800 text-sm font-bold text-white">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-medium">{entry.username}</span>
              </div>
              <div className="w-24 text-right font-bold text-yellow-400">{entry.score.toLocaleString()}</div>
              <div className="w-24 text-right text-gray-300">{entry.gamesPlayed}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }
}
