/**
 * Feature flags for the application
 * This file controls which features are enabled or disabled
 */

export const FEATURES = {
  // Multiplayer game mode with WebRTC support
  MULTIPLAYER_ENABLED: false,
  
  // Game room mode with WebRTC
  GAME_ROOM_ENABLED: false,
  
  // Single player mode (always enabled)
  SINGLE_PLAYER_ENABLED: true,
} as const

export type FeatureFlags = typeof FEATURES

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURES[feature] === true
}
