"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"
import { LanguageSelector } from "@/components/language-selector"
import { WikimediaLoginButton } from "@/components/wikimedia-login-button"
import { useLocale } from "@/hooks/use-locale"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { locale, translations: t, changeLocale } = useLocale()
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-900 to-indigo-950">
      <header className="container py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight text-white">
            <span className="text-yellow-400">Wiki</span>Millionaire
            <span className="relative top-[-1px] bg-indigo-100 text-indigo-800 text-sm font-medium me-2 ml-1 px-3 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector currentLocale={locale} onLocaleChange={changeLocale} />
            <WikimediaLoginButton t={t} />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              <span className="text-yellow-400">Wiki</span>Millionaire
            </h1>
            <p className="max-w-[700px] text-lg text-gray-200 md:text-xl">
              {t.home.tagline} {t.home.description}
            </p>
            {user && <p className="text-yellow-400">¡Bienvenido, {user.username}!</p>}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                <Link href="/play">{t.general.play}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
              >
                <Link href="/leaderboard">
                  <Trophy className="mr-2 h-5 w-5" />
                  {t.general.leaderboard}
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:max-w-5xl">
            <div className="flex flex-col items-center space-y-2 rounded-lg border border-purple-700 bg-purple-800/50 p-6 text-center shadow-lg">
              <div className="rounded-full bg-yellow-500 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-black"
                >
                  <path d="M12 22v-5" />
                  <path d="M9 8V2" />
                  <path d="M15 8V2" />
                  <path d="M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M12 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M12 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">{t.home.features.wikidata.title}</h3>
              <p className="text-gray-300">{t.home.features.wikidata.description}</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border border-purple-700 bg-purple-800/50 p-6 text-center shadow-lg">
              <div className="rounded-full bg-yellow-500 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-black"
                >
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">{t.home.features.dailyContest.title}</h3>
              <p className="text-gray-300">{t.home.features.dailyContest.description}</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border border-purple-700 bg-purple-800/50 p-6 text-center shadow-lg">
              <div className="rounded-full bg-yellow-500 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-black"
                >
                  <path d="M8 21h8" />
                  <path d="M12 21v-5" />
                  <path d="M12 3v5" />
                  <path d="M16.2 10.2 12 16l-4.2-5.8" />
                  <path d="M18 8H6a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">{t.home.features.leaderboard.title}</h3>
              <p className="text-gray-300">{t.home.features.leaderboard.description}</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-purple-700 bg-purple-900/50 py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-gray-300 md:text-left">
            <span className="block md:inline">© 2025 WikiMillionaire. </span>
            <span className="block md:inline">{t.general.credits}</span>
          </p>
          <div className="flex gap-4">
            <Link href="/about" className="text-sm text-gray-300 hover:text-yellow-400">
              {t.general.about}
            </Link>
            <Link href="/privacy" className="text-sm text-gray-300 hover:text-yellow-400">
              {t.general.privacy}
            </Link>
            <Link href="/terms" className="text-sm text-gray-300 hover:text-yellow-400">
              {t.general.terms}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
