# Migration to PHP 8.4 - Complete Documentation

## Overview

This document details the complete migration of WikiMillionaire from Next.js/TypeScript to PHP 8.4 using only legacy PHP code with no external libraries.

## Migration Summary

- **Source**: Next.js 15.2.4 + React 19 + TypeScript 5
- **Target**: PHP 8.4 with zero dependencies
- **Date**: November 2025
- **Status**: ✅ Completed

## Architecture Changes

### Framework Migration

| Component | Before (Next.js) | After (PHP 8.4) |
|-----------|------------------|-----------------|
| Runtime | Node.js | PHP 8.4 |
| Framework | Next.js | Custom PHP Router |
| Language | TypeScript | PHP 8.4 |
| Database ORM | Prisma/TypeORM | PDO (native) |
| Auth | NextAuth.js | Custom OAuth 1.0a |
| Frontend | React Components | PHP Templates + Vanilla JS |
| CSS | Tailwind CSS | Pure CSS |
| API Routes | Next.js API | PHP Controllers |
| Session | Next.js Session | PHP Native Sessions |

### Directory Structure

```
Next.js Structure → PHP 8.4 Structure
-------------------------------------
/app                 → /src/Controllers
/app/api            → /src/Controllers/Api
/components         → (inline in templates)
/lib                → /lib
/public             → / (root)
/styles             → /css
package.json        → (removed - no dependencies)
tsconfig.json       → (removed - PHP only)
next.config.mjs     → .htaccess
```

## PHP 8.4 Features Utilized

### 1. Strict Types
```php
declare(strict_types=1);
```
Used in all PHP files for type safety.

### 2. Match Expressions
```php
$difficulty = match (true) {
    $level < 5 => 'easy',
    $level < 10 => 'medium',
    default => 'hard'
};
```

### 3. Named Arguments
```php
json_response(
    data: ['success' => true],
    statusCode: 200
);
```

### 4. String Functions
```php
str_starts_with($path, '/api/')
str_ends_with($file, '.php')
```

### 5. Nullsafe Operator
```php
$username = $user?->username ?? 'Guest';
```

## Core Components Migrated

### 1. Routing System

**Before (Next.js):**
- File-based routing in `/app`
- Automatic route generation
- API routes in `/app/api`

**After (PHP 8.4):**
- Custom `Router` class in `/lib/router.php`
- Manual route registration in `/index.php`
- Pattern matching with regex

```php
$router->get('/', fn() => require SRC_PATH . '/Controllers/HomeController.php');
$router->post('/api/answer', fn() => require SRC_PATH . '/Controllers/Api/AnswerController.php');
```

### 2. Database Layer

**Before (Next.js):**
```typescript
import { query } from '@/lib/db'
const result = await query('SELECT * FROM users WHERE id = $1', [userId])
```

**After (PHP 8.4):**
```php
$db = Database::getInstance();
$result = $db->fetchOne('SELECT * FROM users WHERE id = ?', [$userId]);
```

**Features:**
- Singleton pattern for connection management
- Prepared statements for security
- Transaction support
- Helper methods (fetchAll, fetchOne, insert, update, delete)

### 3. Authentication System

**Before (Next.js):**
- NextAuth.js with OAuth providers
- JWT sessions
- Middleware protection

**After (PHP 8.4):**
- Custom OAuth 1.0a implementation
- Native PHP sessions
- Manual signature generation

```php
// OAuth signature generation
$signature = Auth::generateOAuthSignature(
    method: 'GET',
    url: $url,
    params: $params,
    consumerSecret: $secret,
    tokenSecret: $tokenSecret
);
```

### 4. Wikidata Integration

**Before (Next.js):**
```typescript
export async function getRandomQuestion(level: number): Promise<WikidataQuestion>
```

**After (PHP 8.4):**
```php
class Wikidata {
    public static function getRandomQuestion(int $level): array
}
```

**Implementation:**
- SPARQL query generation
- HTTP requests via `file_get_contents()` with stream context
- JSON parsing with native `json_decode()`
- Retry logic for reliability
- Fallback questions for errors

### 5. Frontend Templates

**Before (Next.js/React):**
```tsx
export default function HomePage() {
  const { user } = useAuth()
  return (
    <div className="home-container">
      <h1>{t.home.title}</h1>
    </div>
  )
}
```

**After (PHP 8.4):**
```php
<?php
$user = Auth::user();
?>
<!DOCTYPE html>
<html>
<head>
    <title><?= e($pageTitle) ?></title>
</head>
<body>
    <div class="home-container">
        <h1>WikiMillionaire</h1>
    </div>
</body>
</html>
```

### 6. JavaScript Frontend Logic

**Before (Next.js/React):**
- React state management
- Component lifecycle hooks
- JSX rendering

**After (Vanilla JavaScript):**
```javascript
// Pure JavaScript - no frameworks
async function loadQuestion() {
    const response = await fetch(`/api/question?level=${currentLevel}`);
    const data = await response.json();
    displayQuestion(data);
}
```

### 7. CSS Styling

**Before (Tailwind CSS):**
```tsx
<div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-900">
```

**After (Pure CSS):**
```css
.home-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #1e1b4b 0%, #312e81 100%);
}
```

## Security Implementations

### 1. XSS Prevention
```php
function e(?string $value): string {
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

// Usage in templates
<h1><?= e($userInput) ?></h1>
```

### 2. SQL Injection Prevention
```php
// Always use prepared statements
$db->query("SELECT * FROM users WHERE id = ?", [$userId]);
```

### 3. CSRF Protection
```php
// Token generation
function csrf_token(): string {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Verification
function verify_csrf_token(string $token): bool {
    return hash_equals($_SESSION['csrf_token'], $token);
}
```

### 4. Session Security
```php
// Session configuration
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => true,
    'cookie_samesite' => 'Strict'
]);
```

### 5. Security Headers
```apache
# .htaccess
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
```

## API Endpoints

All API endpoints maintained compatibility:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/question` | GET | Get random question by level |
| `/api/answer` | POST | Submit answer and get result |
| `/api/scores` | GET | Get leaderboard |
| `/api/scores` | POST | Submit score |
| `/api/stats` | GET | Get statistics |
| `/api/auth/login` | GET | Start OAuth flow |
| `/api/auth/callback` | GET | OAuth callback |
| `/api/auth/logout` | GET | Logout user |
| `/api/auth/me` | GET | Get current user |
| `/api/reports` | POST | Report answer |

## Database Schema

Schema remains compatible with original:

```sql
-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url VARCHAR(500),
    auth_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Scores table
CREATE TABLE scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    score INT NOT NULL,
    level_reached INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reports table
CREATE TABLE answer_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id VARCHAR(255) NOT NULL,
    reported_by VARCHAR(36),
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES users(id)
);
```

## Removed Dependencies

All npm packages removed (no longer needed):

- ❌ Next.js, React, React-DOM
- ❌ TypeScript
- ❌ Tailwind CSS
- ❌ Prisma / Database ORMs
- ❌ NextAuth.js
- ❌ All @radix-ui components
- ❌ All other 100+ npm packages

Total reduction: **~500MB node_modules** → **0 bytes** ✅

## Performance Considerations

### Advantages of PHP 8.4 Version:
1. **No build step** - Instant deployment
2. **Lower memory footprint** - No Node.js runtime
3. **Simpler deployment** - Just copy files
4. **Native session handling** - Built into PHP
5. **Direct database access** - No ORM overhead

### Trade-offs:
1. No automatic code splitting
2. No server-side rendering hydration
3. Manual route management
4. Less sophisticated frontend framework

## Testing the Migration

### 1. Setup Environment
```bash
cd php-app
cp .env.example .env
# Edit .env with your credentials
```

### 2. Run Database Migration
```bash
php scripts/migrate.php
```

### 3. Start Development Server
```bash
php -S localhost:8000 -t public
```

### 4. Test Features
- ✅ Homepage loads
- ✅ Game play works
- ✅ Questions load from Wikidata
- ✅ Scores save to database
- ✅ Leaderboard displays
- ✅ Authentication flow (with valid OAuth)

## Deployment Instructions

### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName wikimillionaire.local
    DocumentRoot /path/to/php-app/public

    <Directory /path/to/php-app/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name wikimillionaire.local;
    root /path/to/php-app/public;
    
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

## Known Limitations

1. **Multiplayer** - Not yet implemented (was "coming soon" in original)
2. **Real-time features** - Would require WebSockets (complex without libraries)
3. **Advanced caching** - No Redis/Memcached integration
4. **Image optimization** - No Next.js Image component equivalent
5. **i18n** - Simplified, not as robust as Next.js

## Future Enhancements

Possible additions while maintaining "no libraries" constraint:

1. **Session-based caching** for Wikidata queries
2. **File-based cache** for static data
3. **Admin panel** for question management
4. **Report moderation** interface
5. **User settings** page
6. **Achievement system**

## Conclusion

The migration successfully converts a modern Next.js/TypeScript application to pure PHP 8.4 with:

- ✅ Zero external dependencies
- ✅ Full feature parity for core functionality
- ✅ Modern PHP 8.4 features utilized
- ✅ Secure implementation
- ✅ Maintainable code structure
- ✅ Production-ready deployment

The resulting application is significantly simpler to deploy and maintain, while preserving all essential functionality.
