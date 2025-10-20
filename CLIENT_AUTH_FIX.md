# Fix for "Client authentication failed" Error in Wikimedia OAuth

## Issue Description

Users were experiencing the error: **"Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method)"** when attempting to authenticate with Wikimedia OAuth.

## Root Cause

The application was implementing **PKCE (Proof Key for Code Exchange)** OAuth flow but incorrectly sending **both** `client_secret` and `code_verifier` in the token exchange request. 

This is a fundamental OAuth 2.0 configuration issue:

### OAuth 2.0 Client Types

1. **Confidential Clients**
   - Can securely store a `client_secret`
   - Use standard OAuth flow: `client_id` + `client_secret`
   - Do NOT use PKCE

2. **Public Clients**
   - Cannot securely store secrets (e.g., browser-based apps, mobile apps)
   - Use PKCE for security: `client_id` + `code_verifier`
   - Do NOT send `client_secret`

### The Problem

The code was mixing both authentication methods:
```typescript
// ❌ INCORRECT - Mixing confidential and public client authentication
params.append("client_id", clientId)
params.append("client_secret", clientSecret)  // Confidential client auth
params.append("code_verifier", codeVerifier)  // Public client auth (PKCE)
```

This caused Wikimedia's OAuth server to reject the request because:
- If it's a public client (PKCE), it should NOT receive a `client_secret`
- If it's a confidential client, it should NOT receive a `code_verifier`

## Solution

Remove `client_secret` from token exchange requests when using PKCE:

```typescript
// ✅ CORRECT - Public client with PKCE
params.append("client_id", clientId)
params.append("code_verifier", codeVerifier)  // PKCE authentication only
```

## Changes Made

### 1. Token Exchange Endpoint (`app/api/auth/token/route.ts`)
- ✅ Removed `client_secret` parameter from URLSearchParams
- ✅ Removed unused `clientSecret` variable
- ✅ Updated validation to only check for `clientId`
- ✅ Added explanatory comments

### 2. Callback Endpoint (`app/api/auth/callback/route.ts`)
- ✅ Removed `client_secret` from token exchange request
- ✅ Added explanatory comments

### 3. Documentation Updates
- ✅ Updated `OAUTH_FIX.md` with critical notes about PKCE
- ✅ Updated `.env.example` to note `client_secret` is not needed
- ✅ Enhanced troubleshooting section with this specific error

## Wikimedia OAuth App Configuration

To avoid this error, ensure your Wikimedia OAuth app is configured as:

1. **Client Type**: **Public** (not Confidential)
2. **OAuth 2.0 Protocol**: Enabled
3. **Grants**: authorization_code
4. **PKCE**: Enabled (implicit with Public client type)

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
