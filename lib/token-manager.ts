import { sign, verify, JwtPayload } from 'jsonwebtoken'
import crypto from 'crypto'
import { User } from './auth'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key'
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d' // 7 days

/**
 * Token payload interface
 */
export interface TokenPayload extends JwtPayload {
  sub: string
  username: string
  wikimedia_id: string | null
  roles?: string[]
  type: 'access' | 'refresh'
}

/**
 * Generate access and refresh token pair
 */
export function generateTokenPair(user: User & { roles?: string[] }) {
  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: REFRESH_TOKEN_EXPIRY,
  }
}

/**
 * Generate an access token (short-lived)
 */
export function generateAccessToken(user: User & { roles?: string[] }): string {
  const payload = {
    sub: user.id.toString(),
    username: user.username,
    wikimedia_id: user.wikimedia_id,
    roles: user.roles || ['user'],
    type: 'access' as const,
  }

  return sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'wikimillionaire',
    audience: 'wikimillionaire-users',
  })
}

/**
 * Generate a refresh token (long-lived)
 */
export function generateRefreshToken(user: User & { roles?: string[] }): string {
  const payload = {
    sub: user.id.toString(),
    username: user.username,
    wikimedia_id: user.wikimedia_id,
    roles: user.roles || ['user'],
    type: 'refresh' as const,
  }

  return sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'wikimillionaire',
    audience: 'wikimillionaire-users',
  })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = verify(token, JWT_SECRET, {
      issuer: 'wikimillionaire',
      audience: 'wikimillionaire-users',
    }) as TokenPayload

    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Calculate token expiry date
 */
export function getTokenExpiryDate(expiry: string): Date {
  const expiryDate = new Date()
  
  // Parse expiry string (e.g., "15m", "7d", "1h")
  const match = expiry.match(/^(\d+)([smhd])$/)
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`)
  }

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case 's':
      expiryDate.setSeconds(expiryDate.getSeconds() + value)
      break
    case 'm':
      expiryDate.setMinutes(expiryDate.getMinutes() + value)
      break
    case 'h':
      expiryDate.setHours(expiryDate.getHours() + value)
      break
    case 'd':
      expiryDate.setDate(expiryDate.getDate() + value)
      break
  }

  return expiryDate
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}
