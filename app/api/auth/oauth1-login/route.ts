import { type NextRequest, NextResponse } from 'next/server'
import { createOAuth1Client, WIKIMEDIA_OAUTH1_ENDPOINTS } from '@/lib/oauth1-client'

/**
 * OAuth 1.0 Login Initiation Handler
 * Initiates the OAuth 1.0 flow by requesting a request token
 * and redirecting the user to Wikimedia for authorization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const returnTo = searchParams.get('returnTo') || '/'

    console.log('[OAuth1 Login] Initiating OAuth 1.0 flow')

    // Create OAuth client
    const oauth = createOAuth1Client()

    // Build callback URL
    const callbackUrl = new URL('/api/auth/oauth1-callback', request.url).toString()

    // Prepare request data for getting request token
    const requestData = {
      url: WIKIMEDIA_OAUTH1_ENDPOINTS.requestToken,
      method: 'POST',
    }

    // Add callback parameter
    const requestParams = {
      oauth_callback: callbackUrl,
    }

    // Sign the request
    const authHeader = oauth.toHeader(oauth.authorize(requestData, undefined))

    console.log('[OAuth1 Login] Requesting request token from Wikimedia')

    // Request the request token
    const response = await fetch(WIKIMEDIA_OAUTH1_ENDPOINTS.requestToken, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestParams).toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[OAuth1 Login] Failed to get request token:', errorText)
      return NextResponse.json(
        { error: 'Failed to initiate OAuth flow' },
        { status: response.status }
      )
    }

    // Parse the response
    const responseText = await response.text()
    const tokenData = parseOAuthResponse(responseText)

    if (!tokenData.oauth_token || !tokenData.oauth_token_secret) {
      console.error('[OAuth1 Login] Invalid response from Wikimedia:', responseText)
      return NextResponse.json(
        { error: 'Invalid OAuth response' },
        { status: 500 }
      )
    }

    console.log('[OAuth1 Login] Request token obtained:', tokenData.oauth_token)

    // Build authorization URL
    const consumerKey = process.env.WIKIMEDIA_CONSUMER_KEY || process.env.WIKIMEDIA_CLIENT_ID
    const authUrl = `${WIKIMEDIA_OAUTH1_ENDPOINTS.authorize}?oauth_token=${encodeURIComponent(tokenData.oauth_token)}&oauth_consumer_key=${encodeURIComponent(consumerKey || '')}`

    // Create redirect response
    const redirectResponse = NextResponse.redirect(authUrl)

    // Store token secret in a secure cookie (needed for callback)
    redirectResponse.cookies.set('oauth_token_secret', tokenData.oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    })

    // Store return URL in cookie
    redirectResponse.cookies.set('oauth_return_to', returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    })

    console.log('[OAuth1 Login] Redirecting to authorization URL')

    return redirectResponse
  } catch (error: any) {
    console.error('[OAuth1 Login] Error during login initiation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
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
