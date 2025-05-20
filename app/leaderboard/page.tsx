"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getLeaderboard } from "@/lib/scores"
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { LanguageSelector } from "@/components/language-selector"
import { WikimediaLoginButton } from "@/components/wikimedia-login-button"
import { useAuth } from "@/contexts/auth-context"

type LeaderboardEntry = {
  id: string
  username: string
  score: number
  date: string
  avatar_url?: string | null
}

export default function LeaderboardPage() {
  const { locale, translations: t, changeLocale } = useLocale()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("daily")
  const [leaderboard, setLeaderboard] = useState<{
    daily: LeaderboardEntry[]
    weekly: LeaderboardEntry[]
    monthly: LeaderboardEntry[]
  }>({
    daily: [],
    weekly: [],
    monthly: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const data = await getLeaderboard()
        setLeaderboard(data)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        // Fallback a datos locales si falla
        const localData = await getLocalLeaderboard()
        setLeaderboard(localData)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  // Función para obtener datos de clasificación de localStorage (fallback)
  const getLocalLeaderboard = async () => {
    try {
      const scoresJson = localStorage.getItem("wikimillionaire-scores")
      const scores: any[] = scoresJson ? JSON.parse(scoresJson) : []

      // Obtener la fecha actual
      const now = new Date()

      // Filtrar puntuaciones para cada período
      const daily = scores.filter((score) => {
        const scoreDate = new Date(score.date)
        return scoreDate.toDateString() === now.toDateString()
      })

      const weekly = scores.filter((score) => {
        const scoreDate = new Date(score.date)
        const dayDiff = Math.floor((now.getTime() - scoreDate.getTime()) / (1000 * 60 * 60 * 24))
        return dayDiff < 7
      })

      const monthly = scores.filter((score) => {
        const scoreDate = new Date(score.date)
        return scoreDate.getMonth() === now.getMonth() && scoreDate.getFullYear() === now.getFullYear()
      })

      // Ordenar puntuaciones de mayor a menor
      const sortByScore = (a: any, b: any) => b.score - a.score

      // Formatear los resultados
      const formatScores = (scores: any[]): LeaderboardEntry[] => {
        return scores.map((item) => ({
          id: item.id || Math.random().toString(36).substring(2, 9),
          username: item.username,
          score: item.score,
          date: item.date,
          avatar_url: null,
        }))
      }

      return {
        daily: daily.length > 0 ? formatScores(daily.sort(sortByScore)) : [],
        weekly: weekly.length > 0 ? formatScores(weekly.sort(sortByScore)) : [],
        monthly: monthly.length > 0 ? formatScores(monthly.sort(sortByScore)) : [],
      }
    } catch (error) {
      console.error("Error getting local leaderboard:", error)
      return {
        daily: [],
        weekly: [],
        monthly: [],
      }
    }
  }

  const renderLeaderboardTable = (entries: LeaderboardEntry[]) => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      )
    }

    if (entries.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <Trophy className="h-12 w-12 text-gray-400" />
          <p className="text-gray-400">{t.leaderboard.noData}</p>
          <Button asChild className="bg-yellow-500 text-black hover:bg-yellow-600">
            <Link href="/play">{t.general.play}</Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {entries.slice(0, 3).map((entry, index) => (
          <div
            key={index}
            className={`flex items-center justify-between rounded-lg border p-4 ${
              index === 0
                ? "border-yellow-500 bg-yellow-500/10"
                : index === 1
                  ? "border-gray-400 bg-gray-400/10"
                  : "border-amber-700 bg-amber-700/10"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  index === 0
                    ? "bg-yellow-500 text-black"
                    : index === 1
                      ? "bg-gray-400 text-black"
                      : "bg-amber-700 text-white"
                }`}
              >
                {index === 0 ? (
                  <Trophy className="h-5 w-5" />
                ) : index === 1 ? (
                  <Medal className="h-5 w-5" />
                ) : (
                  <Award className="h-5 w-5" />
                )}
              </div>
              <div className="flex items-center gap-3">
                {entry.avatar_url ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image
                      src={entry.avatar_url || "/placeholder.svg"}
                      alt={entry.username}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-purple-800">
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{entry.username}</p>
                  <p className="text-sm text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-yellow-400">{entry.score.toLocaleString()}</p>
              <p className="text-sm text-gray-400">{t.leaderboard.points}</p>
            </div>
          </div>
        ))}

        {entries.slice(3).map((entry, index) => (
          <div
            key={index + 3}
            className="flex items-center justify-between rounded-lg border border-purple-700 bg-purple-800/30 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-800 text-white">
                {index + 4}
              </div>
              <div className="flex items-center gap-3">
                {entry.avatar_url ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image
                      src={entry.avatar_url || "/placeholder.svg"}
                      alt={entry.username}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-purple-800">
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{entry.username}</p>
                  <p className="text-sm text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">{entry.score.toLocaleString()}</p>
              <p className="text-sm text-gray-400">{t.leaderboard.points}</p>
            </div>
          </div>
        ))}
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
              <Trophy className="h-6 w-6 text-yellow-400" />
              {t.leaderboard.title}
            </CardTitle>
            <CardDescription className="text-gray-300">{t.leaderboard.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-purple-800/50">
                <TabsTrigger value="daily" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                  {t.leaderboard.tabs.daily}
                </TabsTrigger>
                <TabsTrigger
                  value="weekly"
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                >
                  {t.leaderboard.tabs.weekly}
                </TabsTrigger>
                <TabsTrigger
                  value="monthly"
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                >
                  {t.leaderboard.tabs.monthly}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="daily" className="mt-6">
                {renderLeaderboardTable(leaderboard.daily)}
              </TabsContent>
              <TabsContent value="weekly" className="mt-6">
                {renderLeaderboardTable(leaderboard.weekly)}
              </TabsContent>
              <TabsContent value="monthly" className="mt-6">
                {renderLeaderboardTable(leaderboard.monthly)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 mb-6 flex justify-center">
          <Button asChild className="bg-yellow-500 text-black hover:bg-yellow-600">
            <Link href="/play">{t.general.play}</Link>
          </Button>
        </div>
      </div>

      <footer className="mt-auto border-t border-purple-700 bg-purple-900/50 py-4">
        <div className="container mx-auto">
          <p className="text-center text-sm text-gray-300">© 2025 WikiMillionaire. {t.general.credits}</p>
        </div>
      </footer>
    </div>
  )
}
