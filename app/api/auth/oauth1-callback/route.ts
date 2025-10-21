import { type NextRequest, NextResponse } from 'next/server'
import { createOAuth1Client, WIKIMEDIA_OAUTH1_ENDPOINTS } from '@/lib/oauth1-client'
import { createDatabaseProvider } from '@/lib/database-provider'
import { generateTokenPair, getTokenExpiryDate } from '@/lib/token-manager'
import jwt from 'jsonwebtoken'
import { getGravatarUrl } from '@/lib/gravatar'

/**
 * OAuth 1.0 Callback Handler for Wikimedia
 * Handles the OAuth callback, exchanges tokens, retrieves user info,
 * manages user creation/update, generates JWT tokens, and sets cookies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse OAuth tokens and verifier from callback
    const oauthToken = searchParams.get('oauth_token')
    const oauthVerifier = searchParams.get('oauth_verifier')
    
    if (!oauthToken || !oauthVerifier) {
      return redirectToError(request, 'Missing OAuth parameters')
    }

    console.log('[OAuth1 Callback] Processing callback with token:', oauthToken)

    // Retrieve the token secret from cookies (stored during initiation)
    const tokenSecret = request.cookies.get('oauth_token_secret')?.value
    
    if (!tokenSecret) {
      return redirectToError(request, 'Missing token secret. Please try logging in again.')
    }

    // Create OAuth client
    const oauth = createOAuth1Client()

    // Prepare request data for token exchange
    const requestData = {
      url: WIKIMEDIA_OAUTH1_ENDPOINTS.accessToken,
      method: 'POST',
    }

    // Exchange request token for access token
    const tokenData = {
      key: oauthToken,
      secret: tokenSecret,
    }

    // Sign the request
    const authHeader = oauth.toHeader(oauth.authorize(requestData, tokenData))
    
    console.log('[OAuth1 Callback] Exchanging request token for access token')

    // Make the POST request to exchange tokens
    const tokenResponse = await fetch(WIKIMEDIA_OAUTH1_ENDPOINTS.accessToken, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `oauth_verifier=${encodeURIComponent(oauthVerifier)}`,
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[OAuth1 Callback] Token exchange failed:', errorText)
      return redirectToError(request, 'Failed to exchange OAuth token')
    }

    // Parse the response
    const tokenResponseText = await tokenResponse.text()
    const accessTokenData = parseOAuthResponse(tokenResponseText)
    
    console.log('[OAuth1 Callback] Access token obtained successfully')

    // Retrieve user information using the access token
    const userInfo = await getUserInfo(oauth, {
      key: accessTokenData.oauth_token,
      secret: accessTokenData.oauth_token_secret,
    })

    if (!userInfo) {
      return redirectToError(request, 'Failed to retrieve user information')
    }

    console.log('[OAuth1 Callback] User info retrieved:', userInfo.username)

    // Initialize database provider
    const db = createDatabaseProvider()
    await db.initialize()

    // Process user (create or update)
    const user = await processUser(db, userInfo)

    console.log('[OAuth1 Callback] User processed, ID:', user.id)

    // Generate JWT token pair
    const { accessToken, refreshToken, refreshTokenExpiry } = generateTokenPair(user as any)

    // Store refresh token in database with metadata
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = getClientIP(request)
    
    await db.storeRefreshToken({
      user_id: user.id.toString(),
      token: refreshToken,
      expires_at: getTokenExpiryDate(refreshTokenExpiry),
      user_agent: userAgent,
      ip_address: ipAddress,
    })

    console.log('[OAuth1 Callback] Refresh token stored')

    // Get return URL from cookies or default to home
    const returnTo = request.cookies.get('oauth_return_to')?.value || '/'

    // Create response with redirect
    const response = NextResponse.redirect(new URL(returnTo, request.url))

    // Set cookies for authentication
    setCookies(response, {
      accessToken,
      refreshToken,
      sessionInfo: {
        userId: user.id.toString(),
        username: user.username,
      },
    })

    // Clean up temporary cookies
    response.cookies.delete('oauth_token_secret')
    response.cookies.delete('oauth_return_to')

    console.log('[OAuth1 Callback] Login successful, redirecting to:', returnTo)

    return response
  } catch (error: any) {
    console.error('[OAuth1 Callback] Error during callback processing:', error)
    return redirectToError(request, error.message || 'Internal server error')
  }
}

/**
 * Parse OAuth response in form-encoded format
 */
function parseOAuthResponse(response: string): Record<string, string> {
  const params = new URLSearchParams(response)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

/**
 * Get user information from Wikimedia OAuth identify endpoint
 */
async function getUserInfo(
  oauth: any,
  tokenData: { key: string; secret: string }
): Promise<{ sub: string; username: string; email?: string } | null> {
  try {
    const requestData = {
      url: WIKIMEDIA_OAUTH1_ENDPOINTS.identify,
      method: 'GET',
    }

    const authHeader = oauth.toHeader(oauth.authorize(requestData, tokenData))

    const response = await fetch(WIKIMEDIA_OAUTH1_ENDPOINTS.identify, {
      method: 'GET',
      headers: authHeader,
    })

    if (!response.ok) {
      console.error('[OAuth1 Callback] Failed to get user info:', response.status)
      return null
    }

    const responseText = await response.text()
    
    // The response is a JWT token, decode it
    const decoded = jwt.decode(responseText) as any
    
    return {
      sub: decoded.sub,
      username: decoded.username,
      email: decoded.email,
    }
  } catch (error) {
    console.error('[OAuth1 Callback] Error getting user info:', error)
    return null
  }
}

/**
 * Process user - create new user or update existing user
 */
async function processUser(db: any, userInfo: { sub: string; username: string; email?: string }) {
  // Check if user exists by Wikimedia ID
  let user = await db.getUserByWikimediaId(userInfo.sub)

  if (user) {
    // Update existing user
    user = await db.updateUser(user.id.toString(), {
      last_login: new Date(),
      email: userInfo.email || user.email,
      avatar_url: userInfo.email ? getGravatarUrl(userInfo.email) : user.avatar_url,
    })
  } else {
    // Create new user with default roles
    user = await db.createUser({
      username: userInfo.username,
      wikimedia_id: userInfo.sub,
      email: userInfo.email || null,
      avatar_url: userInfo.email ? getGravatarUrl(userInfo.email) : null,
      roles: ['user'], // Default role
    })
  }

  return user
}

/**
 * Set authentication cookies
 */
function setCookies(
  response: NextResponse,
  data: {
    accessToken: string
    refreshToken: string
    sessionInfo: { userId: string; username: string }
  }
) {
  const isProduction = process.env.NODE_ENV === 'production'
  const domain = process.env.COOKIE_DOMAIN

  // Access token cookie (short-lived)
  response.cookies.set('access_token', data.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
    ...(domain ? { domain } : {}),
  })

  // Refresh token cookie (long-lived)
  response.cookies.set('refresh_token', data.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
    ...(domain ? { domain } : {}),
  })

  // Session info cookie (for client-side access)
  response.cookies.set('session_info', JSON.stringify(data.sessionInfo), {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
    ...(domain ? { domain } : {}),
  })

  // Legacy auth_token cookie for backward compatibility
  response.cookies.set('auth_token', data.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
    ...(domain ? { domain } : {}),
  })
}

/**
 * Redirect to error page with message
 */
function redirectToError(request: NextRequest, message: string): NextResponse {
  const errorUrl = new URL('/auth/error', request.url)
  errorUrl.searchParams.set('error', message)
  
  return NextResponse.redirect(errorUrl)
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string | undefined {
  // Try various headers that might contain the client IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to connection remote address (might not be available in serverless)
  return undefined
}
