"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const code = searchParams.get("code")
      const state = searchParams.get("state")
      const errParam = searchParams.get("error")

      console.log("Callback params:", { code, state, errParam })

      if (errParam) {
        setError(`OAuth error: ${errParam}`)
        setLoading(false)
        return
      }

      if (!code) {
        setError("No se recibió código de autorización")
        setLoading(false)
        return
      }

      const savedState = sessionStorage.getItem("oauth_state")
      const codeVerifier = sessionStorage.getItem("code_verifier")

      console.log("SessionStorage:", { savedState, codeVerifier })

      if (!savedState || !codeVerifier) {
        setError("No se encontró el estado o codeVerifier en sessionStorage")
        setLoading(false)
        return
      }

      if (state !== savedState) {
        setError("Estado de autenticación inválido")
        setLoading(false)
        return
      }

      try {
        const res = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, codeVerifier }),
        })

        if (!res.ok) {
          const errJson = await res.json()
          throw new Error(errJson.error || "Error al obtener token")
        }

        // Limpieza solo después de éxito
        sessionStorage.removeItem("oauth_state")
        sessionStorage.removeItem("code_verifier")

        router.push("/")
      } catch (e: any) {
        setError(e.message || "Error en intercambio de token")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [searchParams, router])

  if (error)
    return <div>Error de autenticación: {error}</div>

  if (loading)
    return <div>Cargando...</div>

  return null
}
