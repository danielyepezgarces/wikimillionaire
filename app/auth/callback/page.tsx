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
        // Llamar al backend para validar state y obtener token
        const res = await fetch(`/api/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error en autenticación");
        }

        // Si todo ok, redirigir al home o dashboard
        router.push("/");
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
