import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

/**
 * OAuth 1.0 Client for Wikimedia
 * Creates and configures OAuth client with consumer keys and HMAC-SHA1 signing
 */
export function createOAuth1Client() {
  const consumerKey = process.env.WIKIMEDIA_CONSUMER_KEY || process.env.WIKIMEDIA_CLIENT_ID
  const consumerSecret = process.env.WIKIMEDIA_CONSUMER_SECRET || process.env.WIKIMEDIA_CLIENT_SECRET

  if (!consumerKey || !consumerSecret) {
    throw new Error('Missing OAuth 1.0 consumer credentials')
  }

  const oauth = new OAuth({
    consumer: {
      key: consumerKey,
      secret: consumerSecret,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64')
    },
  })

  return oauth
}

/**
 * OAuth 1.0 endpoints for Wikimedia
 */
export const WIKIMEDIA_OAUTH1_ENDPOINTS = {
  requestToken: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/initiate',
  authorize: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/authorize',
  accessToken: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/token',
  identify: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/identify',
}
