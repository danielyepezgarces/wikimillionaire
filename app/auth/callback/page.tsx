"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// With next-auth, the callback is handled automatically at /api/auth/callback/wikimedia
// This page is kept for backward compatibility and redirects to home
export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page after a short delay
    const timer = setTimeout(() => {
      router.push("/")
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
      <div className="w-full max-w-md rounded-lg border border-purple-700 bg-purple-900/70 p-6 text-white">
        <h1 className="mb-4 text-xl font-bold">Autenticación completada</h1>
        <p className="mb-4 text-gray-300">Redirigiendo a la página principal...</p>
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      </div>
    </div>
  )
}
