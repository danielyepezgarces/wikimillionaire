"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>("Iniciando proceso de autenticación...")
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

        setStatus("Obteniendo token de acceso...")
        console.log("Obteniendo token desde el endpoint de callback...")

        // Obtener la cookie con el codeVerifier
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) {
            const cookieValue = parts.pop()?.split(";").shift()
            return cookieValue
          }
          return null
        }

        const cookieValue = getCookie("wikimedia_auth_state")
        console.log("Cookie encontrada:", cookieValue ? "Sí" : "No")

        if (!cookieValue) {
          console.error("No se encontró la cookie de estado")
          setError("No se encontró la información de autenticación. Por favor, intenta iniciar sesión nuevamente.")
          return
        }

        let parsedCookie
        try {
          parsedCookie = JSON.parse(decodeURIComponent(cookieValue))
        } catch (e) {
          console.error("Error al parsear la cookie:", e)
          setError("Error al procesar la información de autenticación")
          return
        }

        // Verificar que el state coincida
        if (parsedCookie.state !== state) {
          console.error("El state no coincide, posible ataque CSRF")
          setError("Error de seguridad: el estado no coincide")
          return
        }

        // Llamar al endpoint de token para obtener el token
        const tokenResponse = await fetch("/api/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            codeVerifier: parsedCookie.codeVerifier,
          }),
        })

        if (!tokenResponse.ok) {
          let errorMsg = "Error al obtener el token"
          try {
            const data = await tokenResponse.json()
            errorMsg = data.error || errorMsg
          } catch {
            // No hay JSON en respuesta
          }
          throw new Error(errorMsg)
        }

        const tokenData = await tokenResponse.json()
        console.log("Token obtenido correctamente")

        setStatus("Obteniendo información del usuario...")

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
          let errorMsg = "Error al obtener información del usuario"
          try {
            const data = await userInfoResponse.json()
            errorMsg = data.error || errorMsg
          } catch {
            // No hay JSON en respuesta
          }
          throw new Error(errorMsg)
        }

        const userData = await userInfoResponse.json()
        console.log("Usuario autenticado correctamente")

        setStatus("Redirigiendo...")

        // Redirigir al usuario a la página principal
        setTimeout(() => {
          window.location.href = parsedCookie.returnTo || "/"
        }, 1000)
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
          <p className="mb-4 text-gray-300">{status}</p>
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
          <p className="mt-4 text-sm text-gray-400">Por favor, intenta iniciar sesión nuevamente.</p>
          <button
            onClick={() => (window.location.href = "/api/auth/wikimedia")}
            className="mt-4 w-full rounded-md bg-yellow-500 py-2 text-black hover:bg-yellow-600"
          >
            Iniciar sesión con Wikimedia
          </button>
          <button
            onClick={() => router.push("/")}
            className="mt-2 w-full rounded-md border border-purple-700 bg-transparent py-2 text-white hover:bg-purple-800/50"
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
        <p className="mb-4 text-gray-300">{status}</p>
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      </div>
    </div>
  )
}
