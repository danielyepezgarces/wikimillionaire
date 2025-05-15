"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getCookie } from "cookies-next"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
        if (!code) {
          setError("No se recibió código de autorización")
          return
        }

        // Obtener state y code_verifier de la cookie
        const authStateCookie = getCookie("wikimedia_auth_state")
        if (!authStateCookie) {
          setError("No se encontró el estado de autenticación")
          return
        }

        let authState
        try {
          authState = JSON.parse(authStateCookie as string)
        } catch (e) {
          setError("Error al procesar el estado de autenticación")
          return
        }

        const { state: savedState, codeVerifier } = authState

        // Verificar state para prevenir CSRF
        if (state !== savedState) {
          setError("Estado de autenticación inválido")
          return
        }

        // Intercambiar código por token
        const tokenResponse = await fetch("/api/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            codeVerifier,
          }),
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json()
          throw new Error(errorData.error || "Error al obtener el token")
        }

        const tokenData = await tokenResponse.json()

        // Obtener información del usuario
        const userInfoResponse = await fetch("/api/auth/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken: tokenData.access_token,
          }),
        })

        if (!userInfoResponse.ok) {
          const errorData = await userInfoResponse.json()
          throw new Error(errorData.error || "Error al obtener información del usuario")
        }

        // Redirigir al usuario a la página principal
        router.push("/")
      } catch (err: any) {
        console.error("Error en callback de autenticación:", err)
        setError(err.message || "Error al procesar la autenticación")
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [searchParams, router])

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
