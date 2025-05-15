"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError(`Error de autenticación: ${errorParam}`);
        setLoading(false);
        return;
      }

      if (!code || !state) {
        setError("No se recibieron parámetros necesarios");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
        );

        if (!res.ok) {
          // Intentar leer el json del error, pero si está vacío, manejarlo
          let errorMsg = "Error en autenticación";
          try {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          } catch {
            // No hay JSON en respuesta
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();

        // Puedes guardar el token en localStorage, contexto, etc.
        localStorage.setItem("accessToken", data.accessToken);

        // Redirigir al returnTo o al home
        router.push(data.returnTo || "/");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (loading) return <div>Iniciando sesión...</div>;
  if (error) return <div>Error de autenticación: {error}</div>;

  return null;
}
