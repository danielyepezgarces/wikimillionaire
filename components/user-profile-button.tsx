"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function UserProfileButton() {
  const router = useRouter()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    try {
      router.push("/profile")
    } catch (error) {
      console.error("Error al navegar al perfil:", error)
      setError("Error al navegar al perfil")
    }
  }

  if (!user) return null

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-white border-purple-700 hover:bg-purple-800 hover:text-white"
      onClick={handleClick}
    >
      <User className="h-4 w-4 mr-2" />
      <span>Perfil</span>
    </Button>
  )
}
