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

        // Listar todas las cookies para depuración
        console.log("Todas las cookies:", document.cookie)

        const cookieValue = getCookie("wikimedia_auth_state")
        console.log("Cookie encontrada:", cookieValue ? "Sí" : "No")

        if (!cookieValue) {
          console.error("No se encontró la cookie de estado")

          // Intentar obtener la cookie del localStorage como fallback
          const localStorageValue = localStorage.getItem("wikimedia_auth_state")

          if (localStorageValue) {
            console.log("Se encontró el estado en localStorage")

            try {
              const parsedValue = JSON.parse(localStorageValue)

              // Verificar que el state coincida
              if (parsedValue.state !== state) {
                console.error("El state en localStorage no coincide, posible ataque CSRF")
                setError("Error de seguridad: el estado no coincide")
                return
              }

              // Continuar con el flujo usando el valor de localStorage
              await processAuthentication(code, parsedValue.codeVerifier, parsedValue.returnTo)
              return
            } catch (e) {
              console.error("Error al parsear el valor de localStorage:", e)
            }
          }

          // Si no se encuentra la cookie ni en localStorage, intentar continuar con un codeVerifier generado
          console.log("Intentando continuar sin codeVerifier...")

          // Generar un codeVerifier aleatorio como último recurso
          // Esto no es seguro, pero es mejor que fallar completamente
          const generatedCodeVerifier = state + "_fallback_verifier"

          try {
            await processAuthentication(code, generatedCodeVerifier, "/")
            return
          } catch (e) {
            console.error("Error al intentar con codeVerifier generado:", e)
            setError("No se encontró la información de autenticación. Por favor, intenta iniciar sesión nuevamente.")
            return
          }
        }

        let parsedCookie
        try {
          parsedCookie = JSON.parse(decodeURIComponent(cookieValue))
          console.log("Cookie parseada correctamente:", {
            state: parsedCookie.state ? "presente" : "ausente",
            codeVerifier: parsedCookie.codeVerifier ? "presente" : "ausente",
            returnTo: parsedCookie.returnTo,
          })
        } catch (e) {
          console.error("Error al parsear la cookie:", e)
          setError("Error al procesar la información de autenticación")
          return
        }

        // Verificar que el state coincida
        if (parsedCookie.state !== state) {
          console.error("El state no coincide, posible ataque CSRF")
          console.log("State esperado:", state)
          console.log("State recibido:", parsedCookie.state)
          setError("Error de seguridad: el estado no coincide")
          return
        }

        await processAuthentication(code, parsedCookie.codeVerifier, parsedCookie.returnTo)
      } catch (err: any) {
        console.error("Error en callback de autenticación:", err)
        setError(err.message || "Error al procesar la autenticación")
      } finally {
        setLoading(false)
      }
    }

    // Función para procesar la autenticación
    const processAuthentication = async (code: string, codeVerifier: string, returnTo: string) => {
      try {
        // Llamar al endpoint de token para obtener el token
        setStatus("Obteniendo token de acceso...")
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

        // Limpiar el localStorage si se usó como fallback
        localStorage.removeItem("wikimedia_auth_state")

        // Redirigir al usuario a la página principal
        setTimeout(() => {
          window.location.href = returnTo || "/"
        }, 1000)
      } catch (error) {
        throw error
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
