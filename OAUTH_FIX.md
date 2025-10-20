# OAuth Flow Fix - Wikipedia/Wikimedia Login

This document describes the fixes made to resolve the Wikipedia OAuth login errors.

## Issues Resolved

### 1. Authorization Code Revocation Error

**Problem**: The error "Authorization code has been revoked" was occurring because the authorization code was being used multiple times or was expired before being exchanged for a token.

**Root Cause**: 
- Multiple OAuth flows (server-side and client-side) were attempting to exchange the same authorization code
- Inconsistent OAuth endpoints (wikidata.org vs meta.wikimedia.org) causing mismatches

**Solution**:
- Unified OAuth flow to use only client-side exchange via `/api/auth/token`
- Standardized all OAuth endpoints to use `meta.wikimedia.org`
- Added proper state validation with expiration (30 minutes)
- Improved error handling for revoked/expired codes

### 2. Inconsistent OAuth Endpoints

**Problem**: Different parts of the application were using different OAuth endpoints:
- `/api/auth/wikimedia/route.ts` was using `wikidata.org`
- `/api/auth/token/route.ts` was using `wikidata.org`
- `/contexts/auth-context.tsx` was using `wikidata.org`

**Solution**: All OAuth endpoints now consistently use `meta.wikimedia.org`:
- Authorization URL: `https://meta.wikimedia.org/w/rest.php/oauth2/authorize`
- Token exchange URL: `https://meta.wikimedia.org/w/rest.php/oauth2/access_token`
- User info URL: `https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile`

### 3. Improved Error Handling

**Changes**:
- Added specific error messages for different OAuth error types
- Added logging prefixes `[Token]`, `[Wikimedia]` for easier debugging
- Improved timeout handling (10 seconds)
- Better error messages for users when authentication fails

## OAuth Flow

### 1. Initiate Authentication

User clicks "Login with Wikipedia" → Redirects to `/api/auth/wikimedia`

```typescript
// Generates:
// - state (random hex string for CSRF protection)
// - codeVerifier (random string for PKCE)
// - codeChallenge (SHA-256 hash of codeVerifier)

const authUrl = 
  `https://meta.wikimedia.org/w/rest.php/oauth2/authorize?` +
  `client_id=${clientId}` +
  `&response_type=code` +
  `&redirect_uri=${redirectUri}` +
  `&state=${state}` +
  `&code_challenge=${codeChallenge}` +
  `&code_challenge_method=S256`
```

### 2. User Authorizes on Wikimedia

User is redirected to Wikimedia OAuth page → Grants permissions → Wikimedia redirects back to `/auth/callback?code=...&state=...`

### 3. Exchange Code for Token

Client-side callback page validates state and exchanges code for token **only once**:

```typescript
// Validate state matches
const savedState = localStorage.getItem("wikimillionaire_oauth_state")
if (savedState !== state) {
  throw new Error("State mismatch")
}

// Exchange code for token
const tokenResponse = await fetch("/api/auth/token", {
  method: "POST",
  body: JSON.stringify({ code, codeVerifier })
})
```

### 4. Get User Info

Using the access token, fetch user profile from Wikimedia:

```typescript
const userResponse = await fetch("/api/auth/user", {
  method: "POST",
  body: JSON.stringify({ accessToken })
})
```

### 5. Save User Session

User information is saved in:
- localStorage (for client-side persistence)
- Cookie (for server-side authentication)

## Security Features

### PKCE (Proof Key for Code Exchange)

- Uses SHA-256 hashing
- Protects against authorization code interception
- Required by Wikimedia OAuth

### State Validation

- Random state parameter prevents CSRF attacks
- State expires after 30 minutes
- Validated on callback

### Token Exchange

- Authorization code is single-use only
- Code expires quickly (typically 10 minutes)
- Exchanged immediately after callback

## Configuration

### Environment Variables

```bash
WIKIMEDIA_CLIENT_ID=your_client_id
# Note: WIKIMEDIA_CLIENT_SECRET is NOT used when implementing PKCE flow
# PKCE is for public clients - do not send client_secret with code_verifier
WIKIMEDIA_REDIRECT_URI=https://wikimillionaire.vercel.app/auth/callback
```

**Important**: When using PKCE (Proof Key for Code Exchange), the `client_secret` should **NOT** be sent in the token exchange request. PKCE is designed for public clients that cannot securely store secrets. The `code_verifier` serves as the authentication mechanism instead. Sending both `client_secret` and `code_verifier` will cause a "Client authentication failed" error from Wikimedia.

### Wikimedia OAuth App Settings

In the Wikimedia OAuth app configuration, ensure:

1. **OAuth 2.0 protocol** is enabled
2. **Redirect URI** matches exactly: `https://wikimillionaire.vercel.app/auth/callback`
3. **Client type** is "Public" (for PKCE flow) - **CRITICAL**: Public clients use PKCE without client_secret
4. **Grants** include "authorization_code"
5. **Do NOT enable "Confidential" client type** - This would require client_secret which conflicts with PKCE

## Debugging OAuth Issues

### Enable Detailed Logging

All OAuth operations now include prefixed logs:

```
[Wikimedia] Starting OAuth flow with client_id: cd1155b...
[Wikimedia] Using redirect_uri: https://wikimillionaire.vercel.app/auth/callback
[Token] Processing token request with code: def50200a6...
[Token] CodeVerifier present: true
[Token] Using client_id: cd1155b...
[Token] Making request to: https://meta.wikimedia.org/w/rest.php/oauth2/access_token
[Token] Token obtained successfully
```

### Common Errors

#### "Authorization code has been revoked"

**Causes**:
- Code was already used (clicked back button and tried again)
- Code expired before exchange (>10 minutes)
- Redirect URI mismatch

**Solution**: Try logging in again with a fresh authorization

#### "State mismatch"

**Causes**:
- Cookie/localStorage was cleared between authorization and callback
- CSRF attack attempt
- Multiple login attempts interfering

**Solution**: Clear browser storage and try again

#### "Invalid client" or "Client authentication failed"

**Causes**:
- `WIKIMEDIA_CLIENT_ID` is incorrect
- OAuth app is not approved by Wikimedia
- **CRITICAL**: Sending `client_secret` with PKCE flow (code_verifier)
- OAuth app is configured as "Confidential" instead of "Public"

**Solution**: 
- Verify credentials in Wikimedia OAuth app settings
- **Ensure OAuth app is set to "Public" client type**
- **Do NOT send client_secret when using PKCE** - this is the most common cause
- The code_verifier serves as authentication for public clients

## Testing

### Local Testing

1. Set up a test OAuth app in Wikimedia
2. Use `http://localhost:3000/auth/callback` as redirect URI
3. Set environment variables
4. Test full login flow

### Production Testing

1. Verify redirect URI matches production domain
2. Monitor logs for OAuth errors
3. Test with multiple users
4. Check token expiration handling

## Acceptance Criteria Met

✅ Wikipedia login works consistently without token revocation errors
✅ Authorization code is only used once
✅ Proper error handling when token exchange fails
✅ State and codeVerifier are persisted correctly during redirect
✅ Consistent use of meta.wikimedia.org endpoints
✅ Deployment logs show no invalid_request or authorization_code reuse errors

## Further Improvements

Consider in future:

- Implement token refresh mechanism
- Add user session timeout handling
- Implement "Remember me" functionality
- Add analytics for login success/failure rates
- Implement rate limiting for OAuth endpoints
