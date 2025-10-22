"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Wifi, Globe } from "lucide-react"
import { Translations } from "@/lib/i18n"

interface ComingSoonProps {
  translations: Translations
}

export function ComingSoon({ translations }: ComingSoonProps) {
  const t = translations.multiplayer

  return (
    <div className="space-y-8">
      {/* Coming Soon Banner */}
      <div className="text-center">
        <Badge className="mb-4 bg-yellow-500 text-black hover:bg-yellow-600 text-lg px-4 py-2">
          {t.comingSoon}
        </Badge>
        <h2 className="text-3xl font-bold text-white mb-4">{t.title}</h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">{t.comingSoonDescription}</p>
      </div>

      {/* Features Preview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-purple-700 bg-purple-900/70 text-white">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
              <Wifi className="h-8 w-8 text-yellow-400" />
            </div>
            <CardTitle className="text-center">{t.features.webrtc.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center text-gray-300">
              {t.features.webrtc.description}
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-purple-700 bg-purple-900/70 text-white">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
              <Users className="h-8 w-8 text-yellow-400" />
            </div>
            <CardTitle className="text-center">{t.features.gameRoom.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center text-gray-300">
              {t.features.gameRoom.description}
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-purple-700 bg-purple-900/70 text-white">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
              <Globe className="h-8 w-8 text-yellow-400" />
            </div>
            <CardTitle className="text-center">{t.features.realtime.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center text-gray-300">
              {t.features.realtime.description}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Technical Info */}
      <Card className="border-purple-700 bg-purple-900/50 text-white">
        <CardHeader>
          <CardTitle className="text-center">Características Técnicas / Technical Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2">WebRTC Peer-to-Peer</h4>
              <p className="text-sm text-gray-300">
                Comunicación directa entre jugadores para mínima latencia
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2">Game Room System</h4>
              <p className="text-sm text-gray-300">
                Sistema de salas para organizar partidas entre amigos
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2">Real-time Sync</h4>
              <p className="text-sm text-gray-300">
                Sincronización en tiempo real de preguntas y respuestas
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2">Leaderboard Integration</h4>
              <p className="text-sm text-gray-300">
                Clasificación en vivo durante partidas multijugador
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
