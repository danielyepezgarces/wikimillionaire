"use client"

import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import type { Translations } from "@/lib/i18n"

interface LoginButtonProps {
  t: Translations
}

export function LoginButton({ t }: LoginButtonProps) {
  const handleLogin = () => {
    // Redirigir directamente al endpoint de Wikimedia
    window.location.href = "/api/auth/wikimedia"
  }

  return (
    <Button onClick={handleLogin} className="bg-yellow-500 text-black hover:bg-yellow-600">
      <LogIn className="mr-2 h-4 w-4" />
      {t.auth.login}
    </Button>
  )
}
