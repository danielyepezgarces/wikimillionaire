# Database Setup - MariaDB Migration

This document describes the MariaDB database setup and configuration for WikiMillionaire.

## Database Configuration

The application now uses **MariaDB** (or MySQL) as its primary database, configured via the `mysql2` package.

### Environment Variables Required

You can configure the database connection in two ways:

#### Option 1: Individual Connection Parameters

Set the following environment variables:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=wikimillionaire
```

#### Option 2: Connection String

Alternatively, you can use a single connection URL:

```
DATABASE_URL=mysql://user:password@host:port/database
```

**Note:** If `DATABASE_URL` is provided, it takes precedence over individual connection parameters.

### Environment Variables File

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Then edit `.env` with your actual database credentials.

### Database Schema

The application uses the following tables:

#### 1. Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  wikimedia_id VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  avatar_url TEXT,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

#### 2. Sessions Table
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

#### 3. Scores Table (for Leaderboard)
```sql
CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### Indexes for Performance
```sql
CREATE INDEX IF NOT EXISTS idx_scores_username ON scores(username);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at);
```

## Database Initialization

To initialize the database schema, run:

```bash
npm run init-db
```

Or manually execute:

```typescript
import { initializeDatabase } from '@/lib/db'

await initializeDatabase()
```

## Setting Up MariaDB Locally

### Installation

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mariadb-server
sudo mysql_secure_installation
```

#### On macOS (with Homebrew):
```bash
brew install mariadb
brew services start mariadb
```

#### On Windows:
Download and install from [MariaDB Downloads](https://mariadb.org/download/)

### Creating the Database

After installing MariaDB, create the database:

```sql
CREATE DATABASE wikimillionaire;
CREATE USER 'your_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON wikimillionaire.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update your `.env` file with the credentials.

## Leaderboard Functionality

The leaderboard tracks user scores across different time periods:

- **Daily**: Resets every day at midnight
- **Weekly**: Resets every Monday at midnight
- **Monthly**: Resets on the 1st of each month
- **All-time**: Never resets

### Saving Scores

```typescript
import { saveScore } from '@/lib/scores'

await saveScore(username, score)
```

### Retrieving Leaderboard

```typescript
import { getLeaderboard } from '@/lib/scores'

const dailyLeaderboard = await getLeaderboard('daily', 10)
const weeklyLeaderboard = await getLeaderboard('weekly', 10)
const monthlyLeaderboard = await getLeaderboard('monthly', 10)
const allTimeLeaderboard = await getLeaderboard('all', 10)
```

## Connection Pooling

MariaDB connection pooling is automatically handled by the `mysql2` package. The configuration includes:

- Connection pool management for better performance
- Automatic reconnection on connection loss
- Support for both connection string and individual parameters

## Performance Considerations

1. **Indexes**: The scores table has indexes on `username` and `created_at` for efficient queries
2. **Connection Caching**: Enabled via `neonConfig.fetchConnectionCache`
3. **Query Optimization**: Time-filtered queries use indexed columns
4. **Fallback to localStorage**: Client-side fallback when database is unavailable

## Testing Database Connection

To verify the database connection:

1. Ensure database environment variables are set in `.env`
2. Start MariaDB service
3. Run the initialization script: `npm run init-db`
4. Check application logs for successful connection

## Migration from Previous Database

If migrating from a PostgreSQL database (NeonDB):

1. Export existing data from PostgreSQL database
2. Install and configure MariaDB
3. Update environment variables in `.env` to point to MariaDB
4. Run `initializeDatabase()` to create schema
5. Import data using standard MySQL tools or custom migration scripts

**Note:** The application has been updated to use MariaDB-compatible SQL syntax. The query function automatically converts PostgreSQL-style placeholders ($1, $2, etc.) to MySQL-style (?) for backward compatibility.

## Troubleshooting

### Connection Issues

- Verify database environment variables are correctly set in `.env`
- Ensure MariaDB service is running
- Check firewall rules allow connections to MariaDB port (default 3306)
- Verify database user has proper permissions

### Schema Issues

- Run `initializeDatabase()` to ensure all tables exist
- Check MariaDB logs for error messages
- Verify MariaDB version is 10.3+ or MySQL 5.7+

### Performance Issues

- Check query performance using MariaDB's slow query log
- Verify indexes are created properly
- Monitor connection pool usage
- Consider optimizing MariaDB configuration

## Support

For MariaDB-specific issues, consult:
- [MariaDB Documentation](https://mariadb.org/documentation/)
- [mysql2 Package Documentation](https://github.com/sidorares/node-mysql2)
