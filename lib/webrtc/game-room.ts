/**
 * Game Room Manager
 * 
 * Manages multiplayer game rooms
 * This is a placeholder stub for future implementation
 */

import { GameRoom, Player, GameRoomSettings, GameMessage } from "./types"
import { getWebRTCManager } from "./connection"

export class GameRoomManager {
  private rooms: Map<string, GameRoom> = new Map()
  private currentRoomId: string | null = null

  constructor() {
    console.log("GameRoomManager initialized (stub)")
  }

  /**
   * Create a new game room
   * @param hostUsername Host player username
   * @param settings Game room settings
   * @returns Created game room
   */
  createRoom(hostUsername: string, settings: GameRoomSettings): GameRoom {
    // TODO: Implement room creation logic
    const roomId = `room-${Date.now()}`
    const hostId = `player-${Date.now()}`

    const host: Player = {
      id: hostId,
      username: hostUsername,
      isHost: true,
      isReady: false,
      score: 0,
      currentLevel: 0,
    }

    const room: GameRoom = {
      id: roomId,
      name: `${hostUsername}'s Room`,
      hostId,
      players: [host],
      maxPlayers: settings.maxPlayers,
      status: "waiting",
      createdAt: new Date(),
      settings,
    }

    this.rooms.set(roomId, room)
    this.currentRoomId = roomId
    console.log("Room created:", room)

    return room
  }

  /**
   * Join an existing game room
   * @param roomId Room ID to join
   * @param username Player username
   * @param password Optional room password
   * @returns Updated game room
   */
  async joinRoom(roomId: string, username: string, password?: string): Promise<GameRoom | null> {
    // TODO: Implement room joining logic
    const room = this.rooms.get(roomId)
    if (!room) {
      console.error("Room not found:", roomId)
      return null
    }

    if (room.players.length >= room.maxPlayers) {
      console.error("Room is full")
      return null
    }

    if (room.settings.isPrivate && room.settings.password !== password) {
      console.error("Invalid password")
      return null
    }

    const playerId = `player-${Date.now()}`
    const player: Player = {
      id: playerId,
      username,
      isHost: false,
      isReady: false,
      score: 0,
      currentLevel: 0,
    }

    room.players.push(player)
    this.currentRoomId = roomId
    console.log("Player joined room:", player, room)

    // Connect to room host via WebRTC
    const webrtc = getWebRTCManager()
    await webrtc.connectToPeer(room.hostId)

    return room
  }

  /**
   * Leave current game room
   */
  leaveRoom(): void {
    // TODO: Implement room leaving logic
    if (this.currentRoomId) {
      const room = this.rooms.get(this.currentRoomId)
      if (room) {
        console.log("Left room:", room.id)
      }
      this.currentRoomId = null

      // Cleanup WebRTC connections
      const webrtc = getWebRTCManager()
      webrtc.cleanup()
    }
  }

  /**
   * Start the game in current room
   */
  startGame(): void {
    // TODO: Implement game start logic
    if (this.currentRoomId) {
      const room = this.rooms.get(this.currentRoomId)
      if (room) {
        room.status = "in-progress"
        console.log("Game started in room:", room.id)

        // Broadcast start message to all players
        const webrtc = getWebRTCManager()
        const message: GameMessage = {
          type: "question",
          playerId: room.hostId,
          timestamp: new Date(),
          data: { action: "start" },
        }
        webrtc.broadcastMessage(message)
      }
    }
  }

  /**
   * Get current room
   * @returns Current game room or null
   */
  getCurrentRoom(): GameRoom | null {
    if (this.currentRoomId) {
      return this.rooms.get(this.currentRoomId) || null
    }
    return null
  }

  /**
   * Get all available rooms
   * @returns Array of public game rooms
   */
  getAvailableRooms(): GameRoom[] {
    // TODO: Implement room listing logic
    return Array.from(this.rooms.values()).filter(
      (room) => !room.settings.isPrivate && room.status === "waiting"
    )
  }

  /**
   * Update player ready status
   * @param playerId Player ID
   * @param isReady Ready status
   */
  setPlayerReady(playerId: string, isReady: boolean): void {
    // TODO: Implement ready status logic
    if (this.currentRoomId) {
      const room = this.rooms.get(this.currentRoomId)
      if (room) {
        const player = room.players.find((p) => p.id === playerId)
        if (player) {
          player.isReady = isReady
          console.log("Player ready status updated:", player)
        }
      }
    }
  }
}

// Singleton instance
let gameRoomManagerInstance: GameRoomManager | null = null

/**
 * Get Game Room Manager instance
 */
export function getGameRoomManager(): GameRoomManager {
  if (!gameRoomManagerInstance) {
    gameRoomManagerInstance = new GameRoomManager()
  }
  return gameRoomManagerInstance
}
