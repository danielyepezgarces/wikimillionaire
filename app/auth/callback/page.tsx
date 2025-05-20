"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

// Envolver el componente principal en un Suspense
export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Procesando autenticación...</div>}>
      <CallbackContent />
    </Suspense>
  )
}

// Componente que contiene el contenido real de la página
function CallbackContent() {
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

        setStatus("Verificando estado de autenticación...")

        // Obtener el estado y codeVerifier de localStorage
        const savedState = localStorage.getItem("wikimillionaire_oauth_state")
        const codeVerifier = localStorage.getItem("wikimillionaire_oauth_code_verifier")
        const timestamp = localStorage.getItem("wikimillionaire_oauth_timestamp")

        // console.log("Estado guardado:", savedState)
        // console.log("Estado recibido:", state)
        // console.log("CodeVerifier guardado:", codeVerifier ? "Presente" : "Ausente")

        // Verificar que el estado coincida
        if (!savedState || savedState !== state) {
          console.error("El estado no coincide o no se encontró")
          // console.log("Estado guardado:", savedState)
          // console.log("Estado recibido:", state)
          setError("Error de seguridad: el estado no coincide")
          return
        }

        // Verificar que el codeVerifier exista
        if (!codeVerifier) {
          console.error("No se encontró el codeVerifier")
          setError("Error de autenticación: falta información necesaria")
          return
        }

        // Verificar que no haya expirado (30 minutos)
        if (timestamp) {
          const elapsed = Date.now() - Number.parseInt(timestamp)
          if (elapsed > 30 * 60 * 1000) {
            // 30 minutos
            console.error("El estado ha expirado")
            setError("Error de autenticación: el proceso ha expirado, intente nuevamente")
            return
          }
        }

        setStatus("Procesando autenticación...")

        // Llamar a la función login del contexto
        await login(code, codeVerifier)

        // Limpiar localStorage después de un login exitoso
        localStorage.removeItem("wikimillionaire_oauth_state")
        localStorage.removeItem("wikimillionaire_oauth_code_verifier")
        localStorage.removeItem("wikimillionaire_oauth_timestamp")

        setStatus("Autenticación exitosa, redirigiendo...")

        // Redirigir al usuario a la página principal
        setTimeout(() => {
          router.push("/")
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
            onClick={() => {
              // Limpiar localStorage antes de intentar nuevamente
              localStorage.removeItem("wikimillionaire_oauth_state")
              localStorage.removeItem("wikimillionaire_oauth_code_verifier")
              localStorage.removeItem("wikimillionaire_oauth_timestamp")

              // Redirigir al inicio de sesión
              window.location.href = "/"
            }}
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
        <p className="mb-4 text-gray-300">{status}</p>
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      </div>
    </div>
  )
}
