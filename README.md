# WikiMillionaire - PHP 8.4 Migration

This is a pure PHP 8.4+ implementation of WikiMillionaire, migrated from the Next.js/TypeScript version.

## Features

- **Pure PHP 8.4+**: Uses modern PHP features (enums, named arguments, match expressions)
- **No External Libraries**: No Composer dependencies, only native PHP functions
- **Wikidata Integration**: Real-time questions from Wikidata SPARQL endpoint
- **OAuth 1.0a**: Wikimedia authentication (manual implementation)
- **Database**: MySQL/MariaDB with PDO
- **Session Management**: Built-in PHP sessions
- **Responsive Design**: Pure CSS, no frameworks

## Requirements

- PHP 8.4 or higher
- MySQL 5.7+ or MariaDB 10.3+
- Apache with mod_rewrite (or equivalent web server)
- PHP extensions:
  - pdo_mysql
  - session
  - json
  - openssl

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wikimillionaire
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database and OAuth credentials.

3. **Create database**
   ```sql
   CREATE DATABASE wikimillionaire CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **Run migrations**
   ```bash
   php scripts/migrate.php
   ```

5. **Configure web server**
   
   **Apache**: The `.htaccess` files are already configured.
   
   **Nginx**: Add this to your server block:
   ```nginx
   location / {
       try_files $uri $uri/ /public/index.php?$query_string;
   }
   ```

6. **Set permissions**
   ```bash
   chmod -R 755 public
   ```

## Directory Structure

```
wikimillionaire/
├── lib/               # Core libraries
│   ├── auth.php       # Authentication system
│   ├── database.php   # Database abstraction
│   ├── helpers.php    # Helper functions
│   ├── router.php     # URL routing
│   └── wikidata.php   # Wikidata API integration
├── public/            # Web root
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   └── index.php      # Entry point
├── src/
│   └── Controllers/   # Application controllers
├── scripts/
│   └── migrate.php    # Database migration
├── .env.example       # Environment config template
├── .htaccess          # Apache configuration
└── README.md          # This file
```

## Migration from Next.js

### Key Changes

1. **Routing**: From Next.js file-based routing to PHP router
2. **API Routes**: From Next.js API routes to PHP controller files
3. **Database**: From Prisma/TypeScript to PDO
4. **Authentication**: From NextAuth to manual OAuth 1.0a
5. **Frontend**: From React components to PHP templates + vanilla JS
6. **Styling**: From Tailwind CSS to pure CSS

### Features Implemented

- ✅ Home page with features showcase
- ✅ Game play with Wikidata questions
- ✅ Score tracking and leaderboard
- ✅ User authentication (Wikimedia OAuth)
- ✅ Session management
- ✅ Responsive design
- ✅ 50:50 lifeline

### Not Yet Implemented

- ⏳ User profile page
- ⏳ Multiplayer functionality
- ⏳ Answer reporting system
- ⏳ Additional lifelines

## PHP 8.4 Features Used

- `declare(strict_types=1)` for type safety
- Match expressions for cleaner conditionals
- Named arguments for better readability
- Constructor property promotion
- Enums for type-safe constants
- `str_starts_with()`, `str_ends_with()` functions
- `array_is_list()` function

## Security Features

- CSRF protection
- XSS prevention (htmlspecialchars)
- SQL injection prevention (prepared statements)
- Secure session handling
- HTTPOnly and Secure cookies
- Security headers

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url VARCHAR(500),
    auth_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Scores Table
```sql
CREATE TABLE scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    score INT NOT NULL,
    level_reached INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Endpoints

- `GET /api/question?level={level}` - Get random question
- `POST /api/answer` - Submit answer
- `GET /api/scores` - Get leaderboard
- `POST /api/scores` - Submit score
- `GET /api/auth/login` - Start OAuth flow
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/logout` - Logout

## Development

### Testing
```bash
# Run PHP built-in server for development
php -S localhost:8000 -t public
```

### Debugging
Set `APP_DEBUG=true` in `.env` to enable detailed error messages.

## Production Deployment

1. Set `APP_DEBUG=false` in `.env`
2. Configure proper database credentials
3. Set up SSL certificate
4. Configure OAuth callback URL for production domain
5. Set secure session settings in `php.ini`:
   ```ini
   session.cookie_secure = 1
   session.cookie_httponly = 1
   session.cookie_samesite = Strict
   ```

## License

Same as original WikiMillionaire project.

## Credits

- Original Next.js version: WikiMillionaire team
- Wikidata: Wikimedia Foundation
- PHP 8.4 migration: 2025
