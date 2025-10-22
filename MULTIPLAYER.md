# Multiplayer Mode - Coming Soon

This document describes the multiplayer feature implementation for WikiMillionaire, currently in "Coming Soon" mode.

## Overview

The multiplayer mode allows players to compete in real-time using WebRTC technology. This feature is currently disabled and displays a "Coming Soon" screen to users.

## Feature Status

- **Status**: Coming Soon (Disabled)
- **Current State**: Placeholder/stub implementation
- **Technology**: WebRTC for peer-to-peer connections

## Configuration

The multiplayer feature is controlled by feature flags in `lib/config/features.ts`:

```typescript
export const FEATURES = {
  MULTIPLAYER_ENABLED: false,  // Main multiplayer toggle
  GAME_ROOM_ENABLED: false,    // Game room functionality
  SINGLE_PLAYER_ENABLED: true, // Always enabled
}
```

To enable multiplayer in the future, set `MULTIPLAYER_ENABLED` to `true`.

## Architecture

### Components

1. **Coming Soon Component** (`components/multiplayer/coming-soon.tsx`)
   - Displays the "Coming Soon" message
   - Shows planned features with icons
   - Lists technical capabilities

2. **Multiplayer Page** (`app/multiplayer/page.tsx`)
   - Main entry point for multiplayer
   - Conditionally renders Coming Soon or actual game interface
   - Integrates with i18n for multi-language support

### WebRTC Infrastructure (Placeholder)

The WebRTC implementation is currently stubbed out in `lib/webrtc/`:

1. **Types** (`types.ts`)
   - `GameRoom`: Room data structure
   - `Player`: Player information
   - `GameRoomSettings`: Configuration options
   - `WebRTCConnection`: Connection state
   - `GameMessage`: Message protocol

2. **Connection Manager** (`connection.ts`)
   - `WebRTCManager`: Manages peer connections
   - Methods for connecting, disconnecting, and messaging
   - Singleton pattern for global access

3. **Game Room Manager** (`game-room.ts`)
   - `GameRoomManager`: Manages game rooms
   - Methods for creating, joining, and leaving rooms
   - Room state management

## Translations

Multiplayer strings are available in 5 languages (Spanish, English, French, German, Portuguese):

```typescript
multiplayer: {
  title: string
  description: string
  comingSoon: string
  comingSoonDescription: string
  features: {
    webrtc: { title, description }
    gameRoom: { title, description }
    realtime: { title, description }
  }
}
```

## Testing

Tests are located in `lib/__tests__/multiplayer.test.ts` and verify:

- Feature flags are correctly configured
- Coming Soon mode displays when multiplayer is disabled
- WebRTC placeholders are properly structured
- Translations exist for all languages

## Future Implementation

When implementing the full multiplayer feature:

1. Set `MULTIPLAYER_ENABLED: true` in `lib/config/features.ts`
2. Implement actual WebRTC connection logic in `lib/webrtc/connection.ts`
3. Implement room management in `lib/webrtc/game-room.ts`
4. Create the actual multiplayer game interface
5. Add signaling server for WebRTC connections
6. Implement real-time question synchronization
7. Add live leaderboards during matches

## Planned Features

- **WebRTC Peer-to-Peer**: Direct communication between players for minimal latency
- **Game Rooms**: Create or join private rooms with friends
- **Real-time Sync**: Synchronized questions and answers across all players
- **Leaderboard Integration**: Live rankings during multiplayer matches

## User Experience

When multiplayer is disabled (current state):
1. User clicks "Multiplayer" button on home page
2. Navigates to `/multiplayer` page
3. Sees "Coming Soon" badge and description
4. Views planned features in three cards
5. Sees technical features listed below

When multiplayer is enabled (future):
1. User clicks "Multiplayer" button on home page
2. Navigates to `/multiplayer` page
3. Sees options to create or join a room
4. Can configure room settings
5. Plays synchronized game with other players

## Security Considerations

- WebRTC connections are peer-to-peer, reducing server load
- Room passwords for private games (when implemented)
- Input validation for all user-provided data
- Rate limiting for room creation
- No sensitive data transmitted via WebRTC data channels

## Performance

- Lazy loading of WebRTC dependencies
- Singleton pattern for managers to reduce memory usage
- Minimal overhead when feature is disabled
- Preloading strategy can be implemented for active rooms
