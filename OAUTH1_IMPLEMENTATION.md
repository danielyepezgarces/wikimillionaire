# OAuth 1.0 Implementation for Wikimedia Login

This document describes the OAuth 1.0 authentication system implementation for Wikimedia login in the WikiMillionaire application.

## Overview

The implementation provides a complete OAuth 1.0 authentication flow with the following features:

1. **OAuth 1.0 Client** - Configurable OAuth client with HMAC-SHA1 signing
2. **Flexible Database Providers** - Support for MariaDB, Supabase, and NeonDB
3. **JWT Token Management** - Access and refresh token generation with secure storage
4. **User Management** - Automatic user creation/update with role assignment
5. **Secure Cookie Handling** - Production-ready cookie security with proper flags
6. **Error Handling** - Comprehensive error handling with user-friendly error pages

## Architecture

### Components

```
lib/
├── oauth1-client.ts          # OAuth 1.0 client configuration
├── database-provider.ts       # Database abstraction layer
├── token-manager.ts           # JWT token generation and verification
└── auth.ts                    # Existing auth utilities (extended)

app/api/auth/
├── oauth1-login/route.ts      # OAuth 1.0 login initiation
├── oauth1-callback/route.ts   # OAuth 1.0 callback handler
└── ...                        # Existing OAuth 2.0 endpoints

app/auth/
└── error/page.tsx             # Error page for authentication failures
```

## OAuth 1.0 Flow

### 1. Login Initiation (`/api/auth/oauth1-login`)

**Endpoint**: `GET /api/auth/oauth1-login?returnTo=/path`

**Process**:
1. Create OAuth 1.0 client with consumer credentials
2. Request a request token from Wikimedia
3. Store token secret in secure cookie
4. Redirect user to Wikimedia authorization page

**Request Example**:
```
GET /api/auth/oauth1-login?returnTo=/profile
```

**Cookies Set**:
- `oauth_token_secret` - Token secret for callback (expires in 15 minutes)
- `oauth_return_to` - Return URL after successful login

**Redirect To**:
```
https://meta.wikimedia.org/w/index.php?title=Special:OAuth/authorize
  ?oauth_token=<request_token>
  &oauth_consumer_key=<consumer_key>
```

### 2. User Authorization (on Wikimedia)

The user is redirected to Wikimedia where they:
1. Review the permissions requested
2. Approve or deny the authorization
3. Are redirected back to the callback URL

### 3. Callback Processing (`/api/auth/oauth1-callback`)

**Endpoint**: `GET /api/auth/oauth1-callback?oauth_token=...&oauth_verifier=...`

**Process**:
1. Parse OAuth token and verifier from query parameters
2. Retrieve token secret from cookie
3. Exchange request token for access token
4. Retrieve user information from Wikimedia identify endpoint
5. Decode JWT from Wikimedia to extract user details
6. Check if user exists in database
   - If exists: Update last_login and user details
   - If not: Create new user with default role
7. Generate JWT access and refresh tokens
8. Store refresh token in database with metadata
9. Set authentication cookies
10. Clean up temporary cookies
11. Redirect to return URL or home page

**User Information Retrieved**:
- `sub` - Wikimedia user ID (unique identifier)
- `username` - Wikimedia username
- `email` - User email (if available)

**Tokens Generated**:
- **Access Token** - Short-lived (15 minutes), used for API requests
- **Refresh Token** - Long-lived (7 days), used to obtain new access tokens

**Cookies Set**:
- `access_token` - JWT access token (httpOnly, secure in production)
- `refresh_token` - JWT refresh token (httpOnly, secure in production)
- `session_info` - Session information (username, userId) for client-side access
- `auth_token` - Legacy compatibility token

## Database Integration

### Database Provider Abstraction

The system supports multiple database backends through a unified interface:

```typescript
interface DatabaseProvider {
  initialize(): Promise<void>
  getUserById(id: string): Promise<User | null>
  getUserByWikimediaId(wikimediaId: string): Promise<User | null>
  createUser(userData: {...}): Promise<User>
  updateUser(id: string, userData: {...}): Promise<User | null>
  storeRefreshToken(data: {...}): Promise<void>
  getRefreshToken(token: string): Promise<...>
  deleteRefreshToken(token: string): Promise<void>
}
```

### Supported Databases

#### 1. MariaDB/MySQL (Default)

**Configuration**:
```env
DB_TYPE=mariadb
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=wikimillionaire
```

**Tables Created**:
- `users` - User information with roles column (JSON)
- `refresh_tokens` - Refresh token storage with metadata
- `sessions` - Session management (existing)
- `scores` - Game scores (existing)

#### 2. Supabase

**Configuration**:
```env
DB_TYPE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Required Tables** (create via Supabase migrations):
- `users` - With roles column (JSONB)
- `refresh_tokens` - Token storage

#### 3. NeonDB

**Configuration**:
```env
DB_TYPE=neondb
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

**Tables Created Automatically**:
- `users` - With roles column (JSONB)
- `refresh_tokens` - Token storage

### Database Initialization

Call `initialize()` on the database provider to set up tables:

```typescript
import { createDatabaseProvider } from '@/lib/database-provider'

const db = createDatabaseProvider()
await db.initialize()
```

## JWT Token Management

### Token Structure

**Access Token Payload**:
```json
{
  "sub": "user_id",
  "username": "wikimedia_username",
  "wikimedia_id": "wikimedia_user_id",
  "roles": ["user"],
  "type": "access",
  "iat": 1234567890,
  "exp": 1234568790,
  "iss": "wikimillionaire",
  "aud": "wikimillionaire-users"
}
```

**Refresh Token Payload**:
```json
{
  "sub": "user_id",
  "username": "wikimedia_username",
  "wikimedia_id": "wikimedia_user_id",
  "roles": ["user"],
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234172690,
  "iss": "wikimillionaire",
  "aud": "wikimillionaire-users"
}
```

### Token Generation

```typescript
import { generateTokenPair } from '@/lib/token-manager'

const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } = 
  generateTokenPair(user)
```

### Token Verification

```typescript
import { verifyToken } from '@/lib/token-manager'

const payload = verifyToken(token)
if (payload && payload.type === 'access') {
  // Token is valid
}
```

## User Management

### User Creation

New users are automatically created with:
- Username from Wikimedia
- Wikimedia ID (unique identifier)
- Email (if provided)
- Avatar URL (Gravatar based on email)
- Default role: `["user"]`
- Last login timestamp

### User Update

Existing users are updated on each login:
- Last login timestamp
- Email (if changed)
- Avatar URL (if email changed)

### Roles

Users can have multiple roles stored as JSON array:
- `user` - Default role for all users
- `admin` - Administrative access (can be added manually)
- `moderator` - Moderation access (can be added manually)

## Cookie Security

### Cookie Configuration

**Production**:
- `httpOnly: true` - Not accessible via JavaScript
- `secure: true` - Only transmitted over HTTPS
- `sameSite: 'lax'` - CSRF protection

**Development**:
- `httpOnly: true` - Same as production
- `secure: false` - Allow HTTP for localhost
- `sameSite: 'lax'` - Same as production

### Cookie Lifetimes

- `access_token` - 15 minutes
- `refresh_token` - 7 days
- `session_info` - 7 days
- `auth_token` - 7 days (legacy compatibility)

## Error Handling

### Error Page (`/auth/error`)

Displays user-friendly error messages with options to:
- Return to home page
- Try logging in again

**Example Error URL**:
```
/auth/error?error=Failed%20to%20exchange%20OAuth%20token
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Missing OAuth parameters | Callback missing token or verifier | Try logging in again |
| Missing token secret | Cookie expired or not set | Clear cookies and retry |
| Failed to exchange OAuth token | Invalid token or Wikimedia error | Check credentials, retry |
| Failed to retrieve user information | Network or Wikimedia API issue | Retry, check API status |

## Configuration

### Environment Variables

**Required**:
```env
# OAuth 1.0 Consumer Credentials
WIKIMEDIA_CONSUMER_KEY=your_consumer_key
WIKIMEDIA_CONSUMER_SECRET=your_consumer_secret

# JWT Secret (or use existing NEXTAUTH_SECRET)
JWT_SECRET=your_jwt_secret_key

# Database Type
DB_TYPE=mariadb  # or supabase, neondb
```

**Optional**:
```env
# Token Expiry Configuration
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Cookie Domain (for multi-subdomain support)
COOKIE_DOMAIN=.yourdomain.com

# Legacy OAuth 2.0 (backward compatibility)
WIKIMEDIA_CLIENT_ID=your_client_id
WIKIMEDIA_CLIENT_SECRET=your_client_secret
```

### Wikimedia OAuth App Setup

1. Go to [Wikimedia Special:OAuthConsumerRegistration](https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose)
2. Fill in application details:
   - **Application name**: WikiMillionaire
   - **Application version**: 1.0
   - **OAuth protocol version**: OAuth 1.0a
   - **Callback URL**: `https://yourdomain.com/api/auth/oauth1-callback`
   - **Grants**: Select required permissions
3. Note the **Consumer key** and **Consumer secret**
4. Add credentials to environment variables

## Security Considerations

### Token Security

1. **Access tokens** are short-lived (15 minutes) to minimize exposure
2. **Refresh tokens** are stored in database with metadata for tracking
3. All tokens are signed with HMAC-SHA256
4. Tokens include issuer and audience claims for validation

### Cookie Security

1. **httpOnly** flag prevents XSS attacks
2. **secure** flag ensures HTTPS-only transmission in production
3. **sameSite=lax** provides CSRF protection
4. Temporary cookies are deleted after use

### Database Security

1. Refresh tokens include user agent and IP for anomaly detection
2. Token secrets are never exposed to client
3. Database credentials stored in environment variables
4. Prepared statements prevent SQL injection (MariaDB)

### OAuth Security

1. Token secrets stored in secure cookies
2. State parameter prevents CSRF (OAuth 2.0 also available)
3. Tokens expire after 15 minutes
4. HMAC-SHA1 signing ensures request integrity

## Testing

### Manual Testing

1. **Test Login Flow**:
   ```
   curl http://localhost:3000/api/auth/oauth1-login
   ```

2. **Check Cookies After Login**:
   ```javascript
   document.cookie
   // Should show access_token, refresh_token, session_info
   ```

3. **Test Error Handling**:
   ```
   curl http://localhost:3000/auth/error?error=Test%20Error
   ```

### Integration Testing

```typescript
// Example test for OAuth callback
import { GET } from '@/app/api/auth/oauth1-callback/route'

describe('OAuth 1.0 Callback', () => {
  it('should handle valid callback', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/oauth1-callback?oauth_token=test&oauth_verifier=test')
    // Add cookies and test
  })
})
```

## Troubleshooting

### Common Issues

1. **"Missing OAuth parameters"**
   - Ensure callback URL matches Wikimedia OAuth app configuration
   - Check that query parameters are being passed correctly

2. **"Missing token secret"**
   - Cookie may have expired (15 minutes)
   - Browser may be blocking cookies
   - Clear cookies and try again

3. **"Failed to exchange OAuth token"**
   - Verify consumer key and secret are correct
   - Check that OAuth app is approved by Wikimedia
   - Ensure callback URL matches exactly

4. **Database connection errors**
   - Verify database credentials
   - Check that database tables exist
   - Run `initialize()` to create tables

### Debugging

Enable detailed logging:
```typescript
console.log('[OAuth1 Login] Starting flow...')
console.log('[OAuth1 Callback] Processing callback...')
```

Check cookies in browser DevTools:
- Application > Cookies > localhost

Verify token contents:
```typescript
import jwt from 'jsonwebtoken'
const decoded = jwt.decode(token)
console.log(decoded)
```

## Migration from OAuth 2.0

The existing OAuth 2.0 implementation remains intact. To migrate:

1. **Update login buttons** to point to `/api/auth/oauth1-login`
2. **Keep OAuth 2.0 endpoints** for backward compatibility
3. **Migrate users gradually** - both systems can coexist
4. **Update documentation** to recommend OAuth 1.0

## Future Enhancements

Potential improvements:

1. **Token Refresh Endpoint** - Automatic access token refresh
2. **Session Management** - Track active sessions per user
3. **Role Management UI** - Admin panel for managing user roles
4. **OAuth Scope Selection** - Allow users to choose permissions
5. **Multi-provider Support** - Support other OAuth providers
6. **Rate Limiting** - Prevent brute force attacks
7. **Audit Logging** - Track authentication events

## Support

For issues or questions:
- Check this documentation
- Review error messages in `/auth/error`
- Check browser console for client-side errors
- Review server logs for detailed error information
- Consult [Wikimedia OAuth documentation](https://www.mediawiki.org/wiki/OAuth/Owner-only_consumers)

## License

This implementation is part of the WikiMillionaire project and follows the same license terms.
