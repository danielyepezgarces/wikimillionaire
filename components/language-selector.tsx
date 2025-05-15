"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { type Locale, availableLocales, getLanguageName } from "@/lib/i18n"

interface LanguageSelectorProps {
  currentLocale: Locale
  onLocaleChange: (locale: Locale) => void
}

export function LanguageSelector({ currentLocale, onLocaleChange }: LanguageSelectorProps) {
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-purple-700">
        <Globe className="h-4 w-4" />
        <span className="sr-only">Seleccionar idioma</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-purple-700 text-white hover:bg-purple-800/50 hover:text-white"
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">Seleccionar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-purple-900 border-purple-700">
        {availableLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            className={`cursor-pointer ${
              locale === currentLocale
                ? "bg-yellow-500/20 text-yellow-400"
                : "text-white hover:bg-purple-800 hover:text-white"
            }`}
            onClick={() => onLocaleChange(locale)}
          >
            {getLanguageName(locale)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
