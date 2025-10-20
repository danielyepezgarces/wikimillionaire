# Fix for "Client authentication failed" Error in Wikimedia OAuth

## Issue Description

Users were experiencing the error: **"Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method)"** when attempting to authenticate with Wikimedia OAuth.

## Root Cause

The application was sending **both** `client_secret` (for confidential clients) and `code_verifier` (for PKCE/public clients) in the token exchange request, which is invalid according to OAuth 2.0 specifications.

This is a fundamental OAuth 2.0 configuration issue:

### OAuth 2.0 Client Types

According to [Wikimedia's OAuth documentation](https://www.mediawiki.org/wiki/OAuth/For_Developers):

1. **Confidential Clients**
   - Can securely store a `client_secret`
   - Use standard OAuth flow: `client_id` + `client_secret`
   - Do NOT use PKCE

2. **Public/Non-Confidential Clients**
   - Cannot securely store secrets (e.g., browser-based apps, mobile apps)
   - Use PKCE for security: `client_id` + `code_verifier`/`code_challenge`
   - Do NOT send `client_secret`

### The Problem

The previous code was always using PKCE **AND** always sending `client_secret`, mixing both authentication methods:
```typescript
// ❌ INCORRECT - Mixing confidential and public client authentication
params.append("client_id", clientId)
params.append("client_secret", clientSecret)  // Confidential client auth
params.append("code_verifier", codeVerifier)  // Public client auth (PKCE)
```

This caused Wikimedia's OAuth server to reject the request because:
- OAuth providers expect EITHER confidential client auth OR public client auth (PKCE)
- Sending both creates ambiguity about which authentication method to validate

## Solution

Make the authentication flow adaptive based on the client type:

```typescript
// ✅ CORRECT - Adaptive authentication based on client type
if (clientSecret) {
  // Confidential client
  params.append("client_id", clientId)
  params.append("client_secret", clientSecret)
} else {
  // Public client with PKCE
  params.append("client_id", clientId)
  params.append("code_verifier", codeVerifier)
}
```

The application now automatically detects which authentication method to use:
- If `WIKIMEDIA_CLIENT_SECRET` is set → Use confidential client flow (no PKCE)
- If `WIKIMEDIA_CLIENT_SECRET` is not set → Use public client flow (with PKCE)

## Changes Made

### 1. Authorization Endpoint (`app/api/auth/wikimedia/route.ts`)
- ✅ Detects client type based on presence of `WIKIMEDIA_CLIENT_SECRET`
- ✅ For confidential clients: Skips PKCE, generates only `state`
- ✅ For public clients: Generates PKCE parameters (`code_challenge`, `code_verifier`)
- ✅ Builds appropriate authorization URL based on client type

### 2. Token Exchange Endpoint (`app/api/auth/token/route.ts`)
- ✅ Detects client type based on presence of `WIKIMEDIA_CLIENT_SECRET`
- ✅ For confidential clients: Sends `client_secret` (no PKCE)
- ✅ For public clients: Sends `code_verifier` (no client_secret)
- ✅ Added validation to ensure proper configuration
- ✅ Added logging to indicate which client type is being used

### 3. Callback Endpoint (`app/api/auth/callback/route.ts`)
- ✅ Detects client type based on presence of `WIKIMEDIA_CLIENT_SECRET`
- ✅ Conditionally includes either `client_secret` or `code_verifier` in token request
- ✅ Never sends both parameters together

### 3. Documentation Updates
- ✅ Updated `OAUTH_FIX.md` with critical notes about PKCE
- ✅ Updated `.env.example` to note `client_secret` is not needed
- ✅ Enhanced troubleshooting section with this specific error

## Wikimedia OAuth App Configuration

The application now supports both client types. Configure your Wikimedia OAuth app based on your preference:

### For Confidential Clients (Recommended for Server-Side Apps)
1. **Client Type**: **Confidential**
2. **OAuth 2.0 Protocol**: Enabled
3. **Grants**: authorization_code
4. **Environment**: Set both `WIKIMEDIA_CLIENT_ID` and `WIKIMEDIA_CLIENT_SECRET`

### For Public/Non-Confidential Clients (For Client-Side Apps)
1. **Client Type**: **Public** or **Non-Confidential**
2. **OAuth 2.0 Protocol**: Enabled
3. **Grants**: authorization_code
4. **PKCE**: Enabled (automatic for public clients)
5. **Environment**: Set only `WIKIMEDIA_CLIENT_ID` (leave `WIKIMEDIA_CLIENT_SECRET` empty or unset)

## Security Implications

This change actually **improves security** by:

1. ✅ Properly implementing PKCE as designed (RFC 7636)
2. ✅ Removing unnecessary `client_secret` that shouldn't be in browser-based apps
3. ✅ Following OAuth 2.0 best practices for public clients
4. ✅ Maintaining all PKCE security benefits:
   - SHA-256 code challenge prevents authorization code interception
   - State parameter prevents CSRF attacks
   - Single-use authorization codes

## Testing

After this fix:
- ✅ Linting passes with no errors
- ✅ CodeQL security scan passes (0 vulnerabilities)
- ✅ OAuth flow properly authenticated as a public client

## References

- [RFC 7636 - Proof Key for Code Exchange (PKCE)](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [Wikimedia OAuth Documentation](https://www.mediawiki.org/wiki/OAuth/For_Developers)

## Related Issues

This fix resolves authentication issues where users see:
- "Client authentication failed"
- "Unknown client"
- "Unsupported authentication method"

These errors all stem from the same root cause: mixing confidential and public client authentication methods.

---

**Fixed on**: October 20, 2025  
**Commit**: f97cb3a  
**Security Status**: ✅ PASSED (0 vulnerabilities)
