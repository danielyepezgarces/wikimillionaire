"use client"

import { useState } from "react"
import { Globe } from "lucide-react"
import { type Locale, availableLocales, getLanguageName } from "@/lib/i18n"

interface LanguageSelectorProps {
  currentLocale: Locale
  onLocaleChange: (locale: Locale) => void
}

export function LanguageSelector({ currentLocale, onLocaleChange }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-700 text-white hover:bg-purple-800/50"
        aria-label="Seleccionar idioma"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 rounded-md bg-purple-900 shadow-lg ring-1 ring-purple-700">
          <div className="py-1">
            {availableLocales.map((locale) => (
              <button
                key={locale}
                onClick={() => {
                  onLocaleChange(locale)
                  setOpen(false)
                }}
                className={`block w-full px-4 py-2 text-left text-sm ${
                  locale === currentLocale
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "text-white hover:bg-purple-800"
                }`}
              >
                {getLanguageName(locale)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
