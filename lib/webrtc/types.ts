/**
 * WebRTC Game Room Types
 * 
 * Type definitions for multiplayer game rooms using WebRTC
 * This is a placeholder for future implementation
 */

export interface GameRoom {
  id: string
  name: string
  hostId: string
  players: Player[]
  maxPlayers: number
  status: "waiting" | "in-progress" | "finished"
  createdAt: Date
  settings: GameRoomSettings
}

export interface Player {
  id: string
  username: string
  isHost: boolean
  isReady: boolean
  score: number
  currentLevel: number
}

export interface GameRoomSettings {
  maxPlayers: number
  difficulty: "easy" | "medium" | "hard" | "mixed"
  timePerQuestion: number
  questionsCount: number
  isPrivate: boolean
  password?: string
}

export interface WebRTCConnection {
  peerId: string
  connection: RTCPeerConnection | null
  dataChannel: RTCDataChannel | null
  status: "connecting" | "connected" | "disconnected" | "failed"
}

export interface GameMessage {
  type: "join" | "leave" | "ready" | "answer" | "question" | "score" | "chat"
  playerId: string
  timestamp: Date
  data: any
}
