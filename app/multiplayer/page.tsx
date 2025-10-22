"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { LanguageSelector } from "@/components/language-selector"
import { WikimediaLoginButton } from "@/components/wikimedia-login-button"
import { ComingSoon } from "@/components/multiplayer/coming-soon"
import { isFeatureEnabled } from "@/lib/config/features"

export default function MultiplayerPage() {
  const { locale, translations: t, changeLocale } = useLocale()
  const [isClient, setIsClient] = useState(false)
  const isMultiplayerEnabled = isFeatureEnabled("MULTIPLAYER_ENABLED")

  useEffect(() => {
    setIsClient(true)
  }, [])

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

      {/* Main Content */}
      <main className="container mx-auto flex flex-1 flex-col px-4 py-12">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="border-purple-700 text-white hover:bg-purple-800/50">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.game.backToHome}
            </Button>
          </Link>
        </div>

        {isMultiplayerEnabled ? (
          // When multiplayer is enabled, show the actual game interface
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">{t.multiplayer.title}</h1>
            <p className="text-xl text-gray-300">{t.multiplayer.description}</p>
            {/* TODO: Add actual multiplayer game interface here */}
          </div>
        ) : (
          // When multiplayer is disabled, show Coming Soon screen
          <ComingSoon translations={t} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-700 bg-purple-900/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">© 2025 WikiMillionaire. {t.general.credits}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
