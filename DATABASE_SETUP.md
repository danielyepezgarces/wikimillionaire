# Database Setup - NeonDB Migration

This document describes the NeonDB database setup and migration for WikiMillionaire.

## Database Configuration

The application now uses **NeonDB** as its primary database, configured via the `@neondatabase/serverless` package.

### Environment Variables Required

Set the following environment variable in your deployment:

```
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

This URL should point to your NeonDB instance.

**Note:** The application also supports the legacy `DB_POSTGRES_URL` environment variable for backward compatibility, but `DATABASE_URL` is the standard and recommended option, especially for platforms like Vercel.

### Database Schema

The application uses the following tables:

#### 1. Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  wikimedia_id VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  avatar_url TEXT,
  last_login TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### 2. Sessions Table
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

#### 3. Scores Table (for Leaderboard)
```sql
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
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

NeonDB automatically handles connection pooling. The configuration includes:

- `fetchConnectionCache: true` - Enables caching for better performance
- HTTP-based connections via `drizzle-orm/neon-http`
- Automatic retry logic for transient failures

## Performance Considerations

1. **Indexes**: The scores table has indexes on `username` and `created_at` for efficient queries
2. **Connection Caching**: Enabled via `neonConfig.fetchConnectionCache`
3. **Query Optimization**: Time-filtered queries use indexed columns
4. **Fallback to localStorage**: Client-side fallback when database is unavailable

## Testing Database Connection

To verify the database connection:

1. Ensure `DATABASE_URL` environment variable is set
2. Run the initialization script
3. Check application logs for successful connection

## Migration from Previous Database

If migrating from a previous database:

1. Export existing data from old database
2. Create NeonDB instance
3. Update `DATABASE_URL` environment variable
4. Run `initializeDatabase()` to create schema
5. Import data using standard PostgreSQL tools or custom migration scripts

## Troubleshooting

### Connection Issues

- Verify `DATABASE_URL` is correctly set
- Ensure NeonDB instance is running and accessible
- Check firewall rules allow connections from your deployment platform

### Schema Issues

- Run `initializeDatabase()` to ensure all tables exist
- Check database logs in NeonDB dashboard
- Verify PostgreSQL version compatibility (NeonDB uses PostgreSQL 14+)

### Performance Issues

- Check query performance in NeonDB dashboard
- Verify indexes are created properly
- Monitor connection pool usage
- Consider upgrading NeonDB plan if needed

## Support

For NeonDB-specific issues, consult:
- [NeonDB Documentation](https://neon.tech/docs)
- [NeonDB Serverless Package](https://github.com/neondatabase/serverless)
