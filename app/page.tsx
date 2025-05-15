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
      <header className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          <span className="text-yellow-400">Wiki</span>Millionaire
          <span className="relative top-[-1px] bg-indigo-100 text-indigo-800 text-sm font-medium ms-2 px-3 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
            Beta
          </span>
        </h1>

        <div className="flex items-center gap-4">
          <LanguageSelector currentLocale={locale} onLocaleChange={changeLocale} />

          {!user && <WikimediaLoginButton t={t} />}

          {user && (
            <p className="text-yellow-400 font-semibold">
              {t.home.welcome}, <span className="capitalize">{user.username}</span>
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center gap-8 text-center max-w-3xl">
        <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          <span className="text-yellow-400">Wiki</span>Millionaire
        </h2>

        <p className="text-lg text-gray-200 md:text-xl">
          {t.home.tagline} {t.home.description}
        </p>

        {user && (
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              asChild
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
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
        )}
      </main>

      <footer className="border-t border-purple-700 bg-purple-900/50 py-6">
        <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:flex-row max-w-4xl">
          <p className="text-center text-sm text-gray-300 md:text-left">
            <span className="block md:inline">© 2025 WikiMillionaire. </span>
            <span className="block md:inline">{t.general.credits}</span>
          </p>
          <nav className="flex gap-6">
            <Link
              href="/about"
              className="text-sm text-gray-300 hover:text-yellow-400 transition-colors"
            >
              {t.general.about}
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-300 hover:text-yellow-400 transition-colors"
            >
              {t.general.privacy}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-300 hover:text-yellow-400 transition-colors"
            >
              {t.general.terms}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
