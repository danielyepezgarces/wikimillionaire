"use client"

import { useState, useEffect } from "react"
import { type Locale, getTranslations, type Translations } from "@/lib/i18n"

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("es")
  const [translations, setTranslations] = useState<Translations>(getTranslations("es"))

  useEffect(() => {
    // Intentar cargar el idioma guardado en localStorage
    const savedLocale = localStorage.getItem("wikimillionaire-locale") as Locale | null
    if (savedLocale && ["es", "en", "fr", "de", "pt"].includes(savedLocale)) {
      setLocale(savedLocale)
      setTranslations(getTranslations(savedLocale))
    }
  }, [])

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    setTranslations(getTranslations(newLocale))
    localStorage.setItem("wikimillionaire-locale", newLocale)
  }

  return {
    locale,
    translations,
    changeLocale,
  }
}
