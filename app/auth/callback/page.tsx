"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { login } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true)

        // Obtener parámetros de la URL
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const errorParam = searchParams.get("error")

        // Verificar si hay error
        if (errorParam) {
          console.error("Error en callback de OAuth:", errorParam)
          setError(`Error de autenticación: ${errorParam}`)
          return
        }

        // Verificar si hay código
        if (!code || !state) {
          setError("No se recibieron parámetros necesarios")
          return
        }

        console.log("Obteniendo token desde el endpoint de callback...")

        // Llamar al endpoint de callback para obtener el token
        const res = await fetch(
          `/api/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
        )

        if (!res.ok) {
          let errorMsg = "Error en autenticación"
          try {
            const data = await res.json()
            errorMsg = data.error || errorMsg
          } catch {
            // No hay JSON en respuesta
          }
          throw new Error(errorMsg)
        }

        const data = await res.json()
        console.log("Token obtenido, procesando autenticación...")

        // Obtener información del usuario
        const userInfoResponse = await fetch("/api/auth/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken: data.accessToken,
          }),
        })

        if (!userInfoResponse.ok) {
          const errorData = await userInfoResponse.json()
          throw new Error(errorData.error || "Error al obtener información del usuario")
        }

        const userData = await userInfoResponse.json()
        console.log("Usuario autenticado correctamente")

        // Redirigir al usuario a la página principal
        router.push(data.returnTo || "/")
      } catch (err: any) {
        console.error("Error en callback de autenticación:", err)
        setError(err.message || "Error al procesar la autenticación")
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [searchParams, router, login])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
        <div className="w-full max-w-md rounded-lg border border-purple-700 bg-purple-900/70 p-6 text-white">
          <h1 className="mb-4 text-xl font-bold">Iniciando sesión...</h1>
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
        <div className="w-full max-w-md rounded-lg border border-purple-700 bg-purple-900/70 p-6 text-white">
          <h1 className="mb-4 text-xl font-bold text-red-400">Error de autenticación</h1>
          <p className="text-gray-300">{error}</p>
          <p className="mt-4 text-sm text-gray-400">
            Por favor, intenta iniciar sesión nuevamente. Si el problema persiste, contacta al administrador.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 w-full rounded-md bg-yellow-500 py-2 text-black hover:bg-yellow-600"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
      <div className="w-full max-w-md rounded-lg border border-purple-700 bg-purple-900/70 p-6 text-white">
        <h1 className="mb-4 text-xl font-bold">Iniciando sesión...</h1>
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      </div>
    </div>
  )
}
