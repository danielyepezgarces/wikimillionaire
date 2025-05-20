"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Trophy, Brain, Users } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { LanguageSelector } from "@/components/language-selector"
import { WikimediaLoginButton } from "@/components/wikimedia-login-button"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { locale, translations: t, changeLocale } = useLocale()
  const { user } = useAuth()
  const [showFeatures, setShowFeatures] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const timer = setTimeout(() => {
      setShowFeatures(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleNavigation = (destination: string) => {
    if (isClient) {
      window.location.href = destination
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-900 to-indigo-950">
      {/* Header */}
      <header className="container mx-auto flex items-center justify-between p-4">
        <div className="text-2xl font-bold text-white">
          <span className="text-yellow-400">Wiki</span>Millionaire
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector currentLocale={locale} onLocaleChange={changeLocale} />
          <WikimediaLoginButton t={t} />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
          <span className="text-yellow-400">Wiki</span>Millionaire
        </h1>
        <p className="mb-8 max-w-2xl text-xl text-gray-300">
          {t.home.tagline} {t.home.description}
        </p>

        <div className="mb-12 flex flex-col gap-4 sm:flex-row">
          <Button
            size="lg"
            className="bg-yellow-500 text-black hover:bg-yellow-600"
            onClick={() => handleNavigation("/play")}
          >
            {t.general.play}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-purple-700 text-white hover:bg-purple-800/50"
            onClick={() => handleNavigation("/leaderboard")}
          >
            <Trophy className="mr-2 h-5 w-5" />
            {t.leaderboard.title}
          </Button>
        </div>

        {/* Features */}
        <div
          className={`grid gap-8 transition-all duration-1000 ease-out md:grid-cols-3 ${
            showFeatures ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="rounded-lg border border-purple-700 bg-purple-900/50 p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
              <Brain className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">{t.home.features.wikidata.title}</h3>
            <p className="text-gray-300">{t.home.features.wikidata.description}</p>
          </div>

          <div className="rounded-lg border border-purple-700 bg-purple-900/50 p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-yellow-400"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">{t.home.features.dailyContest.title}</h3>
            <p className="text-gray-300">{t.home.features.dailyContest.description}</p>
          </div>

          <div className="rounded-lg border border-purple-700 bg-purple-900/50 p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
              <Users className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">{t.home.features.leaderboard.title}</h3>
            <p className="text-gray-300">{t.home.features.leaderboard.description}</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-700 bg-purple-900/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">© 2025 WikiMillionaire. {t.general.credits}</p>
            </div>
            <div className="flex gap-6">
              <button
                onClick={() => handleNavigation("/about")}
                className="text-sm text-gray-400 hover:text-white"
              >
                {t.general.about}
              </button>
              <button
                onClick={() => handleNavigation("/privacy")}
                className="text-sm text-gray-400 hover:text-white"
              >
                {t.general.privacy}
              </button>
              <button
                onClick={() => handleNavigation("/terms")}
                className="text-sm text-gray-400 hover:text-white"
              >
                {t.general.terms}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}