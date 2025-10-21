# OAuth 1.0 Quick Start Guide

Quick setup guide for implementing OAuth 1.0 authentication with Wikimedia.

## Prerequisites

- Node.js 18+ installed
- Database (MariaDB, Supabase, or NeonDB)
- Wikimedia OAuth 1.0 consumer credentials

## Installation

1. **Install Dependencies** (already done if you ran `npm install`):
   ```bash
   npm install oauth-1.0a crypto-js @types/jsonwebtoken
   ```

2. **Configure Environment Variables**:
   
   Copy `.env.example` to `.env` and update:
   ```env
   # OAuth 1.0 Credentials
   WIKIMEDIA_CONSUMER_KEY=your_consumer_key_here
   WIKIMEDIA_CONSUMER_SECRET=your_consumer_secret_here
   
   # JWT Secret
   JWT_SECRET=your_random_secret_key_here
   
   # Database Configuration
   DB_TYPE=mariadb
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=wikimillionaire
   ```

## Getting Wikimedia OAuth Credentials

1. Go to https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose

2. Fill in the form:
   - **Application name**: Your App Name
   - **Application version**: 1.0
   - **OAuth protocol version**: OAuth 1.0a
   - **Callback URL**: `http://localhost:3000/api/auth/oauth1-callback` (development)
   - **Applicable grants**: Select "User identity verification only" or other needed grants

3. Submit and wait for approval (can be instant for development)

4. Copy your **Consumer key** and **Consumer secret** to `.env`

## Database Setup

### Option 1: MariaDB/MySQL

1. Create database:
   ```sql
   CREATE DATABASE wikimillionaire;
   ```

2. The application will auto-create tables on first run

### Option 2: Supabase

1. Create tables via Supabase dashboard or SQL editor:
   ```sql
   -- Users table (may already exist)
   ALTER TABLE users ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '["user"]';
   
   -- Refresh tokens table
   CREATE TABLE IF NOT EXISTS refresh_tokens (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
     token VARCHAR(500) UNIQUE NOT NULL,
     expires_at TIMESTAMP NOT NULL,
     user_agent TEXT,
     ip_address VARCHAR(45),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. Update `.env`:
   ```env
   DB_TYPE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Option 3: NeonDB

1. Get connection string from Neon dashboard

2. Update `.env`:
   ```env
   DB_TYPE=neondb
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   ```

3. Tables will be auto-created on first run

## Usage

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test Login Flow

Open your browser and navigate to:
```
http://localhost:3000/api/auth/oauth1-login
```

You should be redirected to Wikimedia for authorization.

### 3. Verify Authentication

After logging in, check cookies in browser DevTools:
- `access_token` - JWT access token
- `refresh_token` - JWT refresh token  
- `session_info` - User information

### 4. Use in Your Application

**Client-side** (get user from cookie):
```typescript
const sessionInfo = document.cookie
  .split('; ')
  .find(row => row.startsWith('session_info='))
  ?.split('=')[1]

if (sessionInfo) {
  const { userId, username } = JSON.parse(decodeURIComponent(sessionInfo))
  console.log('Logged in as:', username)
}
```

**Server-side** (verify token):
```typescript
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/token-manager'

const cookieStore = await cookies()
const accessToken = cookieStore.get('access_token')?.value

if (accessToken) {
  const payload = verifyToken(accessToken)
  if (payload) {
    console.log('User:', payload.username)
  }
}
```

## Integration with UI

### Add Login Button

```tsx
import Link from 'next/link'

export function LoginButton() {
  return (
    <Link 
      href="/api/auth/oauth1-login?returnTo=/profile"
      className="btn btn-primary"
    >
      Login with Wikipedia
    </Link>
  )
}
```

### Check Authentication Status

```tsx
'use client'

import { useEffect, useState } from 'react'

export function AuthStatus() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const sessionInfo = document.cookie
      .split('; ')
      .find(row => row.startsWith('session_info='))
      ?.split('=')[1]

    if (sessionInfo) {
      setUser(JSON.parse(decodeURIComponent(sessionInfo)))
    }
  }, [])

  if (!user) {
    return <LoginButton />
  }

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={() => {
        // Clear cookies and redirect
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'session_info=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        window.location.href = '/'
      }}>
        Logout
      </button>
    </div>
  )
}
```

## Testing

### Manual Testing Steps

1. **Login Flow**:
   - Visit `/api/auth/oauth1-login`
   - Authorize on Wikimedia
   - Verify redirect back to your app
   - Check cookies are set

2. **User Creation**:
   - Check database for new user record
   - Verify roles are set to `["user"]`
   - Confirm Gravatar URL is generated

3. **Token Refresh**:
   - Wait for access token to expire (15 minutes)
   - Implement refresh token endpoint (future enhancement)

4. **Error Handling**:
   - Visit `/auth/error?error=Test`
   - Verify error page displays correctly
   - Test retry functionality

### Verify Database

```sql
-- Check users
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

-- Check refresh tokens
SELECT user_id, expires_at, user_agent 
FROM refresh_tokens 
ORDER BY created_at DESC 
LIMIT 5;
```

## Common Issues

### "Missing OAuth parameters"
- **Cause**: Callback URL mismatch
- **Fix**: Ensure Wikimedia OAuth app callback URL exactly matches your endpoint

### "Missing token secret"
- **Cause**: Cookie expired or blocked
- **Fix**: Enable cookies in browser, try again

### "Failed to exchange OAuth token"
- **Cause**: Invalid credentials or expired request token
- **Fix**: Verify consumer key/secret, try logging in again

### Database connection errors
- **Cause**: Wrong credentials or database not running
- **Fix**: Check `.env` configuration, ensure database is running

## Next Steps

1. ✅ Setup complete - Authentication is working
2. 📝 Customize error page styling
3. 🔐 Implement logout endpoint (optional)
4. 🔄 Implement token refresh endpoint
5. 👥 Add role management UI
6. 📊 Add session management dashboard

## Production Deployment

Before deploying to production:

1. **Update Callback URL** in Wikimedia OAuth app:
   ```
   https://yourdomain.com/api/auth/oauth1-callback
   ```

2. **Set Production Environment Variables**:
   ```env
   NODE_ENV=production
   WIKIMEDIA_CONSUMER_KEY=production_key
   WIKIMEDIA_CONSUMER_SECRET=production_secret
   JWT_SECRET=strong_random_secret
   COOKIE_DOMAIN=.yourdomain.com
   ```

3. **Enable HTTPS** (required for secure cookies)

4. **Test thoroughly** in staging environment first

5. **Monitor logs** for authentication errors

## Support

- 📖 Full documentation: [OAUTH1_IMPLEMENTATION.md](./OAUTH1_IMPLEMENTATION.md)
- 🐛 Issues: Check error logs and `/auth/error` page
- 💬 Questions: Review Wikimedia OAuth docs

## Resources

- [Wikimedia OAuth Documentation](https://www.mediawiki.org/wiki/OAuth/Owner-only_consumers)
- [OAuth 1.0 Specification](https://oauth.net/core/1.0/)
- [JWT Introduction](https://jwt.io/introduction)
