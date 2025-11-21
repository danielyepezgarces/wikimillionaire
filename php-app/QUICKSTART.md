# WikiMillionaire PHP 8.4 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- PHP 8.4+
- MySQL 5.7+ or MariaDB 10.3+
- Apache or Nginx

### Step 1: Configure Environment

```bash
cd php-app
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_NAME=wikimillionaire
DB_USER=your_username
DB_PASSWORD=your_password
```

### Step 2: Create Database

```bash
# Using MySQL CLI
mysql -u root -p
CREATE DATABASE wikimillionaire CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Or run the migration script directly (it creates the database)
php scripts/migrate.php
```

### Step 3: Start Server

#### Development (PHP Built-in Server)
```bash
php -S localhost:8000 -t public
```

#### Production (Apache)
- Point document root to `php-app/public`
- Ensure `.htaccess` is enabled

#### Production (Nginx)
Add to your server block:
```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

### Step 4: Access Application

Open browser: http://localhost:8000

## 📋 Features Available

- ✅ **Play Game** - Questions from Wikidata
- ✅ **Leaderboard** - Top scores
- ✅ **User Profiles** - Stats and history
- ⏳ **Authentication** - Requires OAuth setup (optional)

## 🔐 Optional: Setup Wikimedia OAuth

1. Go to https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration
2. Register new OAuth 1.0a consumer
3. Add credentials to `.env`:
```env
OAUTH_CONSUMER_KEY=your_key
OAUTH_CONSUMER_SECRET=your_secret
OAUTH_CALLBACK_URL=http://localhost:8000/api/auth/callback
```

## 🧪 Test the Installation

### Test Database Connection
```bash
php -r "
require 'lib/database.php';
try {
    \$db = Database::getInstance();
    echo 'Database connection: OK\n';
} catch (Exception \$e) {
    echo 'Database error: ' . \$e->getMessage() . '\n';
}
"
```

### Test Wikidata API
Open: http://localhost:8000/api/question?level=1

Should return JSON with a question.

### Test Game
Open: http://localhost:8000/play

Should display the game interface.

## 📁 Directory Structure

```
php-app/
├── lib/           # Core libraries (router, database, auth, etc.)
├── public/        # Web root (CSS, JS, index.php)
├── src/           # Controllers and views
├── scripts/       # Database migration
├── .env           # Your configuration (not in git)
└── README.md      # Full documentation
```

## 🐛 Troubleshooting

### "Database connection failed"
- Check MySQL is running: `sudo service mysql status`
- Verify credentials in `.env`
- Ensure database exists

### "404 Not Found" on routes
- **Apache**: Enable mod_rewrite: `sudo a2enmod rewrite`
- **Nginx**: Check location block configuration
- Verify `.htaccess` file exists in `public/`

### "Headers already sent"
- Ensure no output before PHP tags
- Check for BOM in files: `find . -name "*.php" -exec sed -i '1s/^\xEF\xBB\xBF//' {} \;`

### Questions not loading
- Check Wikidata API is accessible: `curl https://query.wikidata.org/sparql`
- Fallback questions should still work

## 📝 What's Different from Next.js Version?

| Feature | Next.js | PHP 8.4 |
|---------|---------|---------|
| Dependencies | 100+ npm packages | 0 |
| Build Required | Yes | No |
| Framework | React | Pure PHP |
| CSS | Tailwind | Pure CSS |
| Database | Prisma | PDO |
| Auth | NextAuth | OAuth 1.0a |

## 🎯 Next Steps

1. **Customize**: Edit templates in `src/Controllers/`
2. **Style**: Modify `public/css/style.css`
3. **Extend**: Add new routes in `public/index.php`
4. **Deploy**: Follow README.md production guide

## 📚 More Information

- Full documentation: `README.md`
- Migration details: `../MIGRATION_TO_PHP84.md`
- Original Next.js version: `../` (parent directory)

## 💡 Tips

- Use `APP_DEBUG=true` in `.env` for development
- Session data stored in PHP's default session directory
- Logs go to PHP error log (check php.ini for location)
- Add custom routes by editing `public/index.php`

## 🆘 Need Help?

Common issues and solutions are in README.md under "Troubleshooting"

Happy coding! 🎉
