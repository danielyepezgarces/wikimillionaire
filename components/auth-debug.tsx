"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"

export function AuthDebug() {
  const { user, loading, error, refreshUser } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full opacity-50 hover:opacity-100"
      >
        Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md overflow-auto max-h-96">
      <div className="flex justify-between mb-2">
        <h3 className="font-bold">Auth Debug</h3>
        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-gray-400">Loading: {loading ? "true" : "false"}</p>
          <p className="text-gray-400">Error: {error || "none"}</p>
        </div>
        <div>
          <p className="font-bold">User:</p>
          {user ? (
            <pre className="text-xs overflow-auto bg-gray-900 p-2 rounded">{JSON.stringify(user, null, 2)}</pre>
          ) : (
            <p className="text-gray-400">No user</p>
          )}
        </div>
        <button onClick={() => refreshUser()} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
          Refresh User
        </button>
        <button
          onClick={() => {
            // Mostrar todas las cookies
            console.log("Cookies:", document.cookie)
            alert("Cookies: " + document.cookie)
          }}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 ml-2"
        >
          Show Cookies
        </button>
      </div>
    </div>
  )
}
